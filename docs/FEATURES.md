# FEATURES — agentes.grupototum.com

Resumo navegável de recursos do sistema. Atualizado 2026-06-04.

> **Legenda:** ✅ produção · 🟡 review · ⏳ planejado · 💤 V2+

---

## 🔐 Autenticação

| # | Feature | Status | Onde |
|---|---|---|---|
| 1.1 | Login SSO via Keycloak realm `totum` | ✅ | `/api/auth/login` |
| 1.2 | OAuth Authorization Code + PKCE S256 | ✅ | `lib/keycloak.ts` |
| 1.3 | Cookie httpOnly assinado (jose JWT) TTL 8h | ✅ | `lib/session.ts` |
| 1.4 | OAuth state + nonce + code_verifier em cookie efêmero 10min | ✅ | `lib/session.ts` |
| 1.5 | Logout via `end_session_endpoint` do KC | ✅ | `/api/auth/logout` |
| 1.6 | Force update password no primeiro login (`requiredAction`) | ✅ | Keycloak realm config |
| 1.7 | Path block `/admin /metrics /health` no tunnel público | ✅ | Cloudflare Public Hostnames |
| 1.8 | Keycloak custom theme Totum (PT-BR, logo, split-screen) | ✅ | `/opt/keycloak/themes/totum/` |
| 1.9 | Re-auth automático antes da expiração | 💤 V2 | — |
| 1.10 | MFA (TOTP) | 💤 V2 | KC suporta nativo |

---

## 💬 Chat

| # | Feature | Status | Onde |
|---|---|---|---|
| 2.1 | Sidebar com agentes (filtra `chatExposed=true`) | ✅ | `ChatClient.tsx` |
| 2.2 | Bubble user com gradient vermelho Totum + cursor pulsante | ✅ | `ChatClient.tsx` |
| 2.3 | Bubble agente com inset shadow + emoji avatar | ✅ | `ChatClient.tsx` |
| 2.4 | Markdown rendering (GFM + syntax highlight) | ✅ | `components/chat/MessageContent.tsx` |
| 2.5 | Code blocks com hljs paleta Totum (keywords red, strings purple) | ✅ | `globals.css .totum-md .hljs-*` |
| 2.6 | Tabelas GFM com scroll horizontal | ✅ | `globals.css .totum-md table` |
| 2.7 | Links abrem em `target=_blank rel=noopener` | ✅ | `MessageContent.tsx` |
| 2.8 | Inline code com background `--elevated` | ✅ | `MessageContent.tsx` |
| 2.9 | Auto-scroll para última mensagem | ✅ | `ChatClient.tsx` |
| 2.10 | Mensagem otimista (aparece antes do POST completar) | ✅ | `ChatClient.tsx` |
| 2.11 | Erro graceful (toast + remove otimista se falhar) | ✅ | `ChatClient.tsx` |
| 2.12 | Submit via Enter (Shift+Enter = nova linha) | ✅ | `ChatClient.tsx` |
| 2.13 | Estado "agente está pensando..." com pontos animados | ✅ | `ChatClient.tsx` |
| 2.14 | Suporte a `/chat?agent=<id>` pra pré-selecionar | ✅ | `app/chat/page.tsx` |
| 2.15 | Streaming SSE word-by-word | 🟡 PR #2 | `/api/messages/stream` |
| 2.16 | Anexos `.md` (renderiza inline) | ⏳ PR C | — |
| 2.17 | Anexos imagens (thumb + modal) | ⏳ PR C | — |
| 2.18 | Copy code button no hover | ⏳ V1.2 | — |
| 2.19 | Edit mensagem do user | 💤 V2 | — |
| 2.20 | Regenerate última resposta | 💤 V2 | — |

---

## 🗂️ Histórico de Conversas

