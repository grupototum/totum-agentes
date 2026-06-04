# agentes-ui v2 — Anexos + /automacoes (n8n) — Design Doc

**Autor:** Claude (Opus 4.7) na sessão "Agentes Totum" (Mac do Rael)
**Data:** 2026-06-04
**Status:** 🟡 **PROPOSTA** — aguardando 4 confirmações do Rael antes de codar
**Pong de:** `[ARQ→Estaleiro/Paulo-dev]` brief em PROGRESSO_2026-05-31.md
**Base:** stack atual em produção `agentes.grupototum.com` (Next.js 15 + Keycloak `totum` + postgres :5436)

---

## 0. Decisões propostas — TL;DR

| # | Item | Proposta | Confiança |
|---|---|---|---|
| A1 | Storage de anexos | **Filesystem `/home/totum/totum-agentes/uploads/{kc_sub}/{YYYY-MM-DD}/{uuid}.{ext}`** (opção 2 do brief) | 🟢 alta |
| A2 | ACL de leitura | Route handler Next.js `/api/uploads/[user]/[date]/[file]` valida session.uid === path.user; serve via `fs.createReadStream` + content-type | 🟢 alta |
| A3 | Validation | `file-type` (magic bytes) + extension allow-list + EXIF strip via `sharp` em imagens | 🟢 alta |
| A4 | Quota | 100MB/dia/user (tabela `uploads` com running sum + dia rolante) | 🟢 alta |
| A5 | TTL cleanup | Cron diário 03:00 UTC remove `created_at < now() - 30d` (script em `scripts/uploads-prune.ts`) | 🟢 alta |
| A6 | Contexto pro agente | `.md` lido → injetado como bloco markdown no prompt. Imagem → injetada como base64 inline no campo `message` do CLI (sem multimodal nativo do `openclaw agent` — confirmar com Pepper se aceita prefixo `[ATTACHED IMAGE base64]` ou se precisa flag nova) | 🟡 média — depende de CLI suportar payload binário |
| B1 | URL pública n8n | **`n8n.grupototum.com`** (já configurado no container `N8N_HOST`) | 🟢 alta |
| B2 | Auth n8n | **Opção γ — n8n user management nativo + login manual 1ª vez** (cookie 7d). Não inventar SSO falso. Quando OIDC real chegar, migra. | 🟡 média — UX trade-off |
| B3 | Tunnel CF | Adicionar Public Hostname `n8n.grupototum.com → 127.0.0.1:5678` no dashboard CF do tunnel `f85bdc19-…` | 🟢 alta — copia padrão dos outros 3 hostnames |
| B4 | Iframe sandbox | `allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox` | 🟢 alta |

**Esforço total estimado:** 2-3 dias (anexos) + 1 dia (/automacoes) + reservas = **3-4 dias**

---

## 1. FRENTE A — Anexos no chat

### 1.1 Storage — por que filesystem (opção 2)

**Descartado MinIO (opção 1):**
- Só existe `staging-minio` na VPS, sem políticas IAM definidas pra agentes-ui
- POC já 30% feito em filesystem (lib `pg` no app, sem SDK S3-like)
- Adicionar SDK MinIO = +400KB bundle

**Descartado R2 (opção 3):**
- Dependência externa custosa em latência (50-100ms add por request)
- Auth federada com KC não é trivial
- POC não justifica

**Filesystem é certo aqui** porque:
- Volume estimado pequeno (5 users × 100MB/dia max = 500MB/dia → 15GB/mês)
- VPS atual tem espaço sobrando
- Backup já contemplado em rotina (D-005)
- Migração futura pra MinIO é trivial (path mesmo, só troca driver)

### 1.2 Estrutura no disco

```
/home/totum/totum-agentes/uploads/
├── 6bda91fc-2735-4865-a543-63d1480987fd/   ← kc_sub do user rael
│   ├── 2026-06-04/
│   │   ├── 7b9e2c1a-...png
│   │   ├── 7b9e2c1a-...png.meta.json   ← original_name, mime, exif_stripped, size
│   │   └── 91ff44ab-....md
│   └── 2026-06-05/
├── <outro kc_sub>/
└── .quotas.json    ← cache de quota diária (regen via cron)
```

