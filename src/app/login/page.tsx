"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Brain, ArrowRight, Mail } from "lucide-react";

const ALLOWLIST = [
  "israellemos@grupototum.com",
  "israellemos@gmail.com",
  "totumpersonalizados@gmail.com",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const normalized = email.trim().toLowerCase();

    if (!ALLOWLIST.includes(normalized)) {
      toast.error("Email não autorizado. Entre em contato com o administrador.");
      setLoading(false);
      return;
    }

    localStorage.setItem("totum_agentes_auth", JSON.stringify({ email: normalized, ts: Date.now() }));
    toast.success("Autenticado com sucesso!");
    router.push("/chat");
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-2">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Agentes Totum</h1>
          <p className="text-sm text-muted-foreground">
            Acesse seu time de agentes IA
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Versão MVP — acesso por allowlist
        </p>
      </div>
    </div>
  );
}