| # | Feature | Status | Onde |
|---|---|---|---|
| 3.1 | Persistência em Postgres dedicado :5436 | ✅ | `lib/db.ts` |
| 3.2 | Schema `users / conversations / messages` com FK CASCADE | ✅ | DB schema |
| 3.3 | Sidebar lista conversas do user (auto-update) | ✅ | `ChatClient.tsx` |
| 3.4 | Toggle "{agente atual} / Todas" | ✅ | `ChatClient.tsx` |
| 3.5 | Emoji do agente em cada item (visual scan) | ✅ | `ChatClient.tsx` |
| 3.6 | Tempo relativo (`agora` / `15min` / `2h` / `12 Jun`) | ✅ | `lib/format.ts` |
| 3.7 | Contador de mensagens por conversa | ✅ | SQL subquery |
| 3.8 | Click numa conv de outro agente troca seleção | ✅ | `selectConversation` |
| 3.9 | Delete inline (hover) com `confirm()` + toast | ✅ | `ChatClient.tsx` |
| 3.10 | Auto-title via primeiros 60 chars do user message | ✅ | `/api/messages` |
| 3.11 | Empty state com ícone + CTA | ✅ | `ChatClient.tsx` |
| 3.12 | Truncate per-user (RLS via session.uid em SQL) | ✅ | `/api/conversations` |
| 3.13 | Rename conversa | ⏳ V1.2 | `PATCH /api/conversations/[id]` pronto, falta UI |
| 3.14 | Search por título | ⏳ V1.2 | — |
| 3.15 | Pin conversas favoritas | 💤 V2 | — |
| 3.16 | Export conversa pra markdown | 💤 V2 | — |

---

## 👥 Página /agents (Catálogo)

| # | Feature | Status | Onde |
|---|---|---|---|
| 4.1 | Catálogo de 12 entries (5 online + 2 broken + 5 stubs) | 🟡 PR #4 | `lib/agents-data.ts` |
| 4.2 | 6 agentes planejados V2 com badge "Planejado" | 🟡 PR #4 | `PLANNED_AGENTS` |
| 4.3 | Hierarchy Tree SVG (orquestrador + ativos online) | 🟡 PR #4 | `components/agents/HierarchyTree.tsx` |
| 4.4 | 3 departamentos (intel/create/exec) com tagline | 🟡 PR #4 | `DEPARTMENTS` |
| 4.5 | DepartmentTable com Time + Planejado V2 por depto | 🟡 PR #4 | `DepartmentTable.tsx` |
| 4.6 | AgentCard expansível (modelo, channels, capabilities, tools, examples, notes) | 🟡 PR #4 | `AgentCard.tsx` |
| 4.7 | StatusPill (online/beta/config/broken) com tooltip | 🟡 PR #4 | `StatusPill.tsx` |
| 4.8 | Workflow Cascata Circular (5 passos animados on-scroll) | 🟡 PR #4 | `WorkflowVisualization.tsx` |
| 4.9 | Section "Legado & stubs" (honestidade > maquiagem) | 🟡 PR #4 | `app/agents/page.tsx` |
| 4.10 | Notes técnicas em banner brand-red (D-033 Amanda, M71 Pepper) | 🟡 PR #4 | `AgentCard.tsx` |
| 4.11 | CTA Conversar só se `chatExposed && online` | 🟡 PR #4 | `AgentCard.tsx` |
| 4.12 | Mobile responsive (tree vira lista) | 🟡 PR #4 | `HierarchyTree.tsx` |
| 4.13 | Kanban view (toggle Catálogo/Kanban) | ⏳ PR B | — |
| 4.14 | Filtros (status, departamento, capabilities) | ⏳ PR B | — |
| 4.15 | Busca debounced (nome, codinome, role, description) | ⏳ PR B | — |
| 4.16 | URL state (`?status=online&dept=intel`) | ⏳ PR B | — |
| 4.17 | Histórico de delegação (Pepper → especialista) | 💤 V2 | requer `openclaw_memory.conversation_history` |
| 4.18 | Métricas por agente (msgs/semana, latência média) | 💤 V2 | — |

---

## 🎨 Design System Totum Red

