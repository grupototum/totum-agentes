# Inventário canônico de agentes OpenClaw — Totum

**Fonte:** `/root/.openclaw/openclaw.json` em `panel.grupototum.com` (snapshot 2026-06-04 12:30 BRT)
**Mantido por:** Cérebro Pepper (Opus 4.7) — M96
**Pra quem:** Claude Code construindo `/agents` em `agentes.grupototum.com` (catálogo + hierarquia + Kanban). Use este arquivo como única fonte da verdade pra gerar `agents-data.ts`.

**Regra:** este arquivo reflete **estado real** dos agentes. Marca `status` honesto (`broken`/`config`) quando algo não funciona ainda — UI amarela > UI mentindo verde.

---

## 👠 Pepper Potts

- agent_id: `main`
- codename: Pepper
- role: CEO operacional do Totum OS, orquestradora. Recebe demanda do Rael, classifica, delega pro subagente certo, sintetiza output.
- description: Pepper é o ponto único de contato do Rael (chefe/N0). Voz Totum estabelecida: direta, anti-sycophant, sem floreio, em PT-BR. Segue Cascata Circular (4 camadas de memória + Juiz Interno antes de toda entrega). Conhece D-001..D-022, MEMORY.md enxuto pós-M59.
- department: `exec`
- manager_id: `null`  ← root da hierarquia
- subordinates: `[jonathan, paulo, amanda, juliana]` ← ativos hoje. Outros (rafael, matheus, davi, lucas, felipe, carolina, bianca) estão na lista do openclaw.json mas SEM persona Totum customizada.
- model: `openai-codex/gpt-5.5` (primary temporário) → fallbacks: `anthropic/claude-sonnet-4-5` → `groq/llama-3.3-70b-versatile`
- tools: `Agent` (delegação subagentes), `memory_search`, `memory_get`, `exec` (allowlist restrita 11 binários), `edit`, `message`, `image_generate`, ~27 tools registradas no system prompt
- capabilities: `["Orquestração", "Delegação multi-agente", "Memória persistente file-backed", "Juiz Interno anti-alucinação", "PT-BR Totum"]`
- status: `online`
- chat_exposed: `true` (canal principal Telegram)
- channels: `[telegram, web]`  ← Telegram via `@totum_agents_bot`, HTTP loopback gateway :18789 pra agentes-ui
- example_prompts:
  - "Pepper, bom dia, qual é nossa prioridade hoje?"
  - "Pepper, qual é a decisão D-001?"
  - "Pepper, escreve um post pro Instagram da Totum vendendo uPixel CRM"
- notes: Primary `openai-codex/gpt-5.5` desde M71 porque Claude Max OAuth expirou em 31/05. Volta pra Sonnet 4.5 quando Rael fizer re-auth (M71.2). Workspace foi enxugado em M59 (50KB → 36KB systemPromptChars).

---

## ✍️ Jonathan (Copy)

- agent_id: `jonathan`
- codename: Jonathan-copy
- role: Copywriter Totum. Anúncios Meta, posts orgânicos, e-mail marketing, scripts de venda, copy de páginas.
- description: Subagente N3 sob Pepper. Persona Totum-aligned definida em M59 (SOUL.md 2.4KB). Tom direto, anti-sycophant, restrições por plataforma (IG caption ~150 palavras, Stories curto, Meta Ads <125 chars). Modo Eugene Schwartz on-demand quando Pepper sinalizar.
- department: `create`
- manager_id: `main`
- subordinates: `[]`
- model: `openai-codex/gpt-5.5`
- tools: `memory_search`, `memory_get`, `edit`, `message` (herda defaults)
- capabilities: `["Copywriting", "Tom Totum", "Anúncios Meta", "Eugene Schwartz", "Stories/Feed/E-mail"]`
- status: `online`
- chat_exposed: `true` (via delegação Pepper)
- channels: `[via-pepper]`  ← não recebe mensagem direta de cliente; só de Pepper via tool Agent
- example_prompts:
  - "Pepper, escreve um headline pra Instagram da Totum sem emoji"
  - "Pepper, faz copy de anúncio Meta vendendo automação WhatsApp pra PME"
  - "Pepper, e-mail B2B pra reativar lead que sumiu há 30 dias, modo Eugene"
