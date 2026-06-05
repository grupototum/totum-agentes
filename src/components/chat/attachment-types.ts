/**
 * Tipos compartilhados entre AttachmentInput / Preview / Render.
 */
export type AttachmentKind = "image" | "markdown";

export interface AttachmentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  kind: AttachmentKind;
  url: string;
}

/** Item em progresso no preview (pré-envio) */
export interface PendingAttachment {
  /** ID local até o upload completar (substituído pelo do server). */
  localId: string;
  file: File;
  /** Set após sucesso do upload. */
  serverId?: string;
  url?: string;
  kind?: AttachmentKind;
  progress: number; // 0-100
  error?: string;
  status: "uploading" | "done" | "error";
}

export const ATTACHMENT_LIMITS = {
  MAX_FILE_BYTES: 10 * 1024 * 1024,
  MAX_PER_TURN: 5,
  ALLOWED_MIME: ["image/png", "image/jpeg", "image/webp", "image/gif", "text/markdown", "text/plain"],
  ALLOWED_EXT: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".md"],
} as const;

export function isAcceptable(file: File): { ok: true } | { ok: false; reason: string } {
  if (file.size > ATTACHMENT_LIMITS.MAX_FILE_BYTES) {
    return { ok: false, reason: `Arquivo maior que ${ATTACHMENT_LIMITS.MAX_FILE_BYTES / 1024 / 1024}MB` };
  }
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  const okExt = ATTACHMENT_LIMITS.ALLOWED_EXT.some((e) => e === ext);
  const okMime = ATTACHMENT_LIMITS.ALLOWED_MIME.some((m) => m === file.type);
  if (!okExt && !okMime) {
    return { ok: false, reason: "Tipo não suportado (use .md ou imagem)" };
  }
  return { ok: true };
}

export function bytesPretty(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}