| # | Feature | Status | Onde |
|---|---|---|---|
| 5.1 | Tokens HSL/hex canônicos (surface, brand-red, etc) | ✅ | `globals.css :root` |
| 5.2 | Dark-only (sem light mode) | ✅ | brand decision |
| 5.3 | Pills 9999px nos botões primários/secundários | ✅ | `.totum-pill` |
| 5.4 | Halo vermelho `0 7px 80px -12px #da2128` no hover | ✅ | `.totum-pill-primary:hover` |
| 5.5 | Inset shadows ao invés de CSS border | ✅ | `.totum-card` |
| 5.6 | Card brand com gradient warm-rust → surface | ✅ | `.totum-card-brand` |
| 5.7 | Focus ring na cor primary | ✅ | `--ring` |
| 5.8 | Nav active gradient purple-bright → tertiary | ✅ | `AppNav.tsx` |
| 5.9 | Headings font-weight 300 com tracking -0.02em | ✅ | `globals.css h1-h3` |
| 5.10 | `<strong>` font-weight 400 (não 700 sintético) | ✅ | `globals.css strong` |
| 5.11 | Markdown CSS alinhado com tokens (.totum-md) | ✅ | `globals.css` |
| 5.12 | hljs paleta brand-red-light / purple / amber | ✅ | `globals.css .hljs-*` |
| 5.13 | Scrollbar dark customizada | ✅ | `globals.css ::-webkit-scrollbar` |
| 5.14 | Backdrop-blur 24px no AppNav sticky | ✅ | `AppNav.tsx` |
| 5.15 | Logo Totum em WebP (40KB robô, 7.5KB wordmark) | ✅ | `public/` |
| 5.16 | Keycloak login com mesmo design | ✅ | `themes/totum/login/css/login.css` |
| 5.17 | Geomanist fonts hospedadas | ⏳ aguarda woff2 | `public/fonts/` |
| 5.18 | Mobile-first responsive em tudo | ✅ | breakpoints sm/md/lg/xl |
| 5.19 | StatusPill com dot animado (glow) | ✅ | `StatusPill.tsx` |
| 5.20 | Toaster (sonner) com richColors brand | ✅ | `layout.tsx` |

---

## 🤖 Integração openclaw-gateway

| # | Feature | Status | Onde |
|---|---|---|---|
| 6.1 | Spawn CLI `openclaw agent --json` via child_process | ✅ | `lib/gateway.ts` |
| 6.2 | Args via array (zero shell injection) | ✅ | `lib/gateway.ts` |
| 6.3 | Timeout configurável (default 90s) | ✅ | `GATEWAY_TIMEOUT_MS` env |
| 6.4 | Parse `result.meta.finalAssistantVisibleText` | ✅ | `lib/gateway.ts` |
| 6.5 | Fallback `runId / durationMs` se disponíveis | ✅ | `lib/gateway.ts` |
| 6.6 | Erro 502 com detail em caso de timeout/exit≠0 | ✅ | `/api/messages` |
| 6.7 | System message gravada no DB mesmo em erro | ✅ | `/api/messages` |
| 6.8 | WebSocket native ao gateway | 💤 V2 | — |
| 6.9 | Streaming real (quando CLI expor `--stream`) | 💤 V2 | — |
| 6.10 | Histórico de delegação (sessões filhas em `/root/.openclaw/agents/<id>/sessions/`) | 💤 V2 | — |

---

## 📦 Infra & Deploy

| # | Feature | Status | Onde |
|---|---|---|---|
| 7.1 | pm2 startup systemd (reboot persistente) | ✅ | `pm2 startup systemd` |
| 7.2 | ecosystem.config.js com interpreter NVM v22 | ✅ | `ecosystem.config.js` |
| 7.3 | Cloudflared tunnel 4 conexões edge | ✅ | tunnel `f85bdc19-...` |
| 7.4 | Public Hostname `agentes` `auth` `os` no CF dashboard | ✅ | Remote-managed (D-029) |
| 7.5 | Postgres :5436 dedicado, container restart=unless-stopped | ✅ | docker `agentes-postgres` |
| 7.6 | Backup `.env` antes de qualquer change | ✅ | rotina de deploy |
| 7.7 | cowork-lock v3 nos comandos pesados (npm ci/build) | ✅ | `/home/totum/cowork-lock-user.sh` |
| 7.8 | Health probe `/api/n8n/health` | ⏳ PR D | — |
| 7.9 | Métricas Prometheus | 💤 V2 | — |
| 7.10 | CI GitHub Actions | 💤 V2 | hoje é build manual na VPS |

