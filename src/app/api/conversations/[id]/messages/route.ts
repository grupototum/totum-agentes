import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { attachmentsByMessages } from "@/lib/attachments-context";
import type { AttachmentRow } from "@/lib/uploads";

export const dynamic = "force-dynamic";

interface MessageRow {
  id: string;
  role: string;
  content: string;
  agent_id: string | null;
  created_at: string;
}

interface MessageWithAttachments extends MessageRow {
  attachments: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    kind: AttachmentRow["kind"];
    url: string;
  }>;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const owns = await query<{ id: string }>(
    `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
    [id, session.uid]
  );
  if (owns.rows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const { rows } = await query<MessageRow>(
    `SELECT id, role, content, agent_id, created_at
     FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
    [id]
  );

  const attMap = await attachmentsByMessages(rows.map((m) => m.id));
  const withAtts: MessageWithAttachments[] = rows.map((m) => ({
    ...m,
    attachments: (attMap.get(m.id) ?? []).map((a) => ({
      id: a.id,
      name: a.original_name,
      size: a.size_bytes,
      type: a.mime_type,
      kind: a.kind,
      url: `/api/uploads/${a.id}`,
    })),
  }));

  return NextResponse.json({ messages: withAtts });
}
