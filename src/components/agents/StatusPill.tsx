import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/agents-data";

const LABEL: Record<AgentStatus, string> = {
  online: "Online",
  beta: "Beta",
  config: "Config",
};

const DOT: Record<AgentStatus, string> = {
  online: "bg-success shadow-[0_0_8px_var(--success)]",
  beta: "bg-brand-red-light shadow-[0_0_8px_var(--brand-red-light)]",
  config: "bg-secondary shadow-[0_0_8px_var(--secondary)]",
};

export function StatusPill({ status }: { status: AgentStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs"
      style={{
        background: "rgba(255,255,255,0.06)",
        boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.08)",
      }}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      <span className="text-text-soft">{LABEL[status]}</span>
    </span>
  );
}
