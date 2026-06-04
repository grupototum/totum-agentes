/**
 * Catálogo canônico de agentes Totum.
 *
 * Fonte da verdade dos IDs: /root/.openclaw/docs/GATEWAY_API_FOR_AGENTES_UI.md
 * Distribuição em departamentos: proposta inicial — confirmar com Rael/Pepper.
 */

export type AgentStatus = "online" | "beta" | "config";

export interface AgentCapability {
  label: string;
  hint?: string;
}

export interface AgentExample {
  prompt: string;
  outcome: string;
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
  capabilities: AgentCapability[];
  tools: string[];
  examples: AgentExample[];
}

export type DepartmentId = "inteligencia" | "criacao" | "consultoria";

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
    id: "inteligencia",
    name: "Inteligência",
    tagline: "Sistemas, lógica, código",
    description:
      "Núcleo técnico — desenvolvimento, automação, análise. Trabalha com dados estruturados e raciocínio formal.",
    emoji: "🧠",
    accent: "red",
  },
  {
    id: "criacao",
    name: "Criação",
    tagline: "Conteúdo, storytelling, voz",
    description:
      "Núcleo narrativo — copy, posicionamento, design de mensagem. Trabalha com linguagem e identidade.",
    emoji: "✍️",
    accent: "purple",
  },
  {
    id: "consultoria",
    name: "Consultoria",
    tagline: "Cliente, vendas, operações",
    description:
      "Interface com cliente — CRM, comercial, processos. Trabalha com relacionamento e execução.",
    emoji: "📋",
    accent: "blue",
  },
];

// Mapeamento departamento → agente (TODO confirmar com Rael)
// Pepper (main) é Orquestrador — fora dos departamentos
export const ORCHESTRATOR_ID = "main";

