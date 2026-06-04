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
  message_count: number;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const agentId = req.nextUrl.searchParams.get("agent_id");
  const scope = req.nextUrl.searchParams.get("scope"); // "all" | null
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 200);

  const params: unknown[] = [session.uid];
  let sql = `
    SELECT c.id, c.agent_id, c.title, c.created_at, c.updated_at,
           (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id)::int AS message_count
    FROM conversations c
    WHERE c.user_id = $1`;

  if (scope !== "all" && agentId) {
    sql += ` AND c.agent_id = $2`;
    params.push(agentId);
  }
  sql += ` ORDER BY c.updated_at DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const { rows } = await query<ConversationRow>(sql, params);
  return NextResponse.json({ conversations: rows });
}
