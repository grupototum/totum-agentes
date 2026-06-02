import { NextResponse } from "next/server";
import { buildAuthUrl } from "@/lib/keycloak";
import { setOauthState } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const { url, state, codeVerifier, nonce } = await buildAuthUrl();
  await setOauthState({ state, codeVerifier, nonce });
  return NextResponse.redirect(url);
}
