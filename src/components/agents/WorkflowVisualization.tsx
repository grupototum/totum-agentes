"use client";

import * as React from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { getOrchestrator, specialists } from "@/lib/agents-data";

const STEPS = [
  { id: "ask", label: "Você pergunta", emoji: "💬" },
  { id: "route", label: "Pepper roteia", emoji: "🌶️" },
  { id: "exec", label: "Especialista executa", emoji: "⚡" },
  { id: "synth", label: "Síntese final", emoji: "✨" },
  { id: "answer", label: "Resposta entregue", emoji: "📨" },
];

export function WorkflowVisualization() {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const orchestrator = getOrchestrator();
  const sp = specialists();

  return (
    <div ref={ref} className="totum-card-brand p-6 md:p-8">
      <div className="flex md:items-center gap-3 md:gap-2 overflow-x-auto pb-3 -mx-2 px-2 snap-x snap-mandatory md:snap-none">
        {STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 0.12 * i, duration: 0.4, ease: "easeOut" }}
              className="snap-start shrink-0 w-[160px] md:w-auto md:flex-1"
            >
              <div
                className="rounded-2xl px-4 py-5 h-full flex flex-col items-center text-center gap-2"
                style={{
                  background: "var(--surface)",
                  boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.08)",
                }}
              >
                <span className="text-2xl" aria-hidden="true">
                  {step.emoji}
                </span>
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  Passo {i + 1}
                </span>
                <span className="text-sm text-white leading-tight">
                  {step.label}
                </span>
              </div>
            </motion.div>
            {i < STEPS.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.12 * i + 0.2, duration: 0.3 }}
                className="hidden md:flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-6 pt-5" style={{ boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.08)" }}>
        <div className="flex items-center justify-center flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Time atual:</span>
          <span className="text-base" aria-hidden="true">{orchestrator.emoji}</span>
          <span className="text-text-soft">{orchestrator.name}</span>
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
          {sp.map((a) => (
            <React.Fragment key={a.id}>
              <span className="text-base" aria-hidden="true">
                {a.emoji}
              </span>
              <span className="text-text-soft">{a.name}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