- notes: Validado M59 + fast-track. Output exemplo real: "uPixel CRM: transforme leads em vendas sem deixar oportunidade morrer no WhatsApp." Não publica nada — entrega texto pra Pepper sintetizar.

---

## 🛠️ Paulo (Dev)

- agent_id: `paulo`
- codename: Paulo-dev
- role: Desenvolvedor full-stack. Stack Totum decorada (Next.js, Vite, Supabase, Coolify, n8n, PM2, VPS Hostinger, Traefik, PostgreSQL).
- description: Subagente N3 sob Pepper. Persona Totum-aligned em M59 (SOUL.md 2.8KB). Regras hard: sempre `127.0.0.1` (D-017), NÃO migrar Supabase (D-001), vault `.env` = território Sentinela M61, restart gateway requer autorização. Conhece D-007 (rotação de credencial), D-008 (OpenClaw fork).
- department: `exec`
- manager_id: `main`
- subordinates: `[]`
- model: `openai-codex/gpt-5.5`
- tools: `memory_search`, `memory_get`, `edit`, `message`, `exec` (herda defaults restritivos)
- capabilities: `["Full-stack Dev", "Supabase/Postgres", "Coolify/Docker", "Debug Infra", "Stack Totum"]`
- status: `online`
- chat_exposed: `true` (via delegação Pepper)
- channels: `[via-pepper]`
- example_prompts:
  - "Pepper, como verifico se a SUPABASE_SERVICE_ROLE_KEY do xusdh ainda é válida?"
  - "Pepper, como fica o stack do Mission Control com Next.js?"
  - "Pepper, debugar timeout em Edge Function Supabase"
- notes: Validado M59 + fast-track. Output exemplo real: comando `curl -i $URL/auth/v1/admin/users` com interpretação 200/401/403/Could not resolve. Anti-alucinação ativada (sinaliza "Premissa: ... não decisão oficial D-XXX" quando precisa).

---

## 🤝 Amanda (CRM + Atendimento)

- agent_id: `amanda`
- codename: Amanda-crm (D-033: serve 2 escopos — CRM/Pepper + Atendimento WhatsApp)
- role: Relacionamento cliente, pipeline (Doutor House CRM), follow-up, qualificação SPIN/BANT, automações WhatsApp Evolution. **D-033**: serve também como persona do `atendimento-wpp` via prompt template injetado pelo wpp-router (M92 POC).
- description: Subagente N3 sob Pepper. Persona Totum-aligned em M59 (SOUL.md 2.4KB). SPIN/BANT/AIDA decorados. Tom WhatsApp B2B PME, sem floreio, mensagens curtas. Doutor House + Mataburro + Cláudia na hierarquia CRM. Quando invocada pelo wpp-router via M92, recebe persona "Atendimento Totum" inline (acolhedor + objetivo, classifica intent `[orcamento|duvida_produto|suporte_pedido|reclamacao|outro]`).
- department: `exec`
- manager_id: `main`
- subordinates: `[]`
- model: `openai-codex/gpt-5.5`
- tools: `memory_search`, `memory_get`, `edit`, `message` (herda defaults)
- capabilities: `["CRM", "Follow-up", "SPIN/BANT", "WhatsApp", "Atendimento Premium"]`
- status: `online`
- chat_exposed: `true` (via delegação Pepper E via wpp-router/atendimento-wpp)
- channels: `[via-pepper, whatsapp]`
- example_prompts:
  - "Pepper, como abordo um lead frio do CRM?"
  - "Pepper, monta follow-up D+3 pra lead que viu demo do uPixel e sumiu"
  - (via WhatsApp atendimento-wpp): "Oi, queria saber preço da Totum"
- notes: D-033 reuso pra atendimento-wpp foi decisão pragmática do M92 POC (sem restart openclaw, sem criar agent_id novo). V1 migra atendimento pra `agent_id` próprio quando houver janela de restart autorizada. Validado M59 + fast-track + M92 design.

---

## 📋 Juliana (Ops)

