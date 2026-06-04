<!-- markdownlint-disable MD041 -->
<div align="center">

<img src="public/totum-logo.webp" alt="totum" width="220" />

# agentes — Hub Multi-Agente da Totum

**Stack VPS-first. Auth SSO. Postgres dedicado. Streaming opcional. Markdown nativo.**

[![Production](https://img.shields.io/badge/prod-agentes.grupototum.com-da2128?style=for-the-badge)](https://agentes.grupototum.com)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-000000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Keycloak](https://img.shields.io/badge/Auth-Keycloak%2024-4D4D4D?style=for-the-badge&logo=keycloak)](https://keycloak.org)
[![License](https://img.shields.io/badge/license-private-545454?style=for-the-badge)](#)

</div>

---

## O que é

`agentes` é a **interface web** do time de IA da Totum.
Roda 100% na VPS da empresa, sem dependência externa de auth ou storage.

Você loga uma vez via SSO Keycloak (realm `totum`), escolhe um agente, conversa.
Por baixo, o backend invoca o **openclaw-gateway** local (loopback `:18789`) — ele orquestra os 5 agentes IA reais (Pepper, Jonathan, Paulo, Amanda, Juliana) com fallback chain Sonnet → Codex → Groq.

> **Pra quem é:** Rael (CEO) e equipe Totum. Single-tenant, dark-only, PT-BR.

---

## 🔥 Demo rápido

```
1. https://agentes.grupototum.com → Login Keycloak
2. /chat → Sidebar com 5 agentes; bubble vermelho Totum
3. "Pepper, qual a próxima missão M-XX?"
4. Streaming word-by-word (efeito ChatGPT)
5. Resposta em Markdown completo — syntax highlight nos blocos de código
```

---

## ✨ Features

### 🟢 Em produção

| Feature | Detalhe |
|---|---|
| 🔐 **SSO Keycloak** | OAuth Authorization Code + PKCE S256 via [oauth4webapi](https://github.com/panva/oauth4webapi). Sessão httpOnly JWT (jose) 8h |
| 💬 **Chat multi-agente** | 5 agentes hardcoded — Pepper, Jonathan, Paulo, Amanda, Juliana. Trocar agente preserva histórico |
| 📝 **Markdown render** | `react-markdown` + `remark-gfm` + `rehype-highlight` — paleta hljs alinhada com tokens Totum |
| 🌊 **Streaming SSE** | Pseudo-streaming word-by-word (CLI openclaw é síncrono). Cursor pulsante. Pulses `pensando…` a cada 2s. Rota `/api/messages/stream` |
| 🗂️ **Histórico persistente** | Postgres dedicado :5436. Tabelas `users / conversations / messages`. Toggle "{agente}/Todas" |
| 🗑️ **Conversation CRUD** | GET / PATCH / DELETE em `/api/conversations/[id]` com CASCADE em messages |
| ⏱️ **Tempo relativo** | `agora` / `5min` / `2h` / `12 Jun` — sem deps externas |
| 🎨 **Totum Red Theme** | Dark-only, vermelho `#da2128`, pills `9999px`, halo brand no hover, inset shadows ao invés de border |
| 🤖 **Keycloak custom theme** | Tela de login do KC com mesmo design system (PT-BR, logo Totum, layout split-screen) |
| 📊 **Página /agents** | Hierarquia SVG + Departamentos (intel/create/exec) + Catálogo expansível + Workflow Cascata Circular |

### 🟡 Em revisão (branches feat/*)

| PR | Branch | Status |
|---|---|---|
| [#2](https://github.com/grupototum/totum-agentes/pull/2) | `feat/streaming` | open — Arquiteto decide merge |
| [#4](https://github.com/grupototum/totum-agentes/pull/4) | `feat/agents-catalog-v2` | open — página /agents v2 |

### ⚪ Roadmap V2

- **Anexos no chat** (.md + imagens) com magic-bytes + EXIF strip
- **/automacoes** — iframe n8n com SSO via Cloudflare Access
- **Kanban view** + filtros + busca + URL state em /agents
- **Geomanist fonts** real (hoje fallback local-only)
- **WebSocket native** ao openclaw-gateway (substituiu CLI spawn)
- **Streaming real** quando openclaw expor `--stream`

---

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                       Browser                                 │
│  https://agentes.grupototum.com  /  https://auth.grupototum.com │
└────────────────┬──────────────────────────┬──────────────────┘
                 │                          │
                 ▼                          ▼
       ┌────────────────────┐    ┌─────────────────────────┐
       │  Cloudflare Tunnel │    │  Keycloak (realm totum) │
       │  f85bdc19-...      │    │  127.0.0.1:8180         │
       └─────────┬──────────┘    └─────────┬───────────────┘
                 │                         │
                 ▼                         │ OAuth code flow
       ┌────────────────────┐              │
       │  Next.js 15.5      │ ◄────────────┘
       │  pm2 :3003 (root)  │
       │  agentes-ui        │
       └─┬──────────────┬───┘
         │              │
         ▼              ▼
   ┌────────────┐  ┌─────────────────────────┐
   │ Postgres   │  │ openclaw-gateway        │
   │ :5436      │  │ 127.0.0.1:18789         │
   │ agentes DB │  │ + CLI `openclaw agent`  │
   └────────────┘  └─────────┬───────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │ Cascata Circular     │
                  │ Pepper → 4 SOULs     │
                  │ Sonnet/Codex/Groq    │
                  └──────────────────────┘
```

**Por que VPS-first?** Decisões registradas em [DECISOES.md](docs/DECISOES.md):
- **D-001** Supabase fica Cloud — sem migração
- **D-017** `127.0.0.1` explícito (nunca `localhost`)
- **D-025** agentes-ui = stack VPS pura, sem Lovable/Supabase
- **D-026** App roda como root (acesso ao CLI openclaw em `/root/.nvm/...`)
- **D-029** Keycloak issuer público (browser flow exige), com path-block `/admin` no tunnel

---

## 🚀 Stack

| Camada | Tecnologia |
|---|---|
| Frontend | **Next.js 15.5.19** (App Router, RSC), **React 19.2**, TypeScript 5.7 |
| Styling | **Tailwind 3.4**, design tokens Totum, framer-motion 12, lucide-react |
| Auth | **Keycloak 24** (realm `totum`, public client, PKCE S256), `oauth4webapi` 3, `jose` 5 |
| Database | **PostgreSQL 16** dedicado (`:5436` container Docker, app único consumidor) |
| Backend | Route Handlers Next.js, `pg` 8 pool, SSE via `ReadableStream` |
| Gateway IA | **openclaw-gateway** loopback `:18789` (CLI `openclaw agent --json` via `child_process.spawn`) |
| Markdown | `react-markdown` 9 + `remark-gfm` 4 + `rehype-highlight` 7 |
| Deploy | **pm2** (startup systemd), **Cloudflared Tunnel** (3 public hostnames: `agentes`, `auth`, `os`) |

---

## 📂 Estrutura

```
totum-agentes/
├── docs/
│   ├── PRD.md                    # Product Requirements
│   ├── FEATURES.md               # Lista detalhada de features
│   ├── DECISOES.md               # Decisões arquiteturais (D-025..D-029)
│   ├── agentes-inventory.md      # Catálogo canônico (Pepper M96)
│   └── v2-anexos-n8n.md          # Design doc anexos + n8n
├── public/
│   ├── totum-logo.webp           # 7.5KB
│   └── totum-robot.webp          # 40KB
├── src/
│   ├── app/
│   │   ├── (auth) login/         # Split-screen com robô Totum
│   │   ├── agents/               # /agents catálogo
│   │   ├── chat/                 # Chat principal
│   │   └── api/
│   │       ├── auth/             # login / callback / logout
│   │       ├── messages/         # POST + /stream (SSE)
│   │       ├── conversations/    # CRUD completo
│   │       └── agents/           # GET catalog
│   ├── components/
│   │   ├── agents/               # HierarchyTree, DepartmentTable, AgentCard, WorkflowVisualization
│   │   ├── chat/                 # MessageContent (markdown)
│   │   ├── layout/               # AppNav
│   │   └── ui/                   # button, auth-split-screen
│   └── lib/
│       ├── agents-data.ts        # Catálogo (derivado de inventory)
│       ├── gateway.ts            # spawn openclaw CLI
│       ├── keycloak.ts           # OAuth client (oauth4webapi)
│       ├── session.ts            # cookie httpOnly JWT
│       ├── db.ts                 # pg pool + upsertUser
│       ├── format.ts             # relativeTime
│       ├── sse-client.ts         # SSE reader
│       └── utils.ts              # cn (tailwind-merge)
└── ecosystem.config.js           # pm2 config
```

---

## 🛠️ Setup local (Mac/Linux)

> Requer Node **22 LTS** (Next 15 não roda em 25). Recomendamos `nvm`.

```bash
# 1. Clone
git clone https://github.com/grupototum/totum-agentes.git
cd totum-agentes

# 2. Deps
nvm use 22
npm ci

# 3. Env (cópia)
cp .env.example .env
# Edite: KEYCLOAK_*, DATABASE_URL, OPENCLAW_GATEWAY_TOKEN, SESSION_SECRET (openssl rand -base64 48)

# 4. SSH tunnel pra serviços loopback da VPS (em outro terminal)
ssh -i ~/.ssh/vps-totum \
  -L 3003:127.0.0.1:3003 \
  -L 8180:127.0.0.1:8180 \
  -L 5436:127.0.0.1:5436 \
  -L 18789:127.0.0.1:18789 \
  -N root@<vps-ip>

# 5. Dev
npm run dev   # http://localhost:3003
```

`.env.example` documenta cada variável. Senha temp do user `rael` está em `/home/totum/RAEL_KC_TEMP_PASSWORD.txt` (VPS, chmod 600 root).

---

## 🧪 Test plan rápido

```bash
# Build verde
npm run build

# Smoke produção
curl -I https://agentes.grupototum.com/login         # → 200
curl -I https://auth.grupototum.com/realms/totum/.well-known/openid-configuration  # → 200
curl -I https://auth.grupototum.com/admin            # → 404 (path-block intencional, D-029)

# Smoke gateway (na VPS, requer root)
openclaw agent --agent main --message "ping" --json | jq .result.meta.finalAssistantVisibleText
```

---

## 📦 Deploy

Já está em produção via pm2 + cloudflared. Pra atualizar:

```bash
ssh -i ... root@<vps> "bash -lc '
  cd /home/totum/totum-agentes
  git pull origin main
  /home/totum/cowork-lock-user.sh run \"deploy\" -- bash -lc \"npm ci && npm run build\"
  /root/.nvm/versions/node/v22.22.3/bin/pm2 restart agentes-ui
'"
```

`pm2 startup systemd` já configurado → reboot persistente.

---

## 🤝 Como contribuir

Fluxo padrão **branch → PR → review → merge**.

- Branch de feature: `feat/<scope>` (ex: `feat/agents-kanban`)
- Branch de fix: `fix/<scope>`
- Commits descritivos em PT-BR ou EN, ambos OK
- **PRs precisam de build verde na VPS** (`/home/totum/cowork-lock-user.sh` + `npm run build`)
- Mobile-first responsive em qualquer UI nova
- Sem deps novas sem justificar no PR description

Briefs operacionais: ver [PROGRESSO_2026-05-31.md](../vps-totum/PROGRESSO_2026-05-31.md) no repo `vps-totum/`.

---

## 📜 Histórico recente

```
2026-06-04   PR #4 /agents catálogo alinhado com inventário M96 da Pepper
2026-06-04   PR #2 SSE streaming aberto
2026-06-04   PR #1 markdown + PR #3 history mergeados
2026-06-03   Keycloak theme Totum aplicado (auth.grupototum.com)
2026-06-03   Public Hostname auth + os + agentes no Cloudflare tunnel (D-029)
2026-06-02   Rebuild Next.js 15 + KC + Postgres (substitui scaffold antigo)
```

---

## 📞 Contato

**Dúvidas técnicas:** abrir issue ou Discussion neste repo
**Acesso ao app:** Israel Lemos / Rael (`@israel`)
**Senha temp:** `/home/totum/RAEL_KC_TEMP_PASSWORD.txt` na VPS

---

<div align="center">

**Construído com 🌶️ pela equipe Totum**
*Pepper escolheu cada decisão.*

</div>
