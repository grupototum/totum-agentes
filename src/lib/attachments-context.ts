import "server-only";

import { query } from "./db";
import { readMarkdown, type AttachmentRow } from "./uploads";

/**
 * Valida que cada attachment pertence ao user E (se conv setada) à conversa correta,
 * AINDA não tem message_id setado (não foi consumido em outro turn).
 * Retorna as rows válidas.
 */
export async function loadOwnedAttachments(
  userId: string,
  ids: string[],
  conversationId: string | null
): Promise<AttachmentRow[]> {
  if (ids.length === 0) return [];
  // Deduplica + valida formato UUID grosseiro
  const clean = Array.from(new Set(ids.filter((x) => typeof x === "string" && x.length === 36)));
  if (clean.length === 0) return [];

  const { rows } = await query<AttachmentRow>(
    `SELECT * FROM attachments
     WHERE id = ANY($1::uuid[])
       AND user_id = $2
       AND message_id IS NULL
       AND ($3::uuid IS NULL OR conversation_id IS NULL OR conversation_id = $3)`,
    [clean, userId, conversationId]
  );
  return rows;
}

/**
 * Vincula attachments a uma message recém-criada + seta conversation_id se ainda null.
 * UPDATE atômico em uma query.
 */
export async function linkAttachmentsToMessage(
  attachmentIds: string[],
  messageId: string,
  conversationId: string
): Promise<void> {
  if (attachmentIds.length === 0) return;
  await query(
    `UPDATE attachments
        SET message_id = $1,
            conversation_id = COALESCE(conversation_id, $2)
      WHERE id = ANY($3::uuid[])`,
    [messageId, conversationId, attachmentIds]
  );
}

/**
 * Lista attachments vinculados a um conjunto de message_ids.
 * Usado no GET /api/conversations/[id]/messages pra hidratar bubbles.
 */
export async function attachmentsByMessages(
  messageIds: string[]
): Promise<Map<string, AttachmentRow[]>> {
  const map = new Map<string, AttachmentRow[]>();
  if (messageIds.length === 0) return map;
  const { rows } = await query<AttachmentRow>(
    `SELECT * FROM attachments
       WHERE message_id = ANY($1::uuid[])
       ORDER BY created_at ASC`,
    [messageIds]
  );
  for (const r of rows) {
    if (!r.message_id) continue;
    const arr = map.get(r.message_id) ?? [];
    arr.push(r);
    map.set(r.message_id, arr);
  }
  return map;
}

/**
 * Monta o prefixo de contexto pra mandar ao agente.
 * - Markdown: inline com header/footer
 * - Imagem: meta textual (CLI openclaw não é multimodal; decisão (iii) do briefing)
 *
 * Retorna string para concatenar com o `user.content` no body do CLI.
 */
export async function buildAgentContext(attachments: AttachmentRow[]): Promise<string> {
  if (attachments.length === 0) return "";
  const blocks: string[] = [];

  for (const att of attachments) {
    if (att.kind === "markdown") {
      const md = await readMarkdown(att.storage_path);
      blocks.push(
        `--- ANEXO MARKDOWN: ${att.original_name} (${att.size_bytes} bytes) ---\n${md}\n--- FIM ANEXO ---`
      );
    } else {
      blocks.push(
        `[ANEXO IMAGEM: ${att.original_name}, ${att.mime_type}, ${att.size_bytes} bytes — descrita pelo usuário abaixo]`
      );
    }
  }

  return blocks.join("\n\n") + "\n\n";
}
