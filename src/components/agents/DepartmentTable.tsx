import Link from "next/link";
import {
  DEPARTMENTS,
  agentsByDepartment,
  type Department,
} from "@/lib/agents-data";
import { StatusPill } from "./StatusPill";

const ACCENT_BG: Record<Department["accent"], string> = {
  red: "rgba(218,33,40,0.12)",
  purple: "rgba(160,111,246,0.12)",
  blue: "rgba(7,122,199,0.12)",
};

const ACCENT_DOT: Record<Department["accent"], string> = {
  red: "bg-primary",
  purple: "bg-brand-purple-bright",
  blue: "bg-secondary",
};

export function DepartmentTable() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {DEPARTMENTS.map((d) => {
        const team = agentsByDepartment(d.id);
        return (
          <article
            key={d.id}
            className="totum-card p-6 flex flex-col gap-4"
          >
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
            <ul className="space-y-2 pt-2">
              {team.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/chat?agent=${a.id}`}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-elevated/60 transition-colors group"
                  >
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
                  </Link>
                </li>
              ))}
              {team.length === 0 && (
                <li className="text-xs text-muted-foreground italic px-2">
                  (sem agentes ainda)
                </li>
              )}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
