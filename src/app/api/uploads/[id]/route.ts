import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import {
  openAttachmentStream,
  UploadError,
  type AttachmentRow,
} from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "private, max-age=86400, no-transform",
  "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'",
  "Referrer-Policy": "no-referrer",
};

function err(status: number, msg: string): Response {
  return new Response(msg, { status, headers: { ...SECURITY_HEADERS, "Content-Type": "text/plain" } });
}

/**
 * GET /api/uploads/[id]
 *
 * ACL:
 *   1. Sessão Keycloak válida
 *   2. attachment.user_id === session.uid
 *      OU
 *   3. attachment.conversation_id pertence ao session.uid (anexo compartilhado no chat)
 *
 * Path traversal: lib/uploads.resolveStoragePath() valida realpath dentro de UPLOADS_ROOT.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await getSession();
  if (!session) return err(401, "unauthorized");

  const { id } = await ctx.params;
  if (!UUID_RE.test(id)) return err(400, "invalid_id");

  const { rows } = await query<AttachmentRow>(
    `SELECT * FROM attachments WHERE id = $1`,
    [id]
  );
  if (rows.length === 0) return err(404, "not_found");

  const att = rows[0];

  // ACL — duas vias permitidas
  let allowed = att.user_id === session.uid;
  if (!allowed && att.conversation_id) {
    const owns = await query<{ id: string }>(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
      [att.conversation_id, session.uid]
    );
    allowed = owns.rows.length > 0;
  }
  if (!allowed) return err(403, "forbidden");

  // Abre stream do disco (path traversal validado dentro)
  let stream: Awaited<ReturnType<typeof openAttachmentStream>>;
  try {
    stream = await openAttachmentStream(att.storage_path);
  } catch (e) {
    if (e instanceof UploadError) return err(e.status, e.code);
    return err(500, "stream_failed");
  }

  // Markdown inline pra render no client (componente MessageContent)
  const dispositionType = att.kind === "markdown" ? "inline" : "inline";
  const encodedName = encodeURIComponent(att.original_name);

  // Converte Node ReadStream → Web ReadableStream
  const webStream = nodeToWeb(stream.stream);

  return new Response(webStream, {
    status: 200,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": att.mime_type,
      "Content-Length": String(stream.size),
      "Content-Disposition": `${dispositionType}; filename*=UTF-8''${encodedName}`,
    },
  });
}

/**
 * Bridge Node Readable → Web ReadableStream.
 * Next.js 15 aceita Web stream direto no Response body.
 */
function nodeToWeb(node: NodeJS.ReadableStream): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      node.on("data", (chunk) => {
        controller.enqueue(
          chunk instanceof Buffer
            ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
            : new TextEncoder().encode(String(chunk))
        );
      });
      node.on("end", () => controller.close());
      node.on("error", (e) => controller.error(e));
    },
    cancel() {
      (node as unknown as { destroy?: () => void }).destroy?.();
    },
  });
}
