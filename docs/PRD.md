# PRD — agentes.grupototum.com

**Produto:** Hub multi-agente da Totum
**Versão:** 1.0 (em produção)
**Autor:** Israel Lemos + Cérebro Pepper (Opus 4.7)
**Atualizado:** 2026-06-04

---

## 1. Visão de produto

> **Uma interface só pra falar com todo o time IA da Totum.**

Hoje o Rael conversa com a Pepper pelo Telegram (`@totum_agents_bot`) e ela orquestra os subagentes nos bastidores. Funciona, mas:

- Telegram é mobile-first e perde contexto longo
- Histórico de conversas com cada agente fica esparso
- Não há catálogo claro de quem faz o quê
- Sem markdown rendering, copy fica fea no Telegram
- Cliente Totum não tem como ver os agentes em ação numa demo

`agentes.grupototum.com` é o **complemento desktop-first** que resolve essas dores. Não substitui o Telegram — coexiste.

---

## 2. Personas

### P1 — Rael (CEO)
- **Job-to-be-done:** "delegar trabalho real pro time IA enquanto faço outra coisa, e voltar pra ver o output formatado"
- **Touchpoints atuais:** Telegram Pepper
- **Touchpoints novos:** desktop browser ↔ agentes-ui
- **Dor:** prompts longos ficam difíceis de revisar no Telegram; resposta da Pepper tem markdown que vira lixo lá
- **Métrica de sucesso:** % conversas por semana no web vs Telegram. Meta V1: ≥30% no web em 60 dias.

### P2 — Cliente demo
- **Job-to-be-done:** "ver com meus próprios olhos como funciona um time de IA"
- **Touchpoints:** demo de venda; depois landing → agentes.grupototum.com
- **Dor atual:** não consegue ver. Demos viram screenshots do Telegram.
- **Métrica:** taxa de conversão demo → contrato fechado. Meta: +20%.

### P3 — Equipe Totum (Estaleiro, Sentinela, Arquiteto)
- **Job-to-be-done:** colaborar com os agentes pra debug, propor PRs, monitorar produção
- **Touchpoints novos:** agentes-ui com login SSO + histórico cross-agent
- **Dor:** sem hub, fica caçando informação no Telegram
- **Métrica:** tempo médio pra resolver incidente. Meta V1: -30%.

---

## 3. Problema

### 3.1 Por que o Telegram não basta

| Dor | Telegram | agentes-ui |
|---|---|---|
| Markdown render | ❌ texto cru | ✅ react-markdown + hljs |
| Histórico cross-conversation | ❌ scroll infinito | ✅ sidebar com filtro |
| Copy de bloco de código | ❌ confuso | ✅ click & copy |
| Demo pra cliente | ❌ "screenshots do meu Telegram" | ✅ URL pública |
| Multi-agente visual | ❌ só Pepper aparece | ✅ catálogo + hierarquia |
| Mobile UX | ✅ excelente | 🟡 responsive mas desktop-first |

### 3.2 Por que não usar ChatGPT/Claude.ai

- Auth não centralizada (não conecta com KC Totum)
- Não tem acesso aos subagentes próprios (Jonathan, Paulo, Amanda, Juliana)
- Modelo único, sem fallback chain
- Sem memória persistente file-backed da Pepper
- Custo recorrente que não escala

---

## 4. Solução

### 4.1 Princípios de design

| Princípio | Aplicação |
|---|---|
| **Stack VPS-first** | Auth, DB, gateway tudo loopback (D-025). Sem dependência externa que pode cair. |
| **SSO único** | Mesma conta Keycloak vale agentes-ui, n8n (V2), Mission Control (D-024) |
| **Multi-agente nativo** | Cada agente é um botão. Histórico per-user, per-agent. |
| **Markdown first-class** | Pepper escreve markdown rico → renderiza igual ChatGPT |
| **Streaming opcional** | Quando openclaw CLI não tem `--stream`, pseudo-streaming server-side cria efeito ChatGPT |
| **Dark-only Totum Red** | Brand consistente. Sem light mode. |
| **Honestidade > maquiagem** | Status broken/config explícito (D-029 inventory) |

### 4.2 Arquitetura

