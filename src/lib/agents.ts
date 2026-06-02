export interface AgentDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

// IDs canônicos confirmados em /root/.openclaw/docs/GATEWAY_API_FOR_AGENTES_UI.md
export const AGENTS: AgentDef[] = [
  { id: "main", name: "Pepper", emoji: "🌶️", description: "CEO digital / generalista" },
  { id: "jonathan", name: "Jonathan", emoji: "✍️", description: "Copywriter" },
  { id: "paulo", name: "Paulo", emoji: "💻", description: "Dev" },
  { id: "amanda", name: "Amanda", emoji: "📋", description: "CRM" },
  { id: "juliana", name: "Juliana", emoji: "⚙️", description: "Ops" },
];

export function findAgent(id: string): AgentDef | undefined {
  return AGENTS.find((a) => a.id === id);
}
