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
      title="Bem-vindo de volta."
      description="Acesse seu time de agentes IA com sua conta Totum."
      imageSrc="/totum-robot.webp"
      imageAlt="Robô Totum — Hydrated. Upgraded."
      loginHref="/api/auth/login"
      error={err}
      footnote={
        <>
          Problemas pra entrar? Fale com <strong className="text-white">@israel</strong>.
        </>
      }
    />
  );
}
