-- Migration: criar tabela `attachments` (PR C)
-- Roda no postgres dedicado :5436 (banco `agentes`, container `agentes-postgres`).
-- Idempotente — pode rodar múltiplas vezes sem erro.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS attachments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id        UUID REFERENCES messages(id) ON DELETE SET NULL,
  conversation_id   UUID REFERENCES conversations(id) ON DELETE CASCADE,
  original_name     TEXT NOT NULL,
  mime_type         TEXT NOT NULL,
  size_bytes        BIGINT NOT NULL CHECK (size_bytes >= 0),
  storage_path      TEXT NOT NULL UNIQUE,  -- relativo a uploads/, unique pra evitar dup ref
  kind              TEXT NOT NULL CHECK (kind IN ('image','markdown')),
  exif_stripped     BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quota diária por user — composite simples (cast pra date não é IMMUTABLE).
-- Query "últimas 24h" usa este índice via range scan no created_at desc.
CREATE INDEX IF NOT EXISTS idx_att_user_day
  ON attachments (user_id, created_at DESC);

-- Lookup por mensagem (galeria no bubble)
CREATE INDEX IF NOT EXISTS idx_att_msg
  ON attachments (message_id)
  WHERE message_id IS NOT NULL;

-- Lookup por conversa (carregar history)
CREATE INDEX IF NOT EXISTS idx_att_conv
  ON attachments (conversation_id);

-- Cleanup helper: anexos órfãos (message_id null > 1h significa abandonado no preview)
CREATE INDEX IF NOT EXISTS idx_att_orphan
  ON attachments (created_at)
  WHERE message_id IS NULL;
