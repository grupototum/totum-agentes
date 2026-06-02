import Link from "next/link";
import { redirect } from "next/navigation";
import { Brain, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ err?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (session) redirect("/chat");
  const { err } = await searchParams;

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

        {err && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-center">
            Falha no login: {err}
          </div>
        )}

        <Link
          href="/api/auth/login"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Entrar com Keycloak
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="text-xs text-center text-muted-foreground">
          Auth via realm Totum (SSO)
        </p>
      </div>
    </div>
  );
}