---

## 🌐 V2 — Anexos no chat

| # | Feature | Status | Detalhe |
|---|---|---|---|
| 8.1 | Botão `+` Paperclip + drag-drop | ⏳ PR C | — |
| 8.2 | Tipos aceitos: `.md .png .jpg .jpeg .webp .gif` | ⏳ PR C | — |
| 8.3 | Limite 10MB/arquivo, 5/turn, 100MB/dia/user | ⏳ PR C | — |
| 8.4 | Magic bytes validation (`file-type`) | ⏳ PR C | — |
| 8.5 | EXIF strip em imagens (`sharp`) | ⏳ PR C | — |
| 8.6 | Storage filesystem `/home/totum/totum-agentes/uploads/{kc_sub}/{date}/` | ⏳ PR C | — |
| 8.7 | Rate limit 30 uploads/h/user | ⏳ PR C | — |
| 8.8 | Modal full-size pra imagens | ⏳ PR C | `<dialog>` nativo |
| 8.9 | Cron 30d limpa uploads antigos | ⏳ PR C | systemd timer |
| 8.10 | Imagens "registradas mas não interpretadas" (CLI text-only) | ⏳ PR C | decisão Rael |

---

## 🌐 V2 — /automacoes (n8n)

| # | Feature | Status | Detalhe |
|---|---|---|---|
| 9.1 | Rota `/automacoes` em agentes-ui | ⏳ PR D | — |
| 9.2 | Iframe full-size `n8n.grupototum.com` | ⏳ PR D | sandbox restrita |
| 9.3 | SSO via Cloudflare Access (mesmos emails sócios) | ⏳ infra | — |
| 9.4 | Loading skeleton durante boot | ⏳ PR D | — |
| 9.5 | Fallback "n8n indisponível" | ⏳ PR D | `<Card>` brand |
| 9.6 | Item "Automações" no AppNav (já tem) | ✅ | `AppNav.tsx` |

---

## 🎯 V3 — Aspiracional

- 💤 OIDC nativo no n8n (custom plugin)
- 💤 Hermione (CDO) e TARS (CTO) como agentes OpenClaw reais
- 💤 Multi-tenancy (várias contas Totum)
- 💤 PWA mobile com push notifications
- 💤 Dashboard de métricas (msgs/dia, ROI tempo, agentes mais usados)
- 💤 API pública pra integrações third-party
- 💤 Mensagens de voz com STT/TTS
- 💤 Tema light (não brand-aligned, baixa prioridade)

---

## 📊 Resumo numérico (V1.0)

- **Páginas:** 4 (`/`, `/login`, `/chat`, `/agents` + redirects)
- **API routes:** 10 (`auth/*`, `messages`, `messages/stream`, `conversations`, `conversations/[id]`, `conversations/[id]/messages`, `agents`)
- **Componentes React:** 14 (chat: 1, agents: 5, layout: 1, ui: 2, etc)
- **Libs internas:** 9 (`agents-data`, `db`, `env`, `format`, `gateway`, `keycloak`, `session`, `sse-client`, `utils`)
- **Linhas de código:** ~3.500 (TypeScript) + ~500 (CSS) + ~300 (config)
- **Deps prod:** 13 (next, react, oauth4webapi, jose, pg, react-markdown, remark-gfm, rehype-highlight, lucide-react, sonner, framer-motion, class-variance-authority, radix-slot)
- **Deps dev:** 9 (typescript, tailwind, postcss, @types/*)
- **Tamanho dos bundles:**
  - `/login` 42 KB (com framer-motion split-screen)
  - `/chat` 96 KB (com markdown + hljs)
  - `/agents` 12 KB (server-rendered, lean)
- **Tempo médio de build:** ~25s na VPS (Node 22 LTS)

---

*Atualizar este arquivo a cada feature shipped. Próximo update: após merge PR B.*