- agent_id: `juliana`
- codename: Juliana-ops
- role: Operações e processos (SOPs), gestão de projetos, deadlines, prioridades, M-XX board do Arquiteto.
- description: Subagente N3 sob Pepper. Persona Totum-aligned em M59 (SOUL.md 2.3KB). SOP em formato Dono/Gatilho/Passos/Critério aceite. Frameworks decorados: GTD, OKR, RACI, MoSCoW. Conhece estrutura M-XX do Arquiteto, não inventa missão nova (propõe via `[CP→ARQ] sugiro M-XX`).
- department: `exec`
- manager_id: `main`
- subordinates: `[]`
- model: `openai-codex/gpt-5.5` ← **fix M59** (era `anthropic/claude-sonnet-4-5` sem chain, agora Codex igual outras 3)
- tools: `memory_search`, `memory_get`, `edit`, `message` (herda defaults)
- capabilities: `["SOP", "Gestão de Projetos", "OKR/RACI/MoSCoW", "M-XX board", "Onboarding"]`
- status: `online`
- chat_exposed: `true` (via delegação Pepper)
- channels: `[via-pepper]`
- example_prompts:
  - "Pepper, estrutura SOP de rotação trimestral de credencial API"
  - "Pepper, qual processo de onboarding cliente?"
  - "Pepper, organiza essas 5 demandas do Rael em ordem de prioridade"
- notes: Validado M59 + fast-track. Bug fix em paralelo M59: Juliana tinha modelo Sonnet 4.5 (sem chain de fallback) → falhava em chain_exhausted. Trocado pra Codex igual as outras 3 subagentes.

---

## 💤 Rafael (legado Denderson — sem persona Totum)

- agent_id: `rafael`
- codename: Rafael
- role: Indefinido pra Totum. Template Denderson original "rafael-gestor".
- description: Existe no agents.list[] mas SEM SOUL.md Totum-aligned. Workspace `/root/.openclaw/workspace-rafael` tem template Denderson original ("You're not a chatbot. You're becoming someone."). Não está sendo invocado por Pepper (não está em allowAgents ativos do MVP).
- department: `intel`  ← inferido pelo template, sem confirmação
- manager_id: `main` (existiria se invocado)
- subordinates: `[]`
- model: `anthropic/claude-sonnet-4-5`  ← **BROKEN** (Claude Max OAuth expirou em 31/05, M71)
- tools: defaults herdados
- capabilities: `[]`  ← não tem persona, não tem capabilities reais
- status: `broken`
- chat_exposed: `false`
- channels: `[]`
- example_prompts: `[]`
- notes: **BROKEN** = (1) sem persona Totum-aligned (template Denderson genérico); (2) modelo `anthropic/claude-sonnet-4-5` retornaria 401 hoje (OAuth Max expirado, M71.2 pendente). Recomendação: ou repurposar com persona Totum (V2) ou remover do agents.list[]. Cuidado: Pepper main ainda tem `rafael` em `subagents.allowAgents` (M59 não limpou esse).

---

## 💤 Matheus (legado Denderson — sem persona, DUPLICADO no JSON)

- agent_id: `matheus`
- codename: Matheus
- role: Indefinido pra Totum. Template Denderson original "matheus-closer".
- description: Mesma situação de Rafael — workspace tem template genérico. Conhecido bug histórico: matheus_clone era account Telegram separado (desabilitado em M39.1 com `enabled: false`, IDs `7609311622` e `1295348895` removidos das allowlists). NÃO confundir `matheus` (agent_id em agents.list[]) com `matheus_clone` (account Telegram desabilitado).
- department: `exec`  ← inferido pelo template "closer", sem confirmação
- manager_id: `main`
- subordinates: `[]`
- model: `anthropic/claude-sonnet-4-5`  ← **BROKEN** (OAuth expirou)
- tools: defaults herdados
- capabilities: `[]`
- status: `broken`
- chat_exposed: `false`
- channels: `[]`
- example_prompts: `[]`
- notes: **BROKEN** + **DUPLICATED** = `matheus` aparece DUAS vezes em `agents.list[]` no openclaw.json (bug histórico M59 backlog). Modelo Sonnet 4.5 expirado. Pepper.subagents.allowAgents tem `matheus` listado mas Pepper hoje não delega pra ele (M59 ativos = jonathan/paulo/amanda/juliana). Recomendação: dedup + repurposar ou remover em V1.