**Permissões:**
- `uploads/` → `root:root 700` (pm2 roda como root, ninguém mais lê)
- Cada arquivo → `root:root 600`

### 1.3 Schema — nova tabela

```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  storage_path TEXT NOT NULL,   -- relativo a uploads/
  kind TEXT NOT NULL CHECK (kind IN ('image','markdown')),
  exif_stripped BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_att_user_day ON attachments(user_id, (created_at::date));
CREATE INDEX idx_att_msg ON attachments(message_id);
CREATE INDEX idx_att_conv ON attachments(conversation_id);
```

**`message_id` nullable** porque o anexo pode ser uploaded **antes** do submit (preview stage). Quando o user clica enviar e a mensagem é persistida, fazemos UPDATE pra setar `message_id`. Cleanup tx: se message_id null > 1h → cron purga.

### 1.4 Validação de upload — pipeline server-side

```
POST /api/uploads (multipart/form-data, conv_id no query)
  ↓
1. session.uid != null
2. content-length < 10 MB
3. accept MIME prefix: image/* | text/markdown | text/plain
4. arquivo recebido via Next.js File API
5. `file-type` lê 4100 bytes iniciais → magic bytes batem com allow-list:
   • image/png / image/jpeg / image/webp / image/gif
   • text/markdown / text/plain
6. Se imagem: `sharp(buf).withMetadata({}).toBuffer()` (EXIF strip)
7. Calcula sum de bytes dos últimos 24h (query attachments) + size novo
   < 100 MB → ok; >= rejeita 429
8. Conta uploads na última hora → < 30 → ok; >= rejeita 429
9. uuid v4 → path final → fs.writeFile (`{mode: 0o600}`)
10. INSERT attachments row
11. retorna { id, url: `/api/uploads/${id}`, kind, mime }
```

**Rate limit:** in-memory Map<user_id, timestamps[]>. Suficiente pra single instance pm2.

### 1.5 Serving — download/preview

```
GET /api/uploads/[id]
  ↓
1. session.uid != null
2. SELECT * FROM attachments WHERE id=$1
3. attachment.user_id === session.uid OU
   attachment.conversation_id está numa conv do session.uid (pra ver attachments compartilhados em V2)
4. fs.realpath(path) → contém prefixo `/home/totum/totum-agentes/uploads/`
   (proteção path traversal — sanity check)
5. stream com headers Content-Type, Content-Length, Content-Disposition inline,
   Cache-Control "private, max-age=86400"
```

**Modal full-size:** `<dialog>` nativo com `<img src="/api/uploads/{id}">` + close on overlay click.

### 1.6 Contexto pro agente — como mandar anexo ao openclaw CLI

**Problema real:** `openclaw agent --message "..."` aceita só texto. CLI não tem flag `--attach <file>` no help.

**Solução pra MVP:**

| Tipo | Estratégia |
|---|---|
| `.md` | Lê arquivo → prefixa: `"\n\n--- ATTACHED MARKDOWN: {filename} ---\n{content}\n--- END ATTACHED ---\n\n{user message}"` |
| imagem | Salva arquivo + injeta no message: `"[Imagem anexada: {filename}, {size}, descreva ou analise. Path: file://{server_path}]"` → Pepper/Paulo NÃO consegue ler diretamente (CLI text-only) |

**Para imagens funcionarem de verdade**, precisa decisão extra do Rael:
- (i) Esperar até `openclaw agent --image <path>` ser implementado
- (ii) Endpoint custom no nosso backend que chama OpenAI/Anthropic vision direto (bypass CLI) → quebra D-025 (sempre gateway)
- (iii) Manter como "anexo registrado mas não interpretado" — usuário envia, agente confirma recebimento; UI mostra thumbnail mas resposta é textual

**Recomendo (iii) pra POC.** Anexo de imagem fica como bookmark visual + o user explicita o que quer ("analise essa screenshot e me diga se o layout está ok" — Paulo vai responder confiando na descrição do user, sem visão real).

