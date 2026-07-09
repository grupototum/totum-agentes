export type TotumAgentTypeId =
  | "orchestrator"
  | "researcher"
  | "creative"
  | "consultant"
  | "executor";

export interface TotumAgentType {
  id: TotumAgentTypeId;
  name: string;
  emoji: string;
  description: string;
}

export interface TotumAgentProfile {
  name: string;
  typeId: TotumAgentTypeId;
  description: string;
}

export const TOTUM_AGENT_TYPES: TotumAgentType[] = [
  {
    id: "orchestrator",
    name: "Orquestrador",
    emoji: "🧠",
    description:
      "Coordena prioridades, entende o contexto do Rael e distribui trabalho para o time certo.",
  },
  {
    id: "researcher",
    name: "Pesquisador",
    emoji: "🔍",
    description:
      "Busca, valida e organiza informação antes de qualquer decisão importante.",
  },
  {
    id: "creative",
    name: "Criativo",
    emoji: "🎨",
    description:
      "Transforma estratégia em linguagem, campanhas, design, narrativas e peças de marca.",
  },
  {
    id: "consultant",
    name: "Consultor",
    emoji: "💡",
    description:
      "Analisa cenários, aponta riscos, estrutura argumentos e ajuda a decidir com clareza.",
  },
  {
    id: "executor",
    name: "Executor",
    emoji: "🚀",
    description:
      "Tira planos do papel: operações, desenvolvimento, processos, suporte e prospecção.",
  },
];

export const TOTUM_AGENTS: TotumAgentProfile[] = [
  {
    name: "Pepper",
    typeId: "orchestrator",
    description:
      "Orquestra o Totum OS, entende intenção, delega tarefas e sintetiza entregas finais.",
  },
  {
    name: "Jarvis",
    typeId: "researcher",
    description:
      "Pesquisa técnica e estratégica com foco em arquitetura, sistemas e decisões de engenharia.",
  },
  {
    name: "Yoda",
    typeId: "researcher",
    description:
      "Destila conhecimento complexo em princípios simples, úteis e fáceis de aplicar.",
  },
  {
    name: "Indiana",
    typeId: "researcher",
    description:
      "Investiga referências, pistas e materiais difíceis de achar para montar contexto confiável.",
  },
  {
    name: "Data",
    typeId: "researcher",
    description:
      "Organiza fatos, métricas e padrões para apoiar decisões baseadas em evidência.",
  },
  {
    name: "Eve",
    typeId: "researcher",
    description:
      "Observa sinais de mercado, comportamento e oportunidades ainda pouco óbvias.",
  },
  {
    name: "Sonar",
    typeId: "researcher",
    description:
      "Monitora ruídos, tendências e alertas para separar sinal forte de distração.",
  },
  {
    name: "Link",
    typeId: "researcher",
    description:
      "Conecta fontes, ferramentas e caminhos de pesquisa para acelerar descobertas.",
  },
  {
    name: "Tigrinha",
    typeId: "creative",
    description:
      "Cria ideias de campanha com energia comercial, ritmo social e senso de oportunidade.",
  },
  {
    name: "Tay",
    typeId: "creative",
    description:
      "Refina tom de voz, textos curtos e mensagens para conversas mais naturais.",
  },
  {
    name: "Roboto",
    typeId: "creative",
    description:
      "Gera variações de conteúdo, formatos e peças com precisão operacional.",
  },
  {
    name: "Loki",
    typeId: "creative",
    description:
      "Propõe ângulos inesperados, quebra padrões e testa alternativas de narrativa.",
  },
  {
    name: "Visu",
    typeId: "creative",
    description:
      "Cuida de direção visual, composição e coerência estética das entregas.",
  },
  {
    name: "Sorkin",
    typeId: "creative",
    description:
      "Estrutura roteiros, diálogos, argumentos e apresentações com cadência forte.",
  },
  {
    name: "Fignaldo",
    typeId: "creative",
    description:
      "Converte ideias em interfaces, layouts e protótipos prontos para evoluir.",
  },
  {
    name: "Hermione",
    typeId: "consultant",
    description:
      "Organiza conhecimento, documenta decisões e encontra a regra certa no momento certo.",
  },
  {
    name: "Sobral",
    typeId: "consultant",
    description:
      "Traduz estratégia em posicionamento, oferta e leitura de mercado.",
  },
  {
    name: "Saul",
    typeId: "consultant",
    description:
      "Avalia negociação, persuasão e caminhos pragmáticos para destravar acordos.",
  },
  {
    name: "Cláudia",
    typeId: "consultant",
    description:
      "Apoia decisões de gestão, relacionamento e comunicação com sensibilidade executiva.",
  },
  {
    name: "Miguel",
    typeId: "consultant",
    description:
      "Estrutura diagnósticos e recomenda próximos passos com lógica de consultoria.",
  },
  {
    name: "Walter White",
    typeId: "consultant",
    description:
      "Foca em causa raiz, precisão técnica e trade-offs quando o problema exige rigor.",
  },
  {
    name: "Matlock",
    typeId: "consultant",
    description:
      "Revisa argumentos, riscos e evidências antes de uma decisão sensível.",
  },
  {
    name: "Tio Patinhas",
    typeId: "consultant",
    description:
      "Olha margem, custo, retorno e prioridades financeiras sem romantizar planos.",
  },
  {
    name: "Juliana",
    typeId: "executor",
    description:
      "Organiza processos, prioridades, SOPs e acompanhamento operacional.",
  },
  {
    name: "Paulo",
    typeId: "executor",
    description:
      "Implementa produto, integra sistemas, depura stack e entrega código em produção.",
  },
  {
    name: "McGyver",
    typeId: "executor",
    description:
      "Resolve problemas práticos com recursos disponíveis e foco em funcionamento real.",
  },
  {
    name: "WALL·E",
    typeId: "executor",
    description:
      "Automatiza rotinas, limpa filas e mantém tarefas repetitivas sob controle.",
  },
  {
    name: "Sentinela",
    typeId: "executor",
    description:
      "Cuida de segurança, permissões, exposição e alertas críticos da operação.",
  },
  {
    name: "Zelador",
    typeId: "executor",
    description:
      "Mantém ambientes, documentação e pequenos reparos para a casa continuar em ordem.",
  },
  {
    name: "Davi",
    typeId: "executor",
    description:
      "SDR focado em prospecção, triagem inicial e abertura de conversas comerciais.",
  },
  {
    name: "Lucas",
    typeId: "executor",
    description:
      "SDR para cadências, follow-ups e qualificação de oportunidades.",
  },
  {
    name: "Felipe",
    typeId: "executor",
    description:
      "SDR para abordagem ativa, registro de contatos e avanço de leads no funil.",
  },
  {
    name: "Matheus",
    typeId: "executor",
    description:
      "SDR para pesquisa de contas, personalização de mensagens e organização de pipeline.",
  },
  {
    name: "Amanda",
    typeId: "executor",
    description:
      "SDR e atendimento com foco em qualificação, CRM e conversas de WhatsApp.",
  },
  {
    name: "Carolina",
    typeId: "executor",
    description:
      "SDR para relacionamento, retomada de leads e acompanhamento de propostas.",
  },
  {
    name: "Bianca",
    typeId: "executor",
    description:
      "SDR para cadência comercial, primeiro contato e organização de respostas.",
  },
];

export function getAgentType(typeId: TotumAgentTypeId): TotumAgentType {
  const type = TOTUM_AGENT_TYPES.find((item) => item.id === typeId);
  if (!type) throw new Error(`Unknown Totum agent type: ${typeId}`);
  return type;
}
