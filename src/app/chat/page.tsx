import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AGENTS } from "@/lib/agents";
import ChatClient from "./ChatClient";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <ChatClient
      agents={AGENTS}
      user={{ name: session.name ?? session.email ?? "Usuário", email: session.email ?? null }}
    />
  );
}
