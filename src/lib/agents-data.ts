/**
 * Catálogo canônico de agentes Totum.
 *
 * FONTE DA VERDADE: docs/agentes-inventory.md (Cérebro Pepper M96, snapshot 2026-06-04 12:30 BRT)
 * NÃO editar este arquivo à mão sem atualizar o inventory antes.
 * NÃO inventar agentes — só os que estão em /root/.openclaw/openclaw.json + persona Totum.
 *
 * Reprocessar manualmente quando inventory mudar (status, novo agent, etc).
 */

export type AgentStatus = "online" | "beta" | "config" | "broken";
export type DepartmentId = "intel" | "create" | "exec";

export interface AgentCapability {
  label: string;
  hint?: string;
}

export interface AgentExample {
  prompt: string;
  outcome?: string;
}

export interface AgentEntry {
  id: string;
  name: string;
  codename: string;
  emoji: string;
  role: string;
  description: string;
  longDescription: string;
  status: AgentStatus;
  departmentId: DepartmentId | null;
  managerId: string | null;
  subordinates: string[];
  model: string;
  capabilities: AgentCapability[];
  tools: string[];
  examples: AgentExample[];
  chatExposed: boolean;
  channels: string[];
  notes?: string;
}

export interface Department {
  id: DepartmentId;
  name: string;
  tagline: string;
  description: string;
  emoji: string;
  accent: "red" | "purple" | "blue";
}

export const DEPARTMENTS: Department[] = [
  {
    id: "exec",
    name: "Execução",
    tagline: "Operação, relacionamento, devops",
    description:
      "O motor: relacionamento com cliente, processos, desenvolvimento e infra. Onde o dia-a-dia da Totum acontece.",
    emoji: "⚙️",
    accent: "red",
  },
  {
    id: "create",
    name: "Criação",
    tagline: "Conteúdo, copy, voz da marca",
    description:
      "A voz: copy, anúncios, posicionamento. Linguagem que vende, em PT-BR sem floreio.",
    emoji: "✍️",
    accent: "purple",
  },
  {
    id: "intel",
    name: "Inteligência",
    tagline: "Pesquisa, análise, conhecimento",
    description:
      "O cérebro: pesquisa, análise estratégica, curadoria de conhecimento. Hoje minoritário — expansão prevista.",
    emoji: "🧠",
    accent: "blue",
  },
];

export const ORCHESTRATOR_ID = "main";