Ver [README.md](../README.md#-arquitetura) — diagrama ASCII.

Decisões em [DECISOES.md](DECISOES.md):
- D-025 Stack VPS pura
- D-026 App roda como root (CLI openclaw em /root/.nvm)
- D-027 CLI `openclaw agent --json` (não HTTP REST — não existe ainda)
- D-028 cloudflared 2024+ não recarrega ingress via SIGHUP (restart obrigatório)
- D-029 Keycloak issuer público com path-block `/admin` (browser OAuth flow exige)

---

## 5. Requisitos funcionais

### 5.1 Auth (RF-AUTH)

| ID | Requisito | Status |
|---|---|---|
| RF-AUTH-01 | User faz login via Keycloak (realm `totum`, client `agentes-ui`) com OAuth Authorization Code + PKCE S256 | ✅ |
| RF-AUTH-02 | Sessão persiste 8h em cookie httpOnly assinado (jose JWT) | ✅ |
| RF-AUTH-03 | Logout encerra sessão local + Keycloak (`end_session_endpoint`) | ✅ |
| RF-AUTH-04 | Primeiro login força troca de senha (`requiredAction=UPDATE_PASSWORD`) | ✅ |
| RF-AUTH-05 | KC admin endpoint (`/admin`) bloqueado no tunnel público | ✅ |

### 5.2 Chat (RF-CHAT)

| ID | Requisito | Status |
|---|---|---|
| RF-CHAT-01 | Sidebar com 5 agentes filtrando por `chatExposed=true` | ✅ |
| RF-CHAT-02 | Click no agente abre conversa nova OU carrega histórico se existir | ✅ |
| RF-CHAT-03 | Submit do input persiste mensagem do user no Postgres, invoca CLI openclaw, persiste resposta | ✅ |
| RF-CHAT-04 | Resposta do agente renderiza markdown completo (headings, listas, code blocks com hljs, tabelas GFM) | ✅ |
| RF-CHAT-05 | Streaming SSE word-by-word com cursor pulsante (opt-in via `/api/messages/stream`) | 🟡 PR #2 |
| RF-CHAT-06 | Histórico cross-agent acessível via toggle "{agente}/Todas" | ✅ |
| RF-CHAT-07 | Delete conversa com `confirm()` + cascade em messages | ✅ |
| RF-CHAT-08 | Click numa conv de outro agente troca agente ativo automaticamente | ✅ |
| RF-CHAT-09 | `/chat?agent=<id>` pré-seleciona agente | ✅ |
| RF-CHAT-10 | Anexos `.md` + imagens (10MB max, 5/turn) | ⏳ PR C planejado |

### 5.3 /agents (RF-AGENTS)

| ID | Requisito | Status |
|---|---|---|
| RF-AGENTS-01 | Hierarquia visual: orquestrador + ativos online (SVG desktop, lista mobile) | ✅ |
| RF-AGENTS-02 | 3 departamentos: Execução, Criação, Inteligência | ✅ |
| RF-AGENTS-03 | Cards expansíveis com modelo, channels, capabilities, tools, examples, notes | ✅ |
| RF-AGENTS-04 | Workflow Cascata Circular (5 passos animados on-scroll) | ✅ |
| RF-AGENTS-05 | Section "Legado & stubs" pra Rafael/Matheus broken + Davi/Lucas/Felipe/Carolina/Bianca config | ✅ |
| RF-AGENTS-06 | Planejados V2 (TARS, Hermione, Jarvis, Liz, Pesquisador, Consultor) com badge cinza | ✅ |
| RF-AGENTS-07 | Kanban view com filtros + busca + URL state | ⏳ PR B planejado |

### 5.4 /automacoes (RF-N8N) — V2

| ID | Requisito | Status |
|---|---|---|
| RF-N8N-01 | Rota `/automacoes` protegida pelo mesmo SSO KC | ⏳ PR D |
| RF-N8N-02 | Iframe full-size de `https://n8n.grupototum.com` | ⏳ PR D |
| RF-N8N-03 | Auth n8n via CF Access (mesma policy do dashboard) | ⏳ infra |
| RF-N8N-04 | Fallback elegante se n8n offline | ⏳ PR D |

---

## 6. Requisitos não-funcionais

| ID | Requisito | Métrica | Status |
|---|---|---|---|
| RNF-PERF-01 | Time-to-first-byte `/login` | <300ms | ✅ ~120ms |
| RNF-PERF-02 | First Contentful Paint `/chat` | <1s | ✅ ~600ms |
| RNF-PERF-03 | Lighthouse Performance | >85 | 🟡 a medir |
| RNF-PERF-04 | Lighthouse Accessibility | >90 | 🟡 a medir |
| RNF-SEC-01 | Cookies httpOnly + SameSite Lax | obrigatório | ✅ |
| RNF-SEC-02 | KC admin `/admin` bloqueado no público | obrigatório | ✅ |
| RNF-SEC-03 | Credenciais via env apenas (não em commit) | D-021 | ✅ |
| RNF-OPS-01 | pm2 startup persistente após reboot | obrigatório | ✅ |
| RNF-OPS-02 | Cloudflared tunnel high-availability (4 edges) | obrigatório | ✅ |
| RNF-UX-01 | Mobile-first responsive | obrigatório | ✅ |
| RNF-UX-02 | Dark-only (não light mode) | brand | ✅ |
| RNF-UX-03 | PT-BR primary | brand | ✅ |

---

## 7. Métricas de sucesso (V1)

| Métrica | Baseline | Meta 30d | Meta 90d | Como medir |
|---|---|---|---|---|
| % conversas via web vs Telegram | 0% | 20% | 40% | DB `messages.created_at` agrupado por canal |
| Conversas/dia | 5 (Telegram) | 8 (total) | 15 (total) | DB count |
| Tempo médio de resposta | 30s | 25s | <20s | DB `messages.created_at` delta |
| % conversas com markdown >100 chars | 0% | 50% | 80% | flag heurística no content |
| Erros 500 / 1k requests | n/a | <5 | <2 | pm2 logs grep |
| Uptime tunnel CF | n/a | 99.5% | 99.9% | CF analytics |
| Tempo demo cliente → ver agente trabalhando | "5 min screenshot" | "30s URL" | "10s URL" | qualitativo |

---

## 8. Roadmap

### V1.0 (em produção — 2026-06-04)
- ✅ Chat multi-agente com 5 agentes
- ✅ Auth SSO Keycloak
- ✅ Histórico per-user em Postgres dedicado
- ✅ Markdown rendering com syntax highlight
- ✅ Página /agents com catálogo canônico
- ✅ Keycloak theme custom Totum

### V1.1 (em revisão)
- 🟡 SSE streaming (PR #2)
- 🟡 Página /agents v2 alinhada com inventário Pepper M96 (PR #4)

### V1.2 (próximos PRs)
- ⏳ Kanban view + filtros + busca em /agents (PR B)
- ⏳ Anexos chat (.md + imagens) com magic bytes + EXIF strip (PR C)
- ⏳ /automacoes iframe n8n com CF Access SSO (PR D)

### V2 (3-6 meses)
- Geomanist fonts hospedadas
- WebSocket native ao openclaw-gateway (substituir CLI spawn)
- Streaming real quando openclaw expor `--stream`
- Dashboard de métricas (msgs/dia, agentes mais usados, ROI tempo)
- Repurpose dos stubs Denderson (Davi, Lucas, Felipe, Carolina, Bianca) com SOULs Totum
- Mobile app PWA com push notifications

### V3 (aspiracional)
- OIDC nativo no n8n (custom plugin)
- Hermione (CDO) e TARS (N1 CTO) como agentes OpenClaw reais
- Multi-tenancy (vários clientes Totum)
- API pública pra integrações de terceiros

---

## 9. Decisões de não-fazer

| Item | Por quê |
|---|---|
| Light mode | Brand é dark. Não é negociável (D-design). |
| Suporte a Internet Explorer ou Safari <14 | <0.5% do público. Não vale o custo. |
| Markdown editor no input | Complexidade alta, valor baixo. Plain text é OK. |
| Mensagens de voz | Out of scope V1. Pepper foca texto. |
| Push notifications | V2. Hoje user volta pra ver. |
| Customização per-user de UI | Single-tenant. Tudo Totum. |
| Tenant isolation (RLS) | Single-tenant. Não há multiple Totums. |
| Geomanist real | Aguardando arquivos .woff2 do Rael. Mission Control também usa fallback. |

---

## 10. Riscos & mitigações

| Risco | Severidade | Mitigação |
|---|---|---|
| Cloudflare 100s timeout em Pepper Cascata >100s | 🔴 alta | PR #2 SSE streaming mantém connection viva via pulses 2s |
| Bug no openclaw CLI mata sessão da Pepper | 🟡 média | Backend captura erro, salva system message, UI mostra falha graciosamente |
| Próxima atualização do KC quebra theme custom | 🟡 média | KC version pinned em 24. Atualização requer re-teste |
| pm2 restart em demo de cliente derruba sessões in-flight | 🟡 média | Sessões cookies sobrevivem; só requests in-flight perdem. Avisar antes |
| Postgres :5436 disk full | 🟡 média | Cron limpa messages >180d, alerta em 80% via Sentinela |
| Tunnel CF down → tudo down | 🟢 baixa | CF tem 99.9% SLA, tunnel rodando há 39h+ sem incidente |
| Pepper OAuth Sonnet expirado (M71) | ✅ mitigado | Fallback Codex/Groq já no chain |

---

## 11. Cronograma realista (próximos 14 dias)

| Dia | Entrega | Owner |
|---|---|---|
| D+0 | Merge PR #4 (/agents v2) | Arquiteto revisa |
| D+1 | PR B start (`feat/agents-kanban`) | Claude Code |
| D+3 | PR B ready for review | Claude Code |
| D+4 | Merge PR B → start PR C (anexos) | Arquiteto + Claude |
| D+5 | Pré-reqs infra n8n: Public Hostname + trust proxies | Rael + Sentinela |
| D+7 | PR C ready for review | Claude Code |
| D+8 | Merge PR C → start PR D (n8n) | Arquiteto + Claude |
| D+10 | PR D ready for review | Claude Code |
| D+12 | Merge PR D → smoke completo | Arquiteto |
| D+14 | Métricas D+30 começam a coletar | Sentinela |

---

## 12. Referências

- [README.md](../README.md) — leia-me geral
- [FEATURES.md](FEATURES.md) — lista detalhada de features
- [DECISOES.md](DECISOES.md) — decisões arquiteturais D-025..D-029
- [agentes-inventory.md](agentes-inventory.md) — catálogo canônico Pepper M96
- [v2-anexos-n8n.md](v2-anexos-n8n.md) — design doc V2

---

*PRD revisado pelo Arquiteto antes de cada major release.*
*Última revisão: 2026-06-04.*
