/**
 * Re-export compat layer.
 * Catálogo real está em agents-data.ts (com departamentos, hierarquia, examples).
 * Mantemos AGENTS/findAgent/AgentDef aqui pra não quebrar imports existentes.
 */
export type { AgentDef } from "./agents-data";
export { AGENT_DEFS as AGENTS, findAgent } from "./agents-data";
