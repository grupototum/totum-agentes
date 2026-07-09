"use client";

import * as React from "react";
import { Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TOTUM_AGENTS,
  TOTUM_AGENT_TYPES,
  getAgentType,
  type TotumAgentTypeId,
} from "@/lib/totum-agents-page";

type FilterId = "all" | TotumAgentTypeId;

const FILTERS: Array<{ id: FilterId; label: string; emoji?: string }> = [
  { id: "all", label: "Todos" },
  ...TOTUM_AGENT_TYPES.map((type) => ({
    id: type.id,
    label: type.name,
    emoji: type.emoji,
  })),
];

export function AgentsDirectory() {
  const [activeFilter, setActiveFilter] = React.useState<FilterId>("all");

  const visibleAgents = React.useMemo(() => {
    if (activeFilter === "all") return TOTUM_AGENTS;
    return TOTUM_AGENTS.filter((agent) => agent.typeId === activeFilter);
  }, [activeFilter]);

  return (
    <section aria-labelledby="agents-directory-title" className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h2 id="agents-directory-title" className="text-subheading text-white">
            Diretório
          </h2>
          <p className="text-sm text-muted-foreground">
            Filtre por tipo para encontrar rapidamente quem pesquisa, cria,
            consulta ou executa.
          </p>
        </div>

        <div
          className="flex flex-wrap gap-2 rounded-[24px] bg-neutral p-2"
          style={{ boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.08)" }}
          aria-label="Filtrar agentes por tipo"
        >
          {FILTERS.map((filter) => {
            const active = filter.id === activeFilter;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-white text-surface"
                    : "text-text-soft hover:bg-white/5 hover:text-white"
                )}
              >
                {filter.emoji && <span aria-hidden="true">{filter.emoji}</span>}
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleAgents.map((agent) => {
          const type = getAgentType(agent.typeId);
          return (
            <article key={agent.name} className="totum-card p-5">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-elevated text-xl"
                  style={{ boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.08)" }}
                >
                  <span aria-hidden="true">{type.emoji}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-normal leading-tight text-white">
                      {agent.name}
                    </h3>
                    <span className="totum-badge">{type.name}</span>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-text-soft">
                    {agent.description}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-red-light" aria-hidden="true" />
          {visibleAgents.length} de {TOTUM_AGENTS.length} agentes exibidos
        </span>
        <span className="hidden h-1 w-1 rounded-full bg-muted-foreground sm:block" />
        <span className="inline-flex items-center gap-2">
          <Search className="h-4 w-4 text-brand-red-light" aria-hidden="true" />
          Agrupados em {TOTUM_AGENT_TYPES.length} tipos de trabalho
        </span>
      </div>
    </section>
  );
}