---

## 💤 Davi, Lucas, Felipe, Carolina, Bianca (legado Denderson — sem persona Totum)

5 agentes do template Denderson original (SDRs, copy variants, etc), todos com:
- agent_id: `davi`, `lucas`, `felipe`, `carolina`, `bianca`
- codename: igual ao agent_id (template Denderson original)
- role: Indefinido pra Totum. SDR/Copy variants no template, mas sem persona Totum-aligned.
- description: Workspaces `/root/.openclaw/workspace-{davi|lucas|felipe|carolina|bianca}` têm template Denderson genérico ("You're not a chatbot. You're becoming someone."). Não estão sendo invocados pelo MVP Pepper.
- department: `exec`  ← inferido (SDRs no template)
- manager_id: `main`
- subordinates: `[]`
- model: `openai-codex/gpt-5.5` (todos 5)
- tools: defaults herdados
- capabilities: `[]`
- status: `config`  ← modelo OK (não broken), mas sem persona Totum = não usável
- chat_exposed: `false`
- channels: `[]`
- example_prompts: `[]`
- notes: Status `config` (não `broken`): o modelo Codex funciona, mas falta SOUL.md Totum-aligned. Pepper.subagents.allowAgents lista todos. V2 — só repurposar quando houver demanda específica (ex: virar SDR-WhatsApp na fase 2 do M92, ou time de copy variant A/B).

---

## ⚠️ matheus_clone (NÃO É AGENT — é account Telegram)

**Confusão comum.** `matheus_clone` aparece no openclaw.json em `channels.telegram.accounts.matheus_clone` (bot Telegram secundário), **não** em `agents.list[]`. **Não é um agent**.

- Status: **DESABILITADO** desde M39.1 (`accounts.matheus_clone.enabled: false`)
- Histórico: era bot Telegram alternativo do Matheus Felipe (sócio da Totum). Causava loop de restart por rede + bindings vazios. Desabilitado + IDs `7609311622`/`1295348895` removidos das allowlists.
- Pra UI Mission Control: **NÃO listar como agent**. Se aparecer no `agents.list[]` algum dia, seria via D-033-like reuso, não como entidade própria.

---

## Resumo executivo (pra Claude Code consumir)

| agent_id | codename | dept | status | model | chat_exposed | manager |
|---|---|---|---|---|---|---|
| `main` | Pepper | exec | online | codex/gpt-5.5 (fb claude/groq) | true | null |
| `jonathan` | Jonathan-copy | create | online | codex/gpt-5.5 | true | main |
| `paulo` | Paulo-dev | exec | online | codex/gpt-5.5 | true | main |
| `amanda` | Amanda-crm | exec | online | codex/gpt-5.5 | true | main |
| `juliana` | Juliana-ops | exec | online | codex/gpt-5.5 | true | main |
| `rafael` | Rafael | intel? | broken | claude-sonnet-4-5 (OAuth expirado) | false | main |
| `matheus` | Matheus | exec? | broken+duplicated | claude-sonnet-4-5 (OAuth expirado) | false | main |
| `davi` | Davi | exec | config | codex/gpt-5.5 | false | main |
| `lucas` | Lucas | exec | config | codex/gpt-5.5 | false | main |
| `felipe` | Felipe | exec | config | codex/gpt-5.5 | false | main |
| `carolina` | Carolina | exec | config | codex/gpt-5.5 | false | main |
| `bianca` | Bianca | exec | config | codex/gpt-5.5 | false | main |

**Hierarquia real:**
- `main` (Pepper) é root.
- Nível 2 (online): `jonathan, paulo, amanda, juliana`. Esses são folhas operacionais HOJE.
- Nível 2 (broken/config): `rafael, matheus, davi, lucas, felipe, carolina, bianca`. Existem mas não delegáveis.

---

## ⛔ missing_planned (agentes do plano original do Rael que NÃO existem no OpenClaw)

Plano original mencionou estes nomes que **não estão em `agents.list[]`** hoje:

