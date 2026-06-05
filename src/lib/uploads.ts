import "server-only";

import { mkdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { createReadStream, type ReadStream } from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";

import { query } from "./db";

/**
 * Diretório raiz dos uploads. Single-tenant (agentes-ui).
 * Override via env UPLOADS_ROOT (útil pra testes locais).
 */
export const UPLOADS_ROOT =
  process.env.UPLOADS_ROOT ?? "/home/totum/totum-agentes/uploads";

/** Limites HARD do brief PR C. */
export const LIMITS = {
  /** Bytes por arquivo. */
  MAX_FILE_BYTES: 10 * 1024 * 1024, // 10 MB
  /** Anexos por turn (validado no client + server). */
  MAX_PER_TURN: 5,
  /** Bytes acumulados por user/dia. */
  MAX_DAILY_BYTES: 100 * 1024 * 1024, // 100 MB
  /** Uploads por hora por user (rate-limit). */
  MAX_UPLOADS_PER_HOUR: 30,
  /** Markdown content max — evita prompt blow-up no CLI Pepper. */
  MAX_MARKDOWN_BYTES: 100 * 1024, // 100 KB
} as const;

/**
 * Whitelist canônica. NUNCA blacklist (decisão brief).
 * Mapeamento mime → ext canônica (usada no storage_path).
 */
const ALLOWED: Record<string, { ext: string; kind: "image" | "markdown" }> = {
  "image/png": { ext: "png", kind: "image" },
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "image/gif": { ext: "gif", kind: "image" },
  "text/markdown": { ext: "md", kind: "markdown" },
  "text/plain": { ext: "md", kind: "markdown" }, // .md geralmente sobe como text/plain
};

export type AttachmentKind = "image" | "markdown";

export interface AttachmentRow {
  id: string;
  user_id: string;
  message_id: string | null;
  conversation_id: string | null;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  kind: AttachmentKind;
  exif_stripped: boolean;
  created_at: string;
}

export class UploadError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

/**
 * Resolve path absoluto a partir do relative storage_path.
 * Path traversal: chama realpath e exige prefixo UPLOADS_ROOT.
 * Lança UploadError(500, "path_outside_root") se escapar.
 */
export async function resolveStoragePath(relative: string): Promise<string> {
  const abs = path.resolve(UPLOADS_ROOT, relative);
  const real = await realpath(abs);
  const rootReal = await realpath(UPLOADS_ROOT);
  if (!real.startsWith(rootReal + path.sep) && real !== rootReal) {
    throw new UploadError(500, "path_outside_root", "Storage path escaped root");
  }
  return real;
}

/**
 * Garante dir aninhado existe com perms 0750.
 */
async function ensureDir(absDir: string): Promise<void> {
  await mkdir(absDir, { recursive: true, mode: 0o750 });
}

/**
 * Gera storage_path relativo: {kc_sub}/{YYYY-MM-DD}/{uuid}.{ext}
 * Sanitiza kc_sub pra evitar `..` / `/` injection.
 */
function buildStoragePath(kcSub: string, ext: string): {
  relative: string;
  uuid: string;
  dateDir: string;
} {
  const safeSub = kcSub.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  if (!safeSub) throw new UploadError(400, "bad_user", "Invalid kc_sub");
  const date = new Date();
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const dateDir = `${yyyy}-${mm}-${dd}`;
  const uuid = randomUUID();
  const relative = `${safeSub}/${dateDir}/${uuid}.${ext}`;
  return { relative, uuid, dateDir };
}

/**
 * Sanitiza nome original do arquivo. Path components removidos, comprimento limitado.
 */
export function sanitizeOriginalName(name: string): string {
  const base = path.basename(name).slice(0, 200);
  // remove caracteres de controle e null bytes
  return base.replace(/[\x00-\x1f\x7f]/g, "").trim() || "anexo";
}

/**
 * Detecta tipo real do conteúdo via magic bytes.
 * Retorna entry da whitelist ou null se não permitido.
 *
 * Pra markdown texto puro: file-type não detecta. Caímos no fallback heurístico
 * (header MIME do upload `text/markdown|text/plain` + tem caracteres legíveis).
 */
export async function detectKind(
  buf: Buffer,
  declaredMime: string,
  originalName: string
): Promise<{ ext: string; kind: AttachmentKind; mime: string } | null> {
  const sniffed = await fileTypeFromBuffer(buf);
  if (sniffed && ALLOWED[sniffed.mime]) {
    return { ...ALLOWED[sniffed.mime], mime: sniffed.mime };
  }

  // Markdown / texto puro: file-type não retorna nada confiável
  if (
    (declaredMime === "text/markdown" ||
      declaredMime === "text/plain" ||
      originalName.toLowerCase().endsWith(".md")) &&
    isLikelyText(buf)
  ) {
    return { ext: "md", kind: "markdown", mime: "text/markdown" };
  }

  return null;
}

/**
 * Heurística rápida: <2% bytes não-ASCII printable (sem null bytes).
 * Evita aceitar binário disfarçado como text/markdown.
 */
function isLikelyText(buf: Buffer): boolean {
  const sample = buf.subarray(0, Math.min(buf.length, 4096));
  if (sample.includes(0)) return false; // null bytes = binário
  let bad = 0;
  for (const b of sample) {
    if (b < 0x09 || (b > 0x0d && b < 0x20) || b === 0x7f) bad++;
  }
  return bad / Math.max(sample.length, 1) < 0.02;
}

/**
 * Strip EXIF de imagens via sharp.
 * Mantém orientação (auto-rotate) — `withMetadata({})` reseta tudo exceto orientation.
 * GIF: passa direto (sharp não streama animação corretamente; risco baixo).
 */
export async function processImage(
  buf: Buffer,
  mime: string
): Promise<{ buffer: Buffer; exifStripped: boolean }> {
  if (mime === "image/gif") {
    // Sharp não preserva animação fácil; deixamos passar sem strip
    return { buffer: buf, exifStripped: false };
  }
  try {
    const out = await sharp(buf, { failOn: "error" })
      .rotate() // applies EXIF orientation then drops it
      .withMetadata({}) // reset metadata
      .toBuffer();
    return { buffer: out, exifStripped: true };
  } catch {
    // Se sharp falhar (corrupto), recusa
    throw new UploadError(400, "image_invalid", "Imagem corrompida ou inválida");
  }
}

/**
 * Persiste arquivo no disco + linha em attachments.
 * Devolve a row criada. Mensagem ainda não existe — message_id null.
 */
export async function persistAttachment(input: {
  userId: string;
  kcSub: string;
  conversationId?: string | null;
  buffer: Buffer;
  mime: string;
  ext: string;
  kind: AttachmentKind;
  originalName: string;
  exifStripped: boolean;
}): Promise<AttachmentRow> {
  const { relative, uuid } = buildStoragePath(input.kcSub, input.ext);
  const absFile = path.join(UPLOADS_ROOT, relative);
  const absDir = path.dirname(absFile);
  await ensureDir(absDir);
  await writeFile(absFile, input.buffer, { mode: 0o600 });
  // sidecar .meta.json — útil pra debug + restore se DB se perder
  await writeFile(
    absFile + ".meta.json",
    JSON.stringify({
      uuid,
      originalName: input.originalName,
      mime: input.mime,
      size: input.buffer.length,
      exifStripped: input.exifStripped,
      createdAt: new Date().toISOString(),
    }),
    { mode: 0o600 }
  );

  const { rows } = await query<AttachmentRow>(
    `INSERT INTO attachments
       (user_id, conversation_id, original_name, mime_type, size_bytes, storage_path, kind, exif_stripped)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      input.userId,
      input.conversationId ?? null,
      input.originalName,
      input.mime,
      input.buffer.length,
      relative,
      input.kind,
      input.exifStripped,
    ]
  );
  return rows[0];
}

/**
 * Soma bytes uploaded nas últimas 24h por user.
 */
export async function dailyBytesUsed(userId: string): Promise<number> {
  const { rows } = await query<{ used: string | null }>(
    `SELECT COALESCE(SUM(size_bytes), 0)::text AS used
       FROM attachments
      WHERE user_id = $1
        AND created_at > now() - interval '24 hours'`,
    [userId]
  );
  return Number(rows[0]?.used ?? 0);
}

/**
 * Stream pra serve route. Caller é responsável por enviar status + headers.
 * Path traversal já validado em resolveStoragePath.
 */
export async function openAttachmentStream(
  storagePath: string
): Promise<{ stream: ReadStream; size: number }> {
  const abs = await resolveStoragePath(storagePath);
  const s = await stat(abs);
  return { stream: createReadStream(abs), size: s.size };
}

/**
 * Lê markdown completo pra inline no prompt do agente.
 */
export async function readMarkdown(storagePath: string): Promise<string> {
  const abs = await resolveStoragePath(storagePath);
  const buf = await readFile(abs);
  if (buf.length > LIMITS.MAX_MARKDOWN_BYTES) {
    return buf.subarray(0, LIMITS.MAX_MARKDOWN_BYTES).toString("utf8") +
      "\n\n[...truncado por tamanho máximo de markdown]";
  }
  return buf.toString("utf8");
}
