import "server-only";
import * as oauth from "oauth4webapi";
import { env } from "./env";

let cached: { as: oauth.AuthorizationServer; expiresAt: number } | null = null;

export async function getAS(): Promise<oauth.AuthorizationServer> {
  if (cached && cached.expiresAt > Date.now()) return cached.as;
  const issuer = new URL(env.KEYCLOAK_ISSUER);
  const res = await oauth.discoveryRequest(issuer, { algorithm: "oidc" });
  const as = await oauth.processDiscoveryResponse(issuer, res);
  cached = { as, expiresAt: Date.now() + 5 * 60_000 };
  return as;
}

export function client(): oauth.Client {
  return { client_id: env.KEYCLOAK_CLIENT_ID, token_endpoint_auth_method: "none" };
}

export async function buildAuthUrl(): Promise<{
  url: string;
  state: string;
  codeVerifier: string;
  nonce: string;
}> {
  const as = await getAS();
  if (!as.authorization_endpoint) throw new Error("Keycloak missing authorization_endpoint");
  const codeVerifier = oauth.generateRandomCodeVerifier();
  const codeChallenge = await oauth.calculatePKCECodeChallenge(codeVerifier);
  const state = oauth.generateRandomState();
  const nonce = oauth.generateRandomNonce();
  const url = new URL(as.authorization_endpoint);
  url.searchParams.set("client_id", env.KEYCLOAK_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.KEYCLOAK_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  return { url: url.toString(), state, codeVerifier, nonce };
}

export async function exchangeCode(input: {
  url: URL;
  state: string;
  codeVerifier: string;
  nonce: string;
}): Promise<{
  sub: string;
  email: string | null;
  name: string | null;
  idToken: string;
}> {
  const as = await getAS();
  const params = oauth.validateAuthResponse(as, client(), input.url, input.state);
  const noneAuth = oauth.None();
  const tokenRes = await oauth.authorizationCodeGrantRequest(
    as,
    client(),
    noneAuth,
    params,
    env.KEYCLOAK_REDIRECT_URI,
    input.codeVerifier
  );
  const tokens = await oauth.processAuthorizationCodeResponse(as, client(), tokenRes, {
    expectedNonce: input.nonce,
    requireIdToken: true,
  });
  const claims = oauth.getValidatedIdTokenClaims(tokens);
  if (!claims) throw new Error("No id_token claims");
  return {
    sub: String(claims.sub),
    email: (claims.email as string | undefined) ?? null,
    name:
      (claims.name as string | undefined) ??
      (claims.preferred_username as string | undefined) ??
      null,
    idToken: tokens.id_token as string,
  };
}

export async function endSessionUrl(idToken?: string): Promise<string | null> {
  const as = await getAS();
  if (!as.end_session_endpoint) return null;
  const url = new URL(as.end_session_endpoint);
  if (idToken) url.searchParams.set("id_token_hint", idToken);
  if (env.KEYCLOAK_POST_LOGOUT_URI)
    url.searchParams.set("post_logout_redirect_uri", env.KEYCLOAK_POST_LOGOUT_URI);
  return url.toString();
}
