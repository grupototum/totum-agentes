"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Plus,
  FolderKanban,
  Activity,
  LogOut,
  ArrowRight,
  Clock,
  Sparkles,
  Settings,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  status: "online" | "busy" | "offline";
}

interface Project {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  agent: string;
}

const AGENTS: Agent[] = [
  { id: "pepper", name: "Pepper", emoji: "🌶️", description: "Generalista", status: "online" },
  { id: "jonathan-copy", name: "Jonathan", emoji: "✍️", description: "Copywriter", status: "online" },
  { id: "paulo-dev", name: "Paulo", emoji: "💻", description: "Desenvolvimento", status: "online" },
  { id: "amanda-crm", name: "Amanda", emoji: "📊", description: "CRM & Vendas", status: "online" },
  { id: "juliana-ops", name: "Juliana", emoji: "⚙️", description: "Operações", status: "busy" },
];

const RECENT_PROJECTS: Project[] = [
  {
    id: "p1",
    name: "Campanha Black Friday",
    description: "Sequência de emails e landing page de conversão",
    updatedAt: "há 2h",
    agent: "Jonathan",
  },
  {
    id: "p2",
    name: "Integração CRM ↔ WhatsApp",
    description: "Sincronizar leads do Pipefy com a fila de atendimento",
    updatedAt: "ontem",
    agent: "Amanda",
  },
  {
    id: "p3",
    name: "Refactor do gateway",
    description: "Migrar rotas legadas para o novo runtime",
    updatedAt: "há 3 dias",
    agent: "Paulo",
  },
];

const QUICK_ACTIONS = [
  {
    title: "Nova conversa",
    description: "Fale com um agente agora",
    icon: MessageSquare,
    href: "/chat",
    accent: "from-primary/20 to-primary/5",
  },
  {
    title: "Novo projeto",
    description: "Inicie um briefing com Pepper",
    icon: Plus,
    href: "/chat",
    accent: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    title: "Meus projetos",
    description: "Veja o que está em andamento",
    icon: FolderKanban,
    href: "/dashboard",
    accent: "from-amber-500/20 to-amber-500/5",
  },
  {
    title: "Configurações",
    description: "Ajustes da conta e gateway",
    icon: Settings,
    href: "/dashboard",
    accent: "from-sky-500/20 to-sky-500/5",
  },
];

function statusDot(status: Agent["status"]) {
  if (status === "online") return "bg-green-500";
  if (status === "busy") return "bg-yellow-500";
  return "bg-gray-500";
}

function statusLabel(status: Agent["status"]) {
  if (status === "online") return "Disponível";
  if (status === "busy") return "Ocupado";
  return "Offline";
}

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const auth = localStorage.getItem("totum_agentes_auth");
    if (!auth) {
      router.push("/login");
      return;
    }
    try {
      const parsed = JSON.parse(auth);
      setEmail(parsed.email ?? "");
    } catch {
      // ignore
    }
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("totum_agentes_auth");
    router.push("/login");
  }

  const onlineCount = AGENTS.filter((a) => a.status === "online").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Agentes Totum</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">{email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Greeting */}
        <section className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta 👋</h1>
          <p className="text-sm text-muted-foreground">
            {onlineCount} de {AGENTS.length} agentes disponíveis agora.
          </p>
        </section>

        {/* Quick actions */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Ações rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br ${action.accent} p-4 hover:border-primary/40 transition-all`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-background/80 border border-border flex items-center justify-center">
                      <Icon className="w-4 h-4 text-foreground" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                  </div>
                  <div className="text-sm font-semibold">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{action.description}</div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent projects */}
          <section className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Projetos recentes
              </h2>
              <Link href="/dashboard" className="text-xs text-primary hover:underline">
                Ver todos
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
              {RECENT_PROJECTS.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{p.description}</div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-muted">{p.agent}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {p.updatedAt}
                    </span>
                  </div>
                </div>
              ))}
              {RECENT_PROJECTS.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Nenhum projeto ainda.
                </div>
              )}
            </div>
          </section>

          {/* Agent status */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Status dos agentes
              </h2>
              <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="rounded-xl border border-border bg-card divide-y divide-border">
              {AGENTS.map((a) => (
                <Link
                  key={a.id}
                  href="/chat"
                  className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="text-xl">{a.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{a.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${statusDot(a.status)}`} />
                    {statusLabel(a.status)}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
