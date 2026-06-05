import { NextRequest } from "next/server";
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

function sseEncode(event: string, data: unknown): Uint8Array {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(payload);
}

/**
 * SSE streaming endpoint pra resposta do agente.
 *
 * Pepper CLI não suporta --stream nativo. Estratégia:
 * - emite "pulse" a cada 2s enquanto turn não termina (UI mostra "pensando…")
 * - quando turn termina, faz chunked write da resposta word-by-word
 *   (micro-delay 18ms entre chunks pra efeito ChatGPT)
 * - emite "done" com message_id + created_at no final
 *
 * Anexos (PR C):
 * - attachment_ids[] no body são linkados à user message + injetados como
 *   contexto no prompt do agente via buildAgentContext()
 */
export async function POST(req: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return new Response("invalid_json", { status: 400 });
  }

  const agentId = String(body.agent_id ?? "").trim();
  const content = String(body.content ?? "").trim();
  const attachmentIds = Array.isArray(body.attachment_ids) ? body.attachment_ids : [];

  if (!agentId || !content) {
    return new Response("missing_fields", { status: 400 });
  }
  if (attachmentIds.length > LIMITS.MAX_PER_TURN) {
    return new Response("too_many_attachments", { status: 400 });
  }
  const agent = findAgent(agentId);
  if (!agent) {
    return new Response("unknown_agent", { status: 400 });
  }

  // Conversation: cria ou valida
  let conversationId = body.conversation_id ?? null;
  if (conversationId) {
    const owns = await query<{ id: string }>(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, session.uid]
    );
    if (owns.rows.length === 0) {
      return new Response("conversation_not_found", { status: 404 });
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

  // Carrega attachments + valida ownership + conversa (antes da escrita)
  const ownedAttachments = await loadOwnedAttachments(
    session.uid,
    attachmentIds,
    conversationId
  );
  if (ownedAttachments.length !== attachmentIds.length) {
    return new Response("invalid_attachments", { status: 400 });
  }

  // Persiste user message + vincula attachments
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

  // Monta prompt com contexto dos attachments
  const ctx = await buildAgentContext(ownedAttachments);
  const promptForAgent = ctx + content;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(sseEncode(event, data));
        } catch {
          // controller closed
        }
      };

      send("meta", {
        conversation_id: conversationId,
        user_message_id: userMsg.rows[0].id,
      });

      // Pulse interval enquanto turn não termina
      let pulseCount = 0;
      const pulseTimer = setInterval(() => {
        pulseCount += 1;
        send("pulse", { tick: pulseCount });
      }, 2000);

      let agentText = "";
      let agentErr: string | null = null;
      try {
        const res = await askAgent({ agentId, message: promptForAgent });
        agentText = res.content || "(sem resposta)";
      } catch (err) {
        agentErr = err instanceof Error ? err.message : "gateway_error";
      } finally {
        clearInterval(pulseTimer);
      }

      if (agentErr) {
        send("error", { detail: agentErr });
        await query(
          `INSERT INTO messages (conversation_id, role, content, agent_id)
           VALUES ($1, 'system', $2, $3)`,
          [conversationId, `Erro: ${agentErr}`, agentId]
        );
        await query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [conversationId]);
        controller.close();
        return;
      }

      const inserted = await query<{ id: string; created_at: string }>(
        `INSERT INTO messages (conversation_id, role, content, agent_id)
         VALUES ($1, 'assistant', $2, $3)
         RETURNING id, created_at`,
        [conversationId, agentText, agentId]
      );
      await query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [conversationId]);

      const tokens = agentText.match(/\S+\s*|\s+/g) ?? [agentText];
      send("start", { message_id: inserted.rows[0].id });
      for (const tok of tokens) {
        send("chunk", { text: tok });
        await new Promise((r) => setTimeout(r, 18));
      }
      send("done", {
        message_id: inserted.rows[0].id,
        created_at: inserted.rows[0].created_at,
      });
      controller.close();
    },
    cancel() {
      // client disconnected — nothing to clean
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
