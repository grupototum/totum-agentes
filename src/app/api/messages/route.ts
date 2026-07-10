import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { findAgent } from "@/lib/agents";
import { askAgent } from "@/lib/gateway";
import {
  buildAgentContext,
  linkAttachmentsToMessage,
  loadOwnedAttachments,
} from "@/lib/attachments-context";
import { LIMITS } from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface PostBody {
  agent_id?: string;
  content?: string;
  conversation_id?: string | null;
  attachment_ids?: string[];
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const agentId = String(body.agent_id ?? "").trim();
  const content = String(body.content ?? "").trim();
  const attachmentIds = Array.isArray(body.attachment_ids) ? body.attachment_ids : [];

  if (!agentId || !content) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  if (attachmentIds.length > LIMITS.MAX_PER_TURN) {
    return NextResponse.json(
      { error: "too_many_attachments", max: LIMITS.MAX_PER_TURN },
      { status: 400 }
    );
  }
  const agent = findAgent(agentId);
  if (!agent) {
    return NextResponse.json({ error: "unknown_agent" }, { status: 400 });
  }

  let conversationId = body.conversation_id ?? null;
  if (conversationId) {
    const owns = await query<{ id: string }>(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, session.uid]
    );
    if (owns.rows.length === 0) {
      return NextResponse.json({ error: "conversation_not_found" }, { status: 404 });
    }
  } else {
    const title = content.slice(0, 60);
    const { rows } = await query<{ id: string }>(
      `INSERT INTO conversations (user_id, agent_id, title)
       VALUES ($1, $2, $3) RETURNING id`,
      [session.uid, agentId, title]
    );
    conversationId = rows[0].id;
  }

  // Carrega + valida ownership dos attachments (antes de qualquer escrita)
  const ownedAttachments = await loadOwnedAttachments(
    session.uid,
    attachmentIds,
    conversationId
  );
  if (ownedAttachments.length !== attachmentIds.length) {
    return NextResponse.json(
      { error: "invalid_attachments", expected: attachmentIds.length, found: ownedAttachments.length },
      { status: 400 }
    );
  }

  // Persiste user message PRIMEIRO (pra ter message_id pros attachments)
  const userMsg = await query<{ id: string }>(
    `INSERT INTO messages (conversation_id, role, content, agent_id)
     VALUES ($1, 'user', $2, $3) RETURNING id`,
    [conversationId, content, agentId]
  );
  if (ownedAttachments.length > 0) {
    await linkAttachmentsToMessage(
      ownedAttachments.map((a) => a.id),
      userMsg.rows[0].id,
      conversationId
    );
  }

  // Monta prompt: contexto dos attachments + content do user
  const ctx = await buildAgentContext(ownedAttachments);
  const promptForAgent = ctx + content;

  let assistantContent: string;
  try {
    const res = await askAgent({ agentId, message: promptForAgent });
    assistantContent = res.content || "(sem resposta)";
  } catch (err) {
    const msg = err instanceof Error ? err.message : "gateway_error";
    await query(
      `INSERT INTO messages (conversation_id, role, content, agent_id)
       VALUES ($1, 'system', $2, $3)`,
      [conversationId, `Erro: ${msg}`, agentId]
    );
    await query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [conversationId]);
    return NextResponse.json({ error: "gateway_failed", detail: msg }, { status: 502 });
  }

  const inserted = await query<{ id: string; created_at: string }>(
    `INSERT INTO messages (conversation_id, role, content, agent_id)
     VALUES ($1, 'assistant', $2, $3)
     RETURNING id, created_at`,
    [conversationId, assistantContent, agentId]
  );
  await query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [conversationId]);

  return NextResponse.json({
    conversation_id: conversationId,
    user_message_id: userMsg.rows[0].id,
    message: {
      id: inserted.rows[0].id,
      role: "assistant",
      content: assistantContent,
      agent_id: agentId,
      created_at: inserted.rows[0].created_at,
    },
  });
}
