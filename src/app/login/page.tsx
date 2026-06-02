import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthSplitScreen } from "@/components/ui/auth-split-screen";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ err?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (session) redirect("/chat");
  const { err } = await searchParams;

  return (
    <AuthSplitScreen
      logo={
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground text-base font-bold">
            T
          </span>
          <span className="text-xl font-semibold tracking-tight">totum agentes</span>
        </div>
      }
      title="Bem-vindo de volta."
      description="Acesse seu time de agentes IA com sua conta Totum."
      imageSrc="/totum-robot.png"
      imageAlt="Robô Totum segurando uma garrafa com a legenda Hydrated. Upgraded."
      loginHref="/api/auth/login"
      error={err}
      footnote={
        <>
          Problemas pra entrar? Fale com <span className="text-foreground">@israel</span>.
        </>
      }
    />
  );
}
