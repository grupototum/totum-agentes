import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AppNav } from "@/components/layout/AppNav";
import { HierarchyTree } from "@/components/agents/HierarchyTree";
import { DepartmentTable } from "@/components/agents/DepartmentTable";
import { AgentCard } from "@/components/agents/AgentCard";
import { WorkflowVisualization } from "@/components/agents/WorkflowVisualization";
import {
  AGENTS,
  ORCHESTRATOR_ID,
  getOrchestrator,
  activeSubordinates,
} from "@/lib/agents-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Time de agentes — Totum",
  description:
    "Catálogo canônico dos agentes IA da Totum — quem está online, quem é legado, o que vem aí.",
};

export default async function AgentsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const orchestrator = getOrchestrator();
  const active = activeSubordinates();
  const legacy = AGENTS.filter(
    (a) =>
      a.id !== ORCHESTRATOR_ID &&
      (a.status === "broken" || a.status === "config")
  );

  return (
    <div className="min-h-screen bg-surface">
      <AppNav
        user={{ name: session.name ?? "Usuário", email: session.email ?? null }}
      />

      <main className="mx-auto max-w-6xl px-4 md:px-8 py-10 space-y-14">
        {/* Hero */}
        <header className="space-y-3 max-w-3xl">
          <span className="totum-badge totum-badge-warm">Time IA</span>
          <h1 className="text-section-heading text-white">
            Conheça o time que trabalha pra você.
          </h1>
          <p className="text-body-lg text-text-soft">
            <strong>{active.length + 1}</strong> agentes online —{" "}
            <strong>{orchestrator.name}</strong> orquestra,{" "}
            {active.length} especialistas executam.
            {legacy.length > 0 && (
              <span className="text-muted-foreground">
                {" "}
                Mais {legacy.length} stubs legados em config + roadmap V2 abaixo.
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Fonte:{" "}
            <code className="text-text-soft">
              /root/.openclaw/openclaw.json
            </code>
            {" "}via{" "}
            <code className="text-text-soft">docs/agentes-inventory.md</code>
            {" "}(Cérebro Pepper, M96).
          </p>
        </header>

        {/* Section 1 — Hierarchy Tree */}
        <section aria-labelledby="hierarchy-title" className="space-y-4">
          <div>
            <h2 id="hierarchy-title" className="text-subheading text-white">
              Hierarquia
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {orchestrator.name} no topo. Toda mensagem passa por ela primeiro.
            </p>
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
              Agrupamento por domínio. Inclui roadmap V2.
            </p>
          </div>
          <DepartmentTable />
        </section>

        {/* Section 3 — Catálogo ativos */}
        <section aria-labelledby="agents-title" className="space-y-4">
          <div>
            <h2 id="agents-title" className="text-subheading text-white">
              Catálogo — Online
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Click pra expandir e ver modelo, capacidades, ferramentas, exemplos
              e notas técnicas.
            </p>
          </div>
          <div className="space-y-3">
            <AgentCard agent={orchestrator} defaultExpanded />
            {active.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        </section>

        {/* Section 4 — Workflow */}
        <section aria-labelledby="workflow-title" className="space-y-4">
          <div>
            <h2 id="workflow-title" className="text-subheading text-white">
              Fluxo de trabalho
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cascata Circular: {orchestrator.name} decide, delega, sintetiza.
            </p>
          </div>
          <WorkflowVisualization />
        </section>

        {/* Section 5 — Legado / stubs (honestidade > maquiagem) */}
        {legacy.length > 0 && (
          <section aria-labelledby="legacy-title" className="space-y-4">
            <div>
              <h2 id="legacy-title" className="text-subheading text-white">
                Legado &amp; stubs
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Existem em{" "}
                <code className="text-text-soft">agents.list[]</code> mas{" "}
                <strong>não estão prontos pra usar</strong>. Aguardam persona
                Totum (M59-like), repurpose ou remoção.
              </p>
            </div>
            <div className="space-y-3">
              {legacy.map((a) => (
                <AgentCard key={a.id} agent={a} />
              ))}
            </div>
          </section>
        )}

        <footer className="text-center text-xs text-muted-foreground py-8 space-y-1">
          <p>
            Atualizar este catálogo: editar{" "}
            <code className="text-text-soft">docs/agentes-inventory.md</code>{" "}
            (Pepper) e reprocessar{" "}
            <code className="text-text-soft">src/lib/agents-data.ts</code>.
          </p>
        </footer>
      </main>
    </div>
  );
}
