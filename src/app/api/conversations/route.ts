import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ConversationRow {
  id: string;
  agent_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const agentId = req.nextUrl.searchParams.get("agent_id");
  const params: unknown[] = [session.uid];
  let sql = `SELECT id, agent_id, title, created_at, updated_at
             FROM conversations WHERE user_id = $1`;
  if (agentId) {
    sql += ` AND agent_id = $2`;
    params.push(agentId);
  }
  sql += ` ORDER BY updated_at DESC LIMIT 50`;
  const { rows } = await query<ConversationRow>(sql, params);
  return NextResponse.json({ conversations: rows });
}