// ============================================================
// CATÁLOGO — alinhado com docs/agentes-inventory.md
// ============================================================
export const AGENTS: AgentEntry[] = [
  // ----- ORQUESTRADOR -----
  {
    id: "main",
    name: "Pepper",
    codename: "Pepper Potts",
    emoji: "👠",
    role: "CEO operacional / Orquestradora",
    description:
      "Recebe demanda do Rael, classifica, delega pro subagente certo, sintetiza output.",
    longDescription:
      "Pepper é o ponto único de contato (N0). Voz Totum estabelecida — direta, anti-sycophant, sem floreio, em PT-BR. Segue Cascata Circular (4 camadas de memória + Juiz Interno antes de toda entrega). Conhece D-001..D-022, system prompt 36KB/12k tokens (enxuto pós-M59).",
    status: "online",
    departmentId: "exec",
    managerId: null,
    subordinates: ["jonathan", "paulo", "amanda", "juliana"],
    model: "openai-codex/gpt-5.5",
    capabilities: [
      { label: "Orquestração multi-agente" },
      { label: "Memória persistente file-backed" },
      { label: "Juiz Interno", hint: "anti-alucinação antes de entregar" },
      { label: "PT-BR Totum", hint: "voz brand consolidada M59" },
      { label: "27 tools registradas" },
    ],
    tools: [
      "Agent (delegação)",
      "memory_search",
      "memory_get",
      "exec (allowlist)",
      "edit",
      "message",
      "image_generate",
    ],
    examples: [
      {
        prompt: "Pepper, bom dia, qual é nossa prioridade hoje?",
        outcome: "Lista as 3 missões M-XX prioritárias do dia com gatilhos.",
      },
      {
        prompt: "Pepper, qual é a decisão D-001?",
        outcome: "Cita literal + contexto + decisões relacionadas (D-016, D-018).",
      },
      {
        prompt:
          "Pepper, escreve um post pro Instagram da Totum vendendo uPixel CRM",
        outcome: "Delega Jonathan, sintetiza retorno, entrega copy + estrutura.",
      },
    ],
    chatExposed: true,
    channels: ["telegram", "web"],
    notes:
      "Primary openai-codex/gpt-5.5 temporário desde M71 (Claude Max OAuth expirou 31/05). Volta pra Sonnet 4.5 quando Rael fizer re-auth (M71.2). Fallbacks: anthropic/claude-sonnet-4-5 → groq/llama-3.3-70b-versatile.",
  },

  // ----- ATIVOS (4 subagentes online) -----
  {
    id: "jonathan",
    name: "Jonathan",
    codename: "Jonathan-copy",
    emoji: "✍️",
    role: "Copywriter Totum",
    description:
      "Anúncios Meta, posts orgânicos, e-mail marketing, scripts de venda, copy de páginas.",
    longDescription:
      "Subagente N3 sob Pepper. Persona Totum-aligned (SOUL.md 2.4KB) em M59. Tom direto, anti-sycophant. Restrições por plataforma decoradas (IG ~150 palavras, Stories curto, Meta Ads <125 chars). Modo Eugene Schwartz on-demand quando Pepper sinaliza.",
    status: "online",
    departmentId: "create",
    managerId: "main",
    subordinates: [],
    model: "openai-codex/gpt-5.5",
    capabilities: [
      { label: "Copywriting" },
      { label: "Tom Totum" },
      { label: "Anúncios Meta" },
      { label: "Eugene Schwartz", hint: "modo persuasão clássica on-demand" },
      { label: "Stories/Feed/E-mail" },
    ],
    tools: ["memory_search", "memory_get", "edit", "message"],
    examples: [
      { prompt: "Pepper, escreve um headline pra Instagram da Totum sem emoji" },
      {
        prompt:
          "Pepper, faz copy de anúncio Meta vendendo automação WhatsApp pra PME",
      },
      {
        prompt:
          "Pepper, e-mail B2B pra reativar lead que sumiu há 30 dias, modo Eugene",
      },
    ],
    chatExposed: true,
    channels: ["via-pepper"],
    notes:
      "Não recebe mensagem direta de cliente — só de Pepper via tool Agent. Entrega texto, Pepper sintetiza. Output exemplo real: \"uPixel CRM: transforme leads em vendas sem deixar oportunidade morrer no WhatsApp.\"",
  },
  {
    id: "paulo",
    name: "Paulo",
    codename: "Paulo-dev",
    emoji: "🛠️",
    role: "Desenvolvedor full-stack",
    description: "Stack Totum decorada (Next, Vite, Supabase, Coolify, n8n, PM2, Traefik, PostgreSQL).",
    longDescription:
      "Subagente N3 sob Pepper. Persona Totum-aligned (SOUL.md 2.8KB) em M59. Regras hard: sempre 127.0.0.1 (D-017), NÃO migrar Supabase (D-001), vault .env = território Sentinela M61, restart gateway requer autorização. Conhece D-007 (rotação) e D-008 (fork OpenClaw). Anti-alucinação ativa — sinaliza \"Premissa: ... não decisão oficial D-XXX\".",
    status: "online",
    departmentId: "exec",
    managerId: "main",
    subordinates: [],
    model: "openai-codex/gpt-5.5",
    capabilities: [
      { label: "Full-stack Dev" },
      { label: "Supabase / Postgres" },
      { label: "Coolify / Docker" },
      { label: "Debug Infra" },
      { label: "Stack Totum decorada" },
    ],
    tools: ["memory_search", "memory_get", "edit", "message", "exec"],
    examples: [
      {
        prompt:
          "Pepper, como verifico se a SUPABASE_SERVICE_ROLE_KEY do xusdh ainda é válida?",
      },
      { prompt: "Pepper, como fica o stack do Mission Control com Next.js?" },
      { prompt: "Pepper, debugar timeout em Edge Function Supabase" },
    ],
    chatExposed: true,
    channels: ["via-pepper"],
    notes:
      "Output exemplo real: curl -i $URL/auth/v1/admin/users com interpretação de cada código HTTP.",
  },
  {
    id: "amanda",
    name: "Amanda",
    codename: "Amanda-crm (D-033 dual-scope)",
    emoji: "🤝",
    role: "CRM + Atendimento WhatsApp",
    description:
      "Pipeline (Doutor House CRM), follow-up, qualificação SPIN/BANT. D-033: serve TAMBÉM como persona Atendimento via wpp-router.",
    longDescription:
      "Subagente N3 sob Pepper. Persona Totum-aligned (SOUL.md 2.4KB) em M59. SPIN/BANT/AIDA decorados. Tom WhatsApp B2B PME, mensagens curtas. Quando invocada pelo wpp-router (M92 POC), recebe persona Atendimento Totum inline e classifica intent [orcamento|duvida_produto|suporte_pedido|reclamacao|outro].",
    status: "online",
    departmentId: "exec",
    managerId: "main",
    subordinates: [],
    model: "openai-codex/gpt-5.5",
    capabilities: [
      { label: "CRM Doutor House" },
      { label: "Follow-up" },
      { label: "SPIN / BANT / AIDA" },
      { label: "WhatsApp atendimento" },
      { label: "Classificação de intent" },
    ],
    tools: ["memory_search", "memory_get", "edit", "message"],
    examples: [
      { prompt: "Pepper, como abordo um lead frio do CRM?" },
      {
        prompt:
          "Pepper, monta follow-up D+3 pra lead que viu demo do uPixel e sumiu",
      },
      {
        prompt: "(via WhatsApp atendimento-wpp) Oi, queria saber preço da Totum",
      },
    ],
    chatExposed: true,
    channels: ["via-pepper", "whatsapp"],
    notes:
      "D-033: reuso pragmático pra atendimento-wpp (M92 POC). V1 migra atendimento pra agent_id próprio quando houver janela de restart autorizada.",
  },
  {
    id: "juliana",
    name: "Juliana",
    codename: "Juliana-ops",
    emoji: "📋",
    role: "Operações e processos",
    description: "SOPs, gestão de projetos, deadlines, prioridades, board M-XX.",
    longDescription:
      "Subagente N3 sob Pepper. Persona Totum-aligned (SOUL.md 2.3KB) em M59. SOP em formato Dono/Gatilho/Passos/Critério. Frameworks: GTD, OKR, RACI, MoSCoW. Conhece estrutura M-XX, não inventa missão — propõe via [CP→ARQ] sugiro M-XX.",
    status: "online",
    departmentId: "exec",
    managerId: "main",
    subordinates: [],
    model: "openai-codex/gpt-5.5",
    capabilities: [
      { label: "SOP", hint: "Dono/Gatilho/Passos/Critério" },
      { label: "Gestão de Projetos" },
      { label: "OKR / RACI / MoSCoW" },
      { label: "Board M-XX" },
      { label: "Onboarding" },
    ],
    tools: ["memory_search", "memory_get", "edit", "message"],
    examples: [
      { prompt: "Pepper, estrutura SOP de rotação trimestral de credencial API" },
      { prompt: "Pepper, qual processo de onboarding cliente?" },
      {
        prompt: "Pepper, organiza essas 5 demandas do Rael em ordem de prioridade",
      },
    ],
    chatExposed: true,
    channels: ["via-pepper"],
    notes:
      "Bug fix M59: modelo era Sonnet 4.5 (sem chain de fallback) → falhava chain_exhausted. Trocado pra Codex igual outras 3.",
  },

  // ----- LEGADO Denderson — broken (OAuth expirou) -----
  {
    id: "rafael",
    name: "Rafael",
    codename: "Rafael",
    emoji: "💤",
    role: "Indefinido (template Denderson)",
    description:
      "Existe em agents.list[] mas SEM SOUL.md Totum. Sonnet 4.5 = OAuth expirado (M71).",
    longDescription:
      "Workspace tem template Denderson genérico (\"You're not a chatbot. You're becoming someone.\"). Não está em allowAgents ativos do MVP Pepper. Modelo retornaria 401 hoje. Pepper.subagents.allowAgents ainda tem rafael — M59 não limpou.",
    status: "broken",
    departmentId: "intel",
    managerId: "main",
    subordinates: [],
    model: "anthropic/claude-sonnet-4-5",
    capabilities: [],
    tools: [],
    examples: [],
    chatExposed: false,
    channels: [],
    notes: "BROKEN = sem persona Totum + modelo Sonnet expirado. Repurposar (V2) ou remover do agents.list[].",
  },
  {
    id: "matheus",
    name: "Matheus",
    codename: "Matheus",
    emoji: "💤",
    role: "Indefinido (template Denderson)",
    description:
      "Sem persona Totum + OAuth expirado + DUPLICADO no openclaw.json (bug histórico).",
    longDescription:
      "Mesma situação do Rafael. NÃO confundir com matheus_clone (account Telegram desabilitado em M39.1, NÃO é agent).",
    status: "broken",
    departmentId: "exec",
    managerId: "main",
    subordinates: [],
    model: "anthropic/claude-sonnet-4-5",
    capabilities: [],
    tools: [],
    examples: [],
    chatExposed: false,
    channels: [],
    notes: "BROKEN + DUPLICATED: aparece 2× em agents.list[]. Dedup + repurposar ou remover V1.",
  },

  // ----- LEGADO Denderson — config (modelo OK, sem persona) -----
  ...(
    [
      { id: "davi", emoji: "💤" },
      { id: "lucas", emoji: "💤" },
      { id: "felipe", emoji: "💤" },
      { id: "carolina", emoji: "💤" },
      { id: "bianca", emoji: "💤" },
    ] as const
  ).map(
    (l): AgentEntry => ({
      id: l.id,
      name: l.id.charAt(0).toUpperCase() + l.id.slice(1),
      codename: l.id.charAt(0).toUpperCase() + l.id.slice(1),
      emoji: l.emoji,
      role: "Indefinido (template Denderson)",
      description: "Modelo Codex OK, sem persona Totum SOUL.md.",
      longDescription:
        "Workspace tem template Denderson genérico. Não invocado pelo MVP. Pepper.subagents.allowAgents lista. Repurposar quando demanda específica (ex: SDR-WhatsApp fase 2 M92, time copy A/B).",
      status: "config",
      departmentId: "exec",
      managerId: "main",
      subordinates: [],
      model: "openai-codex/gpt-5.5",
      capabilities: [],
      tools: [],
      examples: [],
      chatExposed: false,
      channels: [],
      notes: "Stub legado. Aguarda persona M59-like e demanda real.",
    })
  ),
];

