import { NextRequest, NextResponse } from "next/server";
import { exchangeCode } from "@/lib/keycloak";
import { upsertUser } from "@/lib/db";
import { clearOauthState, createSession, readOauthState } from "@/lib/session";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const oauthState = await readOauthState();
  if (!oauthState) {
    return NextResponse.redirect(new URL("/login?err=nostate", env.APP_ORIGIN));
  }

  try {
    const claims = await exchangeCode({
      url: new URL(req.url),
      state: oauthState.state,
      codeVerifier: oauthState.codeVerifier,
      nonce: oauthState.nonce,
    });
    const user = await upsertUser({
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
    });
    await createSession({
      uid: user.id,
      sub: claims.sub,
      email: claims.email,
      name: claims.name,
    });
    await clearOauthState();
    return NextResponse.redirect(new URL("/chat", env.APP_ORIGIN));
  } catch (err) {
    await clearOauthState();
    const msg = err instanceof Error ? err.message : "oauth_failed";
    return NextResponse.redirect(
      new URL(`/login?err=${encodeURIComponent(msg)}`, env.APP_ORIGIN)
    );
  }
}