| Nome planejado | Existe? | Onde estaria | Sugestão pra UI |
|---|---|---|---|
| Pesquisador | ❌ | Seria intel/research | Esconder do catálogo ATÉ criar OU mostrar como "Planejado V2" (cinza) |
| Criativo | ❌ | Seria create | Mesmo |
| Consultor | ❌ | Seria intel/exec | Mesmo |
| Roboto | ❌ no openclaw.list[] mas EXISTE como **Roboto externo** (Kimi Code CLI rodando em /home/totum/totum-os) | Tech | NÃO listar como agent OpenClaw — é processo separado (D-015) |
| Executor | ❌ | Genérico, sobreposto com `paulo` | Esconder; usar paulo |
| Liz | ❌ | CPO no INDICE_TOTUM_OS, sem agent OpenClaw | Esconder ou "Planejado V2" |
| Jarvis | ❌ no openclaw.list[]. Existe como **CONCEITO** no JARVIS_RUNBOOK_v1 (VP Engineering N2). Cérebro Pepper hoje age como "Jarvis externo" durante bootstrap (D-012). | Tech | Mostrar como "Conceitual/orquestrado por Cérebro Pepper" OU esconder |
| Hermione | ❌ no openclaw.list[]. Existe como conceito (CDO/CIO no INDICE) + agente externo no totum-model-gateway (D-003 mencionado), MAS hoje não é OpenClaw agent. | Intel | Mesmo: conceitual ou esconder |
| TARS | ❌ no openclaw.list[]. Aspiracional N1 CTO no INDICE_TOTUM_OS. Não rodando ainda. | Intel | "Planejado V2" |
| Sobral / Cláudia / Miguel / Saul / Tigrinha | ❌ Todos no INDICE_TOTUM_OS como C-suite N2, mas nenhum tem agent OpenClaw. | exec | "Planejados V2/V3" |

**Decisão UI:** Claude Code escolhe entre:
- **A — esconder missing_planned** (limpa, mostra só o real)
- **B — mostrar com badge "Planejado"** (estrategicamente comunica roadmap pro cliente)

Cérebro Pepper recomenda **B com badge cinza claro** — UI vira mapa do que a Totum *vai ter* sem mentir.

---

## Pontas soltas que Claude Code precisa saber

1. **D-033 (amanda multi-escopo):** Amanda hoje serve a Pepper (delegação CRM) **e** o wpp-router como persona Atendimento (M92 POC). UI: listar como 1 agent só ("Amanda — CRM + Atendimento"), explicar no `notes` que serve 2 contextos.

2. **wpp-router NÃO é agent OpenClaw:** roda em `/home/totum/wpp-router` (PM2, fora do openclaw.json). Sem entry em `agents.list[]`. Pra UI: aparece como **canal/infraestrutura** (junto com Telegram dispatcher e Evolution), não como agent.

3. **Pepper main usa `openai-codex/gpt-5.5` como primary HOJE.** É temporário (M71 fallback). Quando Rael fizer re-auth Claude Max (M71.2), volta `anthropic/claude-sonnet-4-5`. UI pode mostrar "modelo atual" dinamicamente lendo openclaw.json ou hardcode com nota de "pode trocar".

4. **System prompt da Pepper main pesa 36KB / ~12k tokens** após M59. UI poderia exibir essa métrica em "saúde do agent" (mostra que está enxuto, melhor pra demos).

5. **Subagentes não respondem direto.** Pepper invoca via tool `Agent(agentId, taskName, mode=run)`. UI pode mostrar **histórico de delegação** lendo `conversation_history` + correlacionando com sessões filhas em `/root/.openclaw/agents/<id>/sessions/`. Esse é o "diferencial" da experiência multi-agente.

6. **`conversation_history` em `openclaw_memory` (:5433) é a tabela canônica** pra mostrar histórico cross-agent. Schema: `id, session_id, agent_id, role, content, channel, metadata, created_at`. Já tem grant pro user `openclaw`.

7. **Logs de delegação aparecem no journalctl do gateway:** procurar `embedded run agent start: runId=... provider=... model=...` e `childSessionKey: agent:<id>:subagent:<uuid>`.

---

*Documento mantido pelo Cérebro Pepper. Atualizar quando agent novo entrar/sair de `agents.list[]` ou status mudar.*
