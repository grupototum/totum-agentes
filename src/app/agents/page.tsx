import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppNav } from "@/components/layout/AppNav";
import { HierarchyTree } from "@/components/agents/HierarchyTree";
import { DepartmentTable } from "@/components/agents/DepartmentTable";
import { AgentCard } from "@/components/agents/AgentCard";
import { WorkflowVisualization } from "@/components/agents/WorkflowVisualization";
import { AGENTS, getOrchestrator, specialists } from "@/lib/agents-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Time de agentes — Totum",
  description: "Conheça os 5 agentes IA da Totum, suas competências e como o time trabalha.",
};

export default async function AgentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orchestrator = getOrchestrator();
  const sp = specialists();
  const totalCount = AGENTS.length;

  return (
    <div className="min-h-screen bg-surface">
      <AppNav user={{ name: session.name ?? "Usuário", email: session.email ?? null }} />

      <main className="mx-auto max-w-6xl px-4 md:px-8 py-10 space-y-14">
        {/* Hero */}
        <header className="space-y-3 max-w-3xl">
          <span className="totum-badge totum-badge-warm">Time IA</span>
          <h1 className="text-section-heading text-white">
            Conheça o time que trabalha pra você.
          </h1>
          <p className="text-body-lg text-text-soft">
            {totalCount} agentes — 1 orquestrador (<strong>{orchestrator.name}</strong>)
            que coordena {sp.length} especialistas. Cada um com domínio próprio,
            ferramentas próprias, voz própria.
          </p>
        </header>

        {/* Section 1 — Hierarchy Tree */}
        <section aria-labelledby="hierarchy-title" className="space-y-4">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 id="hierarchy-title" className="text-subheading text-white">
                Hierarquia
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {orchestrator.name} no topo. Toda mensagem passa por ela primeiro.
              </p>
            </div>
          </div>
          <HierarchyTree />
        </section>

        {/* Section 2 — Departamentos */}
        <section aria-labelledby="depts-title" className="space-y-4">
          <div>
            <h2 id="depts-title" className="text-subheading text-white">
              Departamentos
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Especialistas agrupados por domínio. Status em tempo real.
            </p>
          </div>
          <DepartmentTable />
        </section>

        {/* Section 3 — Agent Cards (cada um expansível) */}
        <section aria-labelledby="agents-title" className="space-y-4">
          <div>
            <h2 id="agents-title" className="text-subheading text-white">
              Catálogo completo
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Click pra expandir e ver capacidades, ferramentas e exemplos.
            </p>
          </div>
          <div className="space-y-3">
            {AGENTS.map((a, idx) => (
              <AgentCard key={a.id} agent={a} defaultExpanded={idx === 0} />
            ))}
          </div>
        </section>

        {/* Section 4 — Workflow Visualization */}
        <section aria-labelledby="workflow-title" className="space-y-4">
          <div>
            <h2 id="workflow-title" className="text-subheading text-white">
              Fluxo de trabalho
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Como uma pergunta vira resposta.
            </p>
          </div>
          <WorkflowVisualization />
        </section>

        {/* Footer pequeno */}
        <footer className="text-center text-xs text-muted-foreground py-8">
          IDs canônicos confirmados em <code className="text-text-soft">/root/.openclaw/docs/GATEWAY_API_FOR_AGENTES_UI.md</code>
        </footer>
      </main>
    </div>
  );
}
