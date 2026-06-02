import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/agents";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ agents: AGENTS });
}
