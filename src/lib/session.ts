import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { env } from "./env";

const COOKIE_NAME = "totum_sess";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8h

export interface Session {
  uid: string;
  sub: string;
  email?: string | null;
  name?: string | null;
}

const key = new TextEncoder().encode(env.SESSION_SECRET);

export async function createSession(s: Session): Promise<void> {
  const token = await new SignJWT(s as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    .sign(key);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.APP_ORIGIN.startsWith("https://"),
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, key);
    return {
      uid: String(payload.uid),
      sub: String(payload.sub ?? payload.sub),
      email: (payload.email as string | null) ?? null,
      name: (payload.name as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

const OAUTH_STATE_COOKIE = "totum_oauth";

export async function setOauthState(data: {
  state: string;
  codeVerifier: string;
  nonce: string;
}): Promise<void> {
  const token = await new SignJWT(data)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(key);
  const jar = await cookies();
  jar.set(OAUTH_STATE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.APP_ORIGIN.startsWith("https://"),
    path: "/",
    maxAge: 600,
  });
}

export async function readOauthState(): Promise<{
  state: string;
  codeVerifier: string;
  nonce: string;
} | null> {
  const jar = await cookies();
  const raw = jar.get(OAUTH_STATE_COOKIE)?.value;
  if (!raw) return null;
  try {
    const { payload } = await jwtVerify(raw, key);
    return {
      state: String(payload.state),
      codeVerifier: String(payload.codeVerifier),
      nonce: String(payload.nonce),
    };
  } catch {
    return null;
  }
}

export async function clearOauthState(): Promise<void> {
  const jar = await cookies();
  jar.delete(OAUTH_STATE_COOKIE);
}
