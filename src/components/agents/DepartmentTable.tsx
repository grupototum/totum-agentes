import Link from "next/link";
import {
  DEPARTMENTS,
  agentsByDepartment,
  plannedByDepartment,
  type Department,
} from "@/lib/agents-data";
import { StatusPill, PlannedPill } from "./StatusPill";

const ACCENT_BG: Record<Department["accent"], string> = {
  red: "rgba(218,33,40,0.12)",
  purple: "rgba(160,111,246,0.12)",
  blue: "rgba(7,122,199,0.12)",
};

export function DepartmentTable() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {DEPARTMENTS.map((d) => {
        const team = agentsByDepartment(d.id);
        const planned = plannedByDepartment(d.id);
        return (
          <article key={d.id} className="totum-card p-6 flex flex-col gap-4">
            <header className="flex items-start gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: ACCENT_BG[d.accent] }}
              >
                {d.emoji}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-normal text-white tracking-title leading-tight">
                  {d.name}
                </h3>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-0.5">
                  {d.tagline}
                </p>
              </div>
            </header>
            <p className="text-sm text-text-soft leading-relaxed">{d.description}</p>

            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Time
              </div>
              <ul className="space-y-2">
                {team.length === 0 && (
                  <li className="text-xs text-muted-foreground italic px-2">
                    (sem agentes ativos)
                  </li>
                )}
                {team.map((a) => {
                  const exposed = a.chatExposed && a.status === "online";
                  const Wrap = ({ children }: { children: React.ReactNode }) =>
                    exposed ? (
                      <Link
                        href={`/chat?agent=${a.id}`}
                        className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-elevated/60 transition-colors"
                      >
                        {children}
                      </Link>
                    ) : (
                      <div
                        className="flex items-center gap-3 px-2 py-1.5 rounded-md opacity-60"
                        title="Não exposto no chat"
                      >
                        {children}
                      </div>
                    );
                  return (
                    <li key={a.id}>
                      <Wrap>
                        <span className="text-base">{a.emoji}</span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-white truncate">
                            {a.name}
                          </span>
                          <span className="block text-xs text-muted-foreground truncate">
                            {a.role}
                          </span>
                        </span>
                        <StatusPill status={a.status} />
                      </Wrap>
                    </li>
                  );
                })}
              </ul>
            </div>

            {planned.length > 0 && (
              <div className="space-y-1 pt-2" style={{ boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.06)" }}>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1 pt-2">
                  Planejado V2
                </div>
                <ul className="space-y-1.5">
                  {planned.map((p) => (
                    <li
                      key={p.name}
                      className="flex items-center gap-3 px-2 py-1.5 rounded-md opacity-70"
                      title={p.note}
                    >
                      <span className="text-base">{p.emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm text-text-soft truncate">
                          {p.name}
                        </span>
                        <span className="block text-xs text-muted-foreground truncate">
                          {p.role}
                        </span>
                      </span>
                      <PlannedPill />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
