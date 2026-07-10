/**
 * Rate-limit in-memory por user (single instance pm2).
 * Sliding-window simples — guarda timestamps em ring buffer e drop > janela.
 */

interface Window {
  timestamps: number[]; // epoch ms
}

const STATE = new Map<string, Window>();
const HOUR_MS = 60 * 60 * 1000;

/**
 * Tenta consumir 1 slot. Retorna `{ ok: true }` se permitido,
 * `{ ok: false, retryAfterSec }` se atingiu o limite.
 */
export function hitRateLimit(
  userId: string,
  limit: number,
  windowMs: number = HOUR_MS,
  now: number = Date.now()
): { ok: true } | { ok: false; retryAfterSec: number } {
  const cutoff = now - windowMs;
  const slot = STATE.get(userId) ?? { timestamps: [] };
  // GC: descarta antigos
  const recent = slot.timestamps.filter((t) => t > cutoff);
  if (recent.length >= limit) {
    const oldest = recent[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    STATE.set(userId, { timestamps: recent });
    return { ok: false, retryAfterSec };
  }
  recent.push(now);
  STATE.set(userId, { timestamps: recent });
  return { ok: true };
}

/**
 * Quantos restantes na janela. Não consome.
 */
export function remainingSlots(
  userId: string,
  limit: number,
  windowMs: number = HOUR_MS,
  now: number = Date.now()
): number {
  const cutoff = now - windowMs;
  const slot = STATE.get(userId);
  if (!slot) return limit;
  const recent = slot.timestamps.filter((t) => t > cutoff);
  return Math.max(0, limit - recent.length);
}
