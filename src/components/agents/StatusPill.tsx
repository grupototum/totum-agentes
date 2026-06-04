import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/lib/agents-data";

const LABEL: Record<AgentStatus, string> = {
  online: "Online",
  beta: "Beta",
  config: "Stub",
  broken: "Broken",
};

const DOT: Record<AgentStatus, string> = {
  online: "bg-success shadow-[0_0_8px_var(--success)]",
  beta: "bg-brand-red-light shadow-[0_0_8px_var(--brand-red-light)]",
  config: "bg-muted-foreground",
  broken: "bg-destructive shadow-[0_0_8px_var(--destructive)]",
};

export function StatusPill({ status }: { status: AgentStatus }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs"
      style={{
        background: "rgba(255,255,255,0.06)",
        boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.08)",
      }}
      title={
        status === "config"
          ? "Stub legado — modelo ok, sem persona Totum"
          : status === "broken"
            ? "Quebrado — modelo expirado ou sem persona"
            : undefined
      }
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      <span className="text-text-soft">{LABEL[status]}</span>
    </span>
  );
}

export function PlannedPill() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs"
      style={{
        background: "rgba(255,255,255,0.04)",
        boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.06)",
      }}
      title="Planejado pra V2 — não roda ainda"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
      <span className="text-muted-foreground">Planejado</span>
    </span>
  );
}
