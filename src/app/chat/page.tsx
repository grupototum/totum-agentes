import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AGENTS, findAgent } from "@/lib/agents";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ agent?: string }>;
}

export default async function ChatPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { agent: preselectId } = await searchParams;
  const preselected = preselectId ? findAgent(preselectId) : undefined;

  return (
    <ChatClient
      agents={AGENTS}
      initialAgentId={preselected?.id ?? AGENTS[0].id}
      user={{ name: session.name ?? session.email ?? "Usuário", email: session.email ?? null }}
    />
  );
}