export const AGENTS: AgentEntry[] = [
  {
    id: "main",
    name: "Pepper",
    codename: "CEO digital",
    emoji: "🌶️",
    role: "Orquestrador",
    description: "Coordena os 4 especialistas + delega + sintetiza respostas.",
    longDescription:
      "Pepper é a coordenadora central. Recebe qualquer pergunta, decide qual especialista atende melhor (ou se ela mesma responde), delega via Cascata Circular, sintetiza retornos. Roda em Sonnet 4.5 quando disponível, fallback Codex GPT-5.5.",
    status: "online",
    departmentId: null,
    managerId: null,
    subordinates: ["jonathan", "paulo", "amanda", "juliana"],
    capabilities: [
      { label: "Roteamento de tarefas", hint: "Decide qual subagente atende" },
      { label: "Síntese de múltiplas respostas" },
      { label: "Decisões estratégicas", hint: "Frameworks YC + agente" },
      { label: "Memória executiva", hint: "/root/.openclaw/workspace" },
    ],
    tools: ["openclaw agent", "memória persistente", "delegação subagentes"],
    examples: [
      {
        prompt: "Qual a próxima ação pro lançamento Pop Totum?",
        outcome: "Plano em 5 passos, delega Jonathan pra copy e Amanda pra CRM.",
      },
      {
        prompt: "Resume as decisões da semana",
        outcome: "Sumário cronológico extraído do DECISOES.md + PROGRESSO.",
      },
    ],
  },
  {
    id: "paulo",
    name: "Paulo",
    codename: "Engenheiro",
    emoji: "💻",
    role: "Dev / Sistemas",
    description: "Código, arquitetura, debugging, deploys.",
    longDescription:
      "Paulo cuida do estaleiro técnico. TypeScript/Python first, conhece a stack VPS (Next 15 + Postgres + Keycloak + cloudflared). Faz code review, debug de produção, planeja refactors.",
    status: "online",
    departmentId: "inteligencia",
    managerId: "main",
    subordinates: [],
    capabilities: [
      { label: "Code review" },
      { label: "Debug production", hint: "Logs pm2 + postgres" },
      { label: "Arquitetura de sistemas" },
      { label: "Deploy + CI/CD" },
    ],
    tools: ["bash", "git", "pm2", "psql", "docker"],
    examples: [
      {
        prompt: "Por que /api/messages tá retornando 502 só em prompts longos?",
        outcome: "Identifica timeout CLI 90s + Cloudflare 100s. Propõe SSE.",
      },
      {
        prompt: "Refatora ChatClient pra usar context provider",
        outcome: "Diff completo + commit message + plano de rollback.",
      },
    ],
  },
  {
    id: "jonathan",
    name: "Jonathan",
    codename: "Voz da marca",
    emoji: "✍️",
    role: "Copywriter",
    description: "Copy, posicionamento, storytelling, voice & tone.",
    longDescription:
      "Jonathan é a caneta. Escreve copy de landing, email, posts, scripts de vendas. Mantém tom Totum (direto, confiante, anti-jargão). Faz crítica de copy alheio.",
    status: "online",
    departmentId: "criacao",
    managerId: "main",
    subordinates: [],
    capabilities: [
      { label: "Copy de landing/email" },
      { label: "Scripts de vendas" },
      { label: "Posicionamento de produto" },
      { label: "Crítica de copy" },
    ],
    tools: ["frameworks YC", "voice & tone Totum", "estrutura AIDA/PAS"],
    examples: [
      {
        prompt: "Headline pra landing do Pop Totum Unificado",
        outcome: "5 variantes A/B-testáveis com lógica de cada uma.",
      },
      {
        prompt: "Revisa essa proposta comercial",
        outcome: "Marca trechos vagos + sugere reescrita + checklist final.",
      },
    ],
  },
  {
    id: "amanda",
    name: "Amanda",
    codename: "Closer",
    emoji: "📋",
    role: "CRM / Comercial",
    description: "Pipeline, follow-up, qualificação, fechamento.",
    longDescription:
      "Amanda toca o comercial. Conhece SPIN, MEDDIC, pipeline by stage. Escreve email de follow-up, qualifica lead, prepara reunião, monta pitch deck.",
    status: "online",
    departmentId: "consultoria",
    managerId: "main",
    subordinates: [],
    capabilities: [
      { label: "Qualificação de lead", hint: "BANT/MEDDIC" },
      { label: "Follow-up emails" },
      { label: "Preparação de reunião" },
      { label: "Pitch decks" },
    ],
    tools: ["frameworks comerciais", "CRM mental", "playbook Totum"],
    examples: [
      {
        prompt: "Lead frio respondeu 'me manda mais info' — próximo passo?",
        outcome: "Email curto + 3 perguntas qualificadoras + CTA agenda 15min.",
      },
      {
        prompt: "Cliente quer desconto de 30% — como reagir?",
        outcome: "Roteiro com 3 respostas (preço-âncora, valor, walk-away).",
      },
    ],
  },
  {
    id: "juliana",
    name: "Juliana",
    codename: "Ops",
    emoji: "⚙️",
    role: "Operações / Processos",
    description: "Onboarding, processos, SLA, suporte.",
    longDescription:
      "Juliana mantém o motor girando. Cuida de onboarding de cliente, criação de SOPs, gestão de SLA, escalonamento de suporte, automações operacionais (zapier-like).",
    status: "beta",
    departmentId: "consultoria",
    managerId: "main",
    subordinates: [],
    capabilities: [
      { label: "Onboarding playbooks" },
      { label: "SOPs / documentação" },
      { label: "Suporte L1/L2", hint: "Triagem + escalonamento" },
      { label: "Automações operacionais" },
    ],
    tools: ["templates SOP", "matriz RACI", "métricas SLA"],
    examples: [
      {
        prompt: "Cliente reclamou 3x do mesmo bug — protocolo?",
        outcome: "Escalation matrix + comm com cliente + handoff técnico.",
      },
      {
        prompt: "Cria SOP de onboarding novo cliente Pop Totum",
        outcome: "10 passos numerados + responsável + tempo estimado.",
      },
    ],
  },
];

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

// Compat com lib/agents.ts antigo (sidebar do chat consome esse shape)
export interface AgentDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export const AGENT_DEFS: AgentDef[] = AGENTS.map((a) => ({
  id: a.id,
  name: a.name,
  emoji: a.emoji,
  description: a.description,
}));
