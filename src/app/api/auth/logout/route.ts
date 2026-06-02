import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { endSessionUrl } from "@/lib/keycloak";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  await clearSession();
  const url = await endSessionUrl();
  return NextResponse.redirect(url ?? new URL("/login", env.APP_ORIGIN));
}
