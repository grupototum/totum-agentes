"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight, Sparkles, Cpu, Info } from "lucide-react";
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
  const inactive = agent.status === "broken" || agent.status === "config";

  return (
    <article
      className={cn("totum-card overflow-hidden", inactive && "opacity-75")}
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
          <span className="flex items-center gap-2 flex-wrap">
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
          className="px-6 pb-6 pt-2 space-y-5"
          style={{ boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.06)" }}
        >
          <p className="text-sm text-text-soft leading-relaxed pt-3">
            {agent.longDescription}
          </p>

          <section className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="h-3 w-3" aria-hidden="true" />
              <span className="text-text-soft font-mono">{agent.model}</span>
            </span>
            {agent.channels.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <span>Canais:</span>
                {agent.channels.map((c) => (
                  <span key={c} className="totum-badge">
                    {c}
                  </span>
                ))}
              </span>
            )}
          </section>

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
                    <div className="text-sm text-white">&ldquo;{ex.prompt}&rdquo;</div>
                    {ex.outcome && (
                      <>
                        <div className="text-xs text-muted-foreground mt-2 mb-1">
                          {agent.name} entrega:
                        </div>
                        <div className="text-sm text-text-soft">{ex.outcome}</div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {agent.notes && (
            <section
              className="rounded-xl p-3 text-xs"
              style={{
                background: "rgba(218,33,40,0.06)",
                boxShadow: "inset 0 0 0 1px rgba(218,33,40,0.18)",
              }}
            >
              <div className="flex gap-2 items-start text-text-soft">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand-red-light" aria-hidden="true" />
                <span>
                  <span className="block text-[10px] uppercase tracking-widest text-brand-red-light mb-1">
                    Nota técnica
                  </span>
                  {agent.notes}
                </span>
              </div>
            </section>
          )}

          {agent.chatExposed && agent.status === "online" && (
            <div className="pt-2">
              <Link
                href={`/chat?agent=${agent.id}`}
                className="totum-pill totum-pill-primary inline-flex"
              >
                Conversar com {agent.name}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