Pra `.md` funciona 100% — Paulo lê e responde sobre o conteúdo.

### 1.7 UI/UX

**Botão `+`:**
- `<Paperclip>` icone Lucide, à esquerda do textarea (substitui nada — adiciona)
- Click → `<input type="file" multiple accept=".md,image/*">` invisível dispara

**Drag-over:**
- Listeners no container `<main>` do chat
- `onDragOver`: setDragging(true)
- Estado: overlay com bordering tracejada `2px dashed var(--primary)` + texto "Solte pra anexar"

**Preview pré-envio (acima do input):**
- Cada arquivo: card 80×80px com thumbnail (img) ou ícone (md)
- Botão `×` no canto direita-cima pra remover
- Spinner overlay durante upload
- Após upload OK: anexo registrado em estado `pendingAttachments[]`
- Submit do form: envia `attachment_ids[]` no body do POST /api/messages

**Backend `/api/messages` modificado:**
- Aceita campo `attachment_ids?: string[]`
- Para cada ID: SELECT validate ownership + sets `message_id` no row
- Mensagem usuário é montada: `<prefixos de .md> + user.content`
- Persistido em `messages.content` com flag `messages.has_attachments` (nova coluna)

**Render bubble user com attachments:**
- Após o texto: grid de thumbnails das imagens
- Click numa imagem: modal full-size
- `.md` colapsado como "📄 nome.md (50 KB)" com toggle pra expandir → `<MessageContent>` (reusa PR #1)

**Mobile:**
- Botão `+` cresce pra 44×44px
- Camera input habilitado: `accept="image/*" capture="environment"`

### 1.8 Crítica honesta da feature

**O que pode dar errado:**
1. **EXIF strip via `sharp`** requer `sharp` (libvips) instalado. ~50MB native deps. PRO: industry standard. CON: build na VPS pode demorar 5min na primeira vez.
2. **Disk space exhaustion** — 100MB/dia/user × 5 users × 90 dias = 45 GB. Mitigação: cron + alarme em 80% disco (Sentinela já tem?).
3. **`file-type` engana**: PNG com payload polyglot existe. Mitigação: além de magic bytes, re-encodar com sharp (converte pra canonical PNG/JPEG, descarta payloads embed).
4. **`openclaw` CLI receber prompt 50KB de markdown anexado** pode estourar context. Mitigação: validar size markdown ≤ 100KB; se for maior, truncar com aviso.

---

## 2. FRENTE B — /automacoes com n8n embedado

### 2.1 Estado atual do n8n na VPS

Container `n8n` já rodando com:
- `image: n8nio/n8n:latest`
- Network: `compose_totum`
- Bind: `127.0.0.1:5678`
- ENV já configurado: `N8N_HOST=n8n.grupototum.com`, `N8N_PROTOCOL=https`, `N8N_WEBHOOK_URL=https://n8n.grupototum.com/`
- **Falta:** Public Hostname no Cloudflare Tunnel + auth coordenada com agentes-ui

### 2.2 Por que descartar Cloudflare Access (opção α)

- CF Access seta cookie `CF_Authorization` cross-subdomain pra `*.grupototum.com`
- Mas você acabou de mover pro modelo de Public Hostnames (sem Access — D-029)
- Adicionar Access agora retroage no `agentes.*` também (a menos que policy seja per-hostname, então OK)
- Custo: free até 50 users, mas adiciona segunda camada de auth confusa pro user

### 2.3 Por que opção β (oauth2-proxy/Traefik) é complicada demais pra POC

- Precisa nginx/Traefik na frente do n8n na VPS
- Configurar oauth2-proxy → KC issuer → injetar X-Forwarded-User
- n8n Community NÃO lê esse header pra criar sessão automática (a versão Enterprise sim)
- Resultado: user passa SSO, mas ainda vê tela de login do n8n

### 2.4 Recomendação — opção γ — n8n nativo user-management

**Configuração no n8n:**
- `N8N_USER_MANAGEMENT_DISABLED=false` (default já é false em versões recentes)
- Primeira run: cria account owner (Rael) via UI
- Adicional: convida usuários via UI; envia email magic-link

**Fluxo do user:**
1. Login em agentes-ui (Keycloak)
2. Click "Automações" na sidebar
3. `/automacoes` carrega — iframe `<iframe src="https://n8n.grupototum.com">`
4. **Primeira vez:** n8n mostra própria tela de login dentro do iframe (`samesite=lax` no cookie permite)
5. User loga manualmente uma vez no n8n
6. Cookie n8n 7 dias
7. Visitas subsequentes: iframe carrega já logado

**UX trade-off honesto:** segundo login na primeira vez. Aceitável pra POC — é um app interno.

### 2.5 Quando vale a pena fazer SSO real

Quando: time crescer >10 pessoas OU houver alta rotatividade OU compliance exigir audit centralizado.

Caminho V2: implementar OIDC no n8n via custom auth plugin (existem 3-4 forks community). Esforço: 2-3 dias dedicados.

### 2.6 Implementação /automacoes em agentes-ui

**Estrutura:**

```
src/app/automacoes/
├── page.tsx          ← server component (verifica session → redirect /login)
└── AutomacoesClient.tsx  ← client component com iframe + loading state
```

**page.tsx:**
```ts
export default async function AutomacoesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <AutomacoesClient user={{name: session.name, email: session.email}} />;
}
```

**AutomacoesClient.tsx:**
- Sidebar idêntica ao /chat (logo, agentes, conversas, user) — reusa componente extraído `<SidebarLayout>`
- Main area: iframe full-size
- Loading skeleton (Totum shimmer) por 2s ou até iframe.onLoad
- Fallback: probe `HEAD https://n8n.grupototum.com/healthz` server-side → se falhar, render `<Card>` "n8n indisponível — fale com @sentinela"

**Sidebar update no /chat também:**
- Item "Automações" abaixo de "Conversas"
- Link `next/link` href="/automacoes"
- Estado ativo via `usePathname`

**iframe sandbox (mais restritivo possível mantendo n8n funcional):**
```html
<iframe
  src="https://n8n.grupototum.com"
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
  className="w-full h-full border-0"
  title="n8n"
/>
```

`allow-same-origin` é necessário pra cookies persistirem. Sem ele, cada navegação dentro do iframe vira um sandbox novo.

### 2.7 Pré-reqs infra (você + Sentinela coordenam)

| Passo | Quem | Status |
|---|---|---|
| Adicionar Public Hostname `n8n.grupototum.com → http://127.0.0.1:5678` no tunnel CF | Rael | ⏳ |
| Confirmar n8n inicializado (acessar via SSH tunnel +5678 primeiro) | Sentinela | ⏳ |
| Garantir `N8N_TRUSTED_PROXIES` aceita CF IPs (ou desabilitado) | Sentinela | ⏳ |
| Trust headers `X-Forwarded-Proto: https` no n8n | já configurado via N8N_PROTOCOL | ✅ |

### 2.8 Crítica honesta

**Riscos:**
1. **iframe + cookies SameSite** — n8n cookie sai `SameSite=Lax`. Domain mismatch (`agentes.*` ≠ `n8n.*`) pode bloquear no Safari mesmo com lax. **Mitigação:** testar em dev → se quebrar, fallback é abrir n8n em nova aba (`target="_blank"` no link sidebar).
2. **CSP do agentes-ui** — Next.js 15 default não bloqueia iframe, mas se adicionarmos CSP via middleware, precisa `frame-src https://n8n.grupototum.com`.
3. **n8n updates breaking** — n8n quebra UI esporadicamente em minor versions. iframe absorve, mas user pode ver tela branca → fallback "abrir em nova aba".

---

## 3. Plano de implementação — 2 PRs

### PR a) `feat/attachments`

**Subtarefas:**
1. Migração SQL `attachments` table + nova coluna `messages.has_attachments`
2. `src/lib/uploads.ts` — utilitários (path resolver, magic-byte validate, EXIF strip)
3. `src/app/api/uploads/route.ts` POST upload
4. `src/app/api/uploads/[id]/route.ts` GET serve
5. `src/lib/rate-limit.ts` — quotas in-memory
6. ChatClient: input file + drag-drop + preview cards + state pendingAttachments
7. Submit /api/messages mod: aceita `attachment_ids[]`, prefixa markdown ao prompt, persiste link
8. Render bubble user com galeria + modal full-size
9. `scripts/uploads-prune.ts` + cron systemd unit
10. Testes: smoke 1MB md, 5MB png, .exe rejeitado, 11º file rejeitado, ACL cross-user

**Deps novas (justificadas):**
- `file-type` ^19 — magic bytes
- `sharp` ^0.33 — EXIF strip (~50MB native libvips — VPS já tem em outras apps)
- `uuid` ^11 — já considerado, mas `crypto.randomUUID()` Node 22 nativo dispensa

### PR b) `feat/n8n-page`

**Subtarefas:**
1. `src/app/automacoes/page.tsx` + `AutomacoesClient.tsx`
2. Extrair `<SidebarLayout>` de `ChatClient` → `src/components/layout/Sidebar.tsx`
3. Item "Automações" na sidebar com ícone `<Workflow>` Lucide
4. Health probe server-side `/api/n8n/health` que faz HEAD interno em `http://127.0.0.1:5678`
5. Fallback card "n8n indisponível"
6. CSP middleware update se necessário
7. Smoke: criar workflow webhook→response → trigger → resposta visível

**Deps:** zero novas.

---

## 4. Cronograma realista (não otimista)

| Dia | Foco |
|---|---|
| D+0 | Decisões confirmadas, schema migration, lib uploads |
| D+1 | API uploads + serving + ACL tests |
| D+2 | UI attachments — input, preview, drag-drop |
| D+3 | Integração com /api/messages + render bubble + modal |
| D+4 | PR a) review + ajustes + merge |
| D+5 | Pré-reqs n8n com Sentinela + Public Hostname CF |
| D+6 | /automacoes page + sidebar refactor |
| D+7 | Smoke + PR b) review + merge |

