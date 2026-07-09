import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppNav } from "@/components/layout/AppNav";
import { AgentsDirectory } from "@/components/agents/AgentsDirectory";
import { TOTUM_AGENTS, TOTUM_AGENT_TYPES } from "@/lib/totum-agents-page";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agentes — Totum OS",
  description: "Diretório dos agentes IA da Totum por tipo de trabalho.",
};

export default async function AgentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-surface">
      <AppNav
        user={{ name: session.name ?? "Usuário", email: session.email ?? null }}
      />

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 md:px-8">
        <header className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="max-w-3xl space-y-3">
            <span className="totum-badge totum-badge-warm">Totum OS</span>
          <h1 className="text-section-heading text-white">
              Agentes
          </h1>
          <p className="text-body-lg text-text-soft">
              <strong>{TOTUM_AGENTS.length}</strong> agentes organizados em{" "}
              <strong>{TOTUM_AGENT_TYPES.length}</strong> tipos de trabalho para
              pesquisar, criar, consultar e executar dentro da operação Totum.
          </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pepper fica no topo como orquestradora. O restante do time aparece
              por especialidade para deixar claro quem acionar em cada contexto.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {TOTUM_AGENT_TYPES.map((type) => (
              <div key={type.id} className="totum-card p-4">
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-elevated text-lg"
                    aria-hidden="true"
                  >
                    {type.emoji}
                  </span>
                  <div>
                    <h2 className="text-base font-normal text-white">
                      {type.name}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {
                        TOTUM_AGENTS.filter((agent) => agent.typeId === type.id)
                          .length
                      }{" "}
                      agentes
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </header>

        <AgentsDirectory />
      </main>
    </div>
  );
}
