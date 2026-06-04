import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ConvDetail {
  id: string;
  agent_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { rows } = await query<ConvDetail>(
    `SELECT id, agent_id, title, created_at, updated_at
     FROM conversations WHERE id = $1 AND user_id = $2`,
    [id, session.uid]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ conversation: rows[0] });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  let body: { title?: string };
  try {
    body = (await req.json()) as { title?: string };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const title = typeof body.title === "string" ? body.title.trim().slice(0, 120) : null;
  if (!title) return NextResponse.json({ error: "missing_title" }, { status: 400 });

  const { rows } = await query<{ id: string }>(
    `UPDATE conversations SET title = $1, updated_at = now()
     WHERE id = $2 AND user_id = $3 RETURNING id`,
    [title, id, session.uid]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { rows } = await query<{ id: string }>(
    `DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, session.uid]
  );
  if (rows.length === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
