"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentEntry } from "@/lib/agents-data";
import { StatusPill } from "./StatusPill";

interface Props {
  agent: AgentEntry;
  defaultExpanded?: boolean;
}

export function AgentCard({ agent, defaultExpanded = false }: Props) {
  const [open, setOpen] = React.useState(defaultExpanded);
  const id = React.useId();

  return (
    <article
      className="totum-card overflow-hidden"
      aria-labelledby={`${id}-name`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`${id}-body`}
        className="w-full text-left px-6 py-5 flex items-center gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      >
        <span
          className="h-12 w-12 rounded-2xl flex items-center justify-center text-xl shrink-0 bg-neutral"
          style={{
            boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.08)",
          }}
        >
          {agent.emoji}
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2">
            <span id={`${id}-name`} className="text-lg font-normal text-white">
              {agent.name}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground truncate">
              {agent.codename}
            </span>
          </span>
          <span className="block text-sm text-text-soft truncate mt-0.5">
            {agent.description}
          </span>
        </span>
        <StatusPill status={agent.status} />
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={`${id}-body`}
          className="px-6 pb-6 pt-2 space-y-5 border-t-0"
          style={{ boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.06)" }}
        >
          <p className="text-sm text-text-soft leading-relaxed pt-3">
            {agent.longDescription}
          </p>

          {agent.capabilities.length > 0 && (
            <section>
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Capacidades
              </h4>
              <ul className="grid sm:grid-cols-2 gap-1.5">
                {agent.capabilities.map((c) => (
                  <li
                    key={c.label}
                    className="flex items-start gap-2 text-sm text-text-soft"
                  >
                    <span
                      className="mt-1.5 h-1 w-1 rounded-full bg-brand-red-light shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      {c.label}
                      {c.hint && (
                        <span className="text-muted-foreground"> — {c.hint}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {agent.tools.length > 0 && (
            <section>
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Ferramentas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {agent.tools.map((t) => (
                  <span key={t} className="totum-badge">
                    {t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {agent.examples.length > 0 && (
            <section>
              <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Exemplos de uso
              </h4>
              <div className="space-y-2">
                {agent.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--surface)",
                      boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.06)",
                    }}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      Você pergunta:
                    </div>
                    <div className="text-sm text-white">"{ex.prompt}"</div>
                    <div className="text-xs text-muted-foreground mt-2 mb-1">
                      {agent.name} entrega:
                    </div>
                    <div className="text-sm text-text-soft">{ex.outcome}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="pt-2">
            <Link
              href={`/chat?agent=${agent.id}`}
              className="totum-pill totum-pill-primary inline-flex"
            >
              Conversar com {agent.name}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}