// ============================================================
// Agentes planejados (missing_planned no inventory M96).
// Decisão: Pepper recomenda OPÇÃO B — mostrar com badge "Planejado".
// UI vira mapa do roadmap, sem mentir verde.
// ============================================================
export interface PlannedAgent {
  name: string;
  emoji: string;
  role: string;
  departmentId: DepartmentId;
  note: string;
}

export const PLANNED_AGENTS: PlannedAgent[] = [
  {
    name: "Pesquisador",
    emoji: "🔬",
    role: "Pesquisa e curadoria",
    departmentId: "intel",
    note: "Planejado V2. Não existe agent OpenClaw ainda.",
  },
  {
    name: "Consultor",
    emoji: "🧭",
    role: "Análise estratégica",
    departmentId: "intel",
    note: "Planejado V2.",
  },
  {
    name: "TARS",
    emoji: "🤖",
    role: "N1 CTO (aspiracional)",
    departmentId: "intel",
    note: "INDICE_TOTUM_OS. Não rodando ainda.",
  },
  {
    name: "Hermione",
    emoji: "📚",
    role: "CDO/CIO (curadoria de conhecimento)",
    departmentId: "intel",
    note: "Conceito no INDICE_TOTUM_OS. Existe em totum-model-gateway mas não como agent OpenClaw.",
  },
  {
    name: "Jarvis",
    emoji: "🛡️",
    role: "VP Engineering (orquestrado por Pepper)",
    departmentId: "exec",
    note: "Conceitual JARVIS_RUNBOOK_v1. Hoje Pepper age como Jarvis externo durante bootstrap (D-012).",
  },
  {
    name: "Liz",
    emoji: "📐",
    role: "CPO (Chief Product Officer)",
    departmentId: "exec",
    note: "INDICE_TOTUM_OS. Sem agent OpenClaw.",
  },
];

// ============================================================
// Helpers
// ============================================================
export function findAgent(id: string): AgentEntry | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function agentsByDepartment(dept: DepartmentId): AgentEntry[] {
  return AGENTS.filter((a) => a.departmentId === dept);
}

export function getOrchestrator(): AgentEntry {
  const o = findAgent(ORCHESTRATOR_ID);
  if (!o) throw new Error("Orchestrator not configured");
  return o;
}

export function specialists(): AgentEntry[] {
  return AGENTS.filter((a) => a.id !== ORCHESTRATOR_ID);
}

export function activeSubordinates(): AgentEntry[] {
  return AGENTS.filter(
    (a) =>
      a.id !== ORCHESTRATOR_ID && a.status === "online" && a.chatExposed
  );
}

export function plannedByDepartment(dept: DepartmentId): PlannedAgent[] {
  return PLANNED_AGENTS.filter((p) => p.departmentId === dept);
}

// ============================================================
// Compat com sidebar do chat — só agentes chatExposed
// ============================================================
export interface AgentDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const AGENT_DEFS: AgentDef[] = AGENTS.filter((a) => a.chatExposed).map(
  (a) => ({
    id: a.id,
    name: a.name,
    emoji: a.emoji,
    description: a.description,
  })
);
