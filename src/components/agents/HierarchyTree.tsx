"use client";

import * as React from "react";
import Link from "next/link";
import { activeSubordinates, getOrchestrator, type AgentEntry } from "@/lib/agents-data";
import { cn } from "@/lib/utils";

interface NodeProps {
  agent: AgentEntry;
  size?: "lg" | "md";
}

function Node({ agent, size = "md" }: NodeProps) {
  const dim = size === "lg" ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg";
  return (
    <Link
      href={`/chat?agent=${agent.id}`}
      className="group flex flex-col items-center gap-2 focus-visible:outline-none"
      aria-label={`Conversar com ${agent.name}`}
    >
      <span
        className={cn(
          "rounded-full flex items-center justify-center bg-neutral transition-shadow",
          "group-hover:shadow-[0_0_24px_-4px_var(--primary)]",
          "group-focus-visible:ring-2 group-focus-visible:ring-ring",
          dim
        )}
        style={{
          boxShadow:
            "inset 0 0 0 1px hsla(0,0%,100%,0.1), inset 0 1px 0 hsla(0,0%,100%,0.1)",
        }}
      >
        {agent.emoji}
      </span>
      <span className="text-center">
        <div
          className={cn(
            "font-normal text-white",
            size === "lg" ? "text-base" : "text-sm"
          )}
        >
          {agent.name}
        </div>
        <div className="text-[10px] text-muted-foreground tracking-wide uppercase">
          {agent.role}
        </div>
      </span>
    </Link>
  );
}

export function HierarchyTree() {
  const orchestrator = getOrchestrator();
  const sp = activeSubordinates();
  const cols = Math.max(sp.length, 1);
  const xs = Array.from({ length: cols }, (_, i) =>
    Math.round(120 + (i * 560) / Math.max(cols - 1, 1))
  );

  return (
    <div className="w-full">
      {/* Desktop: SVG tree */}
      <div className="hidden md:block relative py-10">
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
          preserveAspectRatio="none"
          viewBox="0 0 800 220"
        >
          <defs>
            <linearGradient id="totum-line" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(218,33,40,0.6)" />
              <stop offset="100%" stopColor="rgba(218,33,40,0.0)" />
            </linearGradient>
          </defs>
          <line x1="400" y1="60" x2="400" y2="120" stroke="url(#totum-line)" strokeWidth="1.5" />
          <line x1={xs[0]} y1="120" x2={xs[xs.length - 1]} y2="120" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
          {xs.map((x) => (
            <line
              key={x}
              x1={x}
              y1="120"
              x2={x}
              y2="160"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          ))}
        </svg>

        <div className="relative flex flex-col items-center gap-12">
          <Node agent={orchestrator} size="lg" />

          <div
            className="grid gap-4 w-full max-w-2xl"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {sp.map((a) => (
              <div key={a.id} className="flex justify-center">
                <Node agent={a} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: lista */}
      <div className="md:hidden space-y-3 py-4">
        <div className="totum-card p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Orquestrador
          </div>
          <Node agent={orchestrator} />
        </div>
        <div className="totum-card p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Especialistas ativos
          </div>
          <div className="grid grid-cols-2 gap-4">
            {sp.map((a) => (
              <Node key={a.id} agent={a} />
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-2">
        Apenas agentes <span className="text-text-soft">online</span> aparecem na hierarquia. Demais no catálogo abaixo.
      </p>
    </div>
  );
}