**Total: 7 dias úteis**, não 3-5 como brief otimista. Razões:
- Sharp build na VPS pode dar trabalho
- ACL testing precisa criar 2 users KC
- iframe pode ter bug não previsto

---

## 5. Pendências bloqueantes — 4 perguntas pro Rael

### 1. Storage de anexos — confirma opção 2 (filesystem)?
A recomendação acima é filesystem com path-based ACL. Se preferir MinIO (precisa setup) ou R2 (paga + auth), avise antes de codar.

### 2. URL pública n8n — confirma `n8n.grupototum.com`?
Container já tá com esse hostname. Falta o Public Hostname no dashboard CF + a Sentinela validar trust proxies.

### 3. Auth do n8n — opção γ (login nativo 1x) é aceitável?
SSO real requer 2-3 dias dedicados de plugin custom no n8n Community. Pra POC, login manual 1x + cookie 7d resolve. OK?

### 4. Plano inicial — me cola o que estava pausado?
O brief diz "[ESPAÇO RESERVADO] aqui entra o plano original". Quando você colar, eu adiciono como "FRENTE C/D/..." e priorizo.

### Bonus — anexo de imagem com Pepper/Paulo
Como o `openclaw agent` é text-only, anexar imagem visualmente é fácil mas o **agente não consegue ler**. Aceita opção (iii) "anexo registrado mas não interpretado" pra POC? Ou prefere esperar uma das alternativas?

---

## 6. O que NÃO vou fazer até confirmação

- Não vou alterar schema postgres
- Não vou tocar pm2 ou container n8n
- Não vou abrir PR no GitHub
- Não vou adicionar deps novas no package.json
- Não vou tocar `.env`, config Cloudflare, ou tunnel

Quando confirmar os 4 pontos acima, começo PR `feat/attachments`.

---

**Arquivo persistido em:**
- VPS: `/home/totum/totum-agentes/docs/v2-anexos-n8n.md`
- Mac: `/tmp/totum-agentes-noturno/docs/v2-anexos-n8n.md` (commitarei no main quando autorizar)
