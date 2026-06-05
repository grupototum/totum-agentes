import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { query } from "@/lib/db";
import { hitRateLimit, remainingSlots } from "@/lib/rate-limit";
import {
  LIMITS,
  UploadError,
  dailyBytesUsed,
  detectKind,
  persistAttachment,
  processImage,
  sanitizeOriginalName,
} from "@/lib/uploads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Aumenta limite de body do Next pra acomodar até 10 MB por arquivo + overhead multipart
export const maxDuration = 30;

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
};

function json<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: { ...SECURITY_HEADERS, ...(init?.headers ?? {}) },
  });
}

/**
 * POST /api/uploads
 *
 * multipart/form-data:
 *   - file: 1 arquivo único (use múltiplas requests pro modo 5/turn)
 *   - conversation_id (opcional): se setado, anexo é pré-vinculado à conv
 *
 * Resposta:
 *   { id, url, name, size, type, kind, conversation_id }
 *   429 com retryAfterSec se quota/rate-limit excedidos.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return json({ error: "unauthorized" }, { status: 401 });
  }

  // Rate-limit por hora — consome 1 slot
  const rate = hitRateLimit(session.uid, LIMITS.MAX_UPLOADS_PER_HOUR);
  if (!rate.ok) {
    return json(
      { error: "rate_limit", code: "uploads_per_hour", retryAfterSec: rate.retryAfterSec },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSec) },
      }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "invalid_multipart" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return json({ error: "missing_file" }, { status: 400 });
  }

  // Tamanho limit
  if (file.size > LIMITS.MAX_FILE_BYTES) {
    return json(
      {
        error: "file_too_large",
        maxBytes: LIMITS.MAX_FILE_BYTES,
        actualBytes: file.size,
      },
      { status: 413 }
    );
  }

  // Quota diária (verifica ANTES de salvar)
  const usedToday = await dailyBytesUsed(session.uid);
  if (usedToday + file.size > LIMITS.MAX_DAILY_BYTES) {
    return json(
      {
        error: "daily_quota_exceeded",
        code: "daily_quota",
        usedTodayBytes: usedToday,
        limitDailyBytes: LIMITS.MAX_DAILY_BYTES,
      },
      { status: 429 }
    );
  }

  const conversationIdRaw = form.get("conversation_id");
  const conversationId =
    typeof conversationIdRaw === "string" && conversationIdRaw.length > 0
      ? conversationIdRaw
      : null;

  // Conversation membership check (se setado)
  if (conversationId) {
    const owns = await query<{ id: string }>(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2`,
      [conversationId, session.uid]
    );
    if (owns.rows.length === 0) {
      return json({ error: "conversation_not_found" }, { status: 404 });
    }
  }

  // Magic bytes + sniff
  const buf = Buffer.from(await file.arrayBuffer());
  const detected = await detectKind(buf, file.type, file.name);
  if (!detected) {
    return json(
      {
        error: "unsupported_type",
        detectedMime: file.type,
        allowed: ["image/png", "image/jpeg", "image/webp", "image/gif", "text/markdown"],
      },
      { status: 415 }
    );
  }

  // Markdown size limit adicional (evita prompt blow-up)
  if (detected.kind === "markdown" && buf.length > LIMITS.MAX_MARKDOWN_BYTES) {
    return json(
      {
        error: "markdown_too_large",
        maxBytes: LIMITS.MAX_MARKDOWN_BYTES,
        actualBytes: buf.length,
      },
      { status: 413 }
    );
  }

  // EXIF strip (somente imagens) — passa buffer normalizado
  let processedBuf = buf;
  let exifStripped = false;
  if (detected.kind === "image") {
    try {
      const out = await processImage(buf, detected.mime);
      processedBuf = out.buffer;
      exifStripped = out.exifStripped;
    } catch (err) {
      if (err instanceof UploadError) {
        return json({ error: err.code }, { status: err.status });
      }
      return json({ error: "image_processing_failed" }, { status: 500 });
    }
  }

  // Sanitiza nome
  const safeName = sanitizeOriginalName(file.name);

  try {
    const row = await persistAttachment({
      userId: session.uid,
      kcSub: session.sub,
      conversationId,
      buffer: processedBuf,
      mime: detected.mime,
      ext: detected.ext,
      kind: detected.kind,
      originalName: safeName,
      exifStripped,
    });

    return json(
      {
        id: row.id,
        url: `/api/uploads/${row.id}`,
        name: row.original_name,
        size: row.size_bytes,
        type: row.mime_type,
        kind: row.kind,
        conversation_id: row.conversation_id,
        exifStripped: row.exif_stripped,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof UploadError) {
      return json({ error: err.code }, { status: err.status });
    }
    const detail = err instanceof Error ? err.message : "unknown";
    return json({ error: "persist_failed", detail }, { status: 500 });
  }
}

/**
 * GET /api/uploads?op=quota
 * Retorna estado de quota do user (usado pelo client antes de mostrar progress bar).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return json({ error: "unauthorized" }, { status: 401 });
  }
  const op = req.nextUrl.searchParams.get("op");
  if (op !== "quota") {
    return json({ error: "bad_op" }, { status: 400 });
  }

  const usedToday = await dailyBytesUsed(session.uid);
  const remainingHour = remainingSlots(session.uid, LIMITS.MAX_UPLOADS_PER_HOUR);

  return json({
    usedTodayBytes: usedToday,
    limitDailyBytes: LIMITS.MAX_DAILY_BYTES,
    remainingDailyBytes: Math.max(0, LIMITS.MAX_DAILY_BYTES - usedToday),
    remainingUploadsThisHour: remainingHour,
    limits: {
      maxFileBytes: LIMITS.MAX_FILE_BYTES,
      maxPerTurn: LIMITS.MAX_PER_TURN,
      maxMarkdownBytes: LIMITS.MAX_MARKDOWN_BYTES,
    },
  });
}
