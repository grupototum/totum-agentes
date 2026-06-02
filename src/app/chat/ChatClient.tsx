"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LogOut, Send, Loader2, Bot, User as UserIcon } from "lucide-react";
import type { AgentDef } from "@/lib/agents";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  agent_id?: string | null;
}

interface Conversation {
  id: string;
  agent_id: string;
  title: string | null;
  updated_at: string;
}

interface Props {
  agents: AgentDef[];
  user: { name: string; email: string | null };
}

export default function ChatClient({ agents, user }: Props) {
  const [agent, setAgent] = useState<AgentDef>(agents[0]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async (agentId: string) => {
    const r = await fetch(`/api/conversations?agent_id=${agentId}`, { cache: "no-store" });
    if (!r.ok) return;
    const data = (await r.json()) as { conversations: Conversation[] };
    setConversations(data.conversations);
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    const r = await fetch(`/api/conversations/${convId}/messages`, { cache: "no-store" });
    if (!r.ok) return;
    const data = (await r.json()) as { messages: Message[] };
    setMessages(data.messages);
  }, []);

  useEffect(() => {
    void loadConversations(agent.id);
    setActiveConvId(null);
    setMessages([]);
  }, [agent.id, loadConversations]);

  useEffect(() => {
    if (activeConvId) void loadMessages(activeConvId);
  }, [activeConvId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
      agent_id: agent.id,
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const r = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agent.id,
          content: text,
          conversation_id: activeConvId,
        }),
      });
      const data = (await r.json()) as {
        conversation_id?: string;
        message?: Message;
        error?: string;
        detail?: string;
      };
      if (!r.ok) {
        toast.error(data.detail || data.error || "Falha ao enviar");
        setMessages((m) => m.filter((x) => x.id !== optimistic.id));
        return;
      }
      if (data.conversation_id && data.conversation_id !== activeConvId) {
        setActiveConvId(data.conversation_id);
        void loadConversations(agent.id);
      }
      if (data.message) {
        setMessages((m) => [...m, data.message!]);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "erro";
      toast.error(msg);
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }, [input, sending, agent.id, activeConvId, loadConversations]);

  const newConversation = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
  }, []);

  const orderedMessages = useMemo(() => messages, [messages]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-72 border-r border-border flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <div className="text-sm font-semibold">Agentes Totum</div>
          <div className="text-xs text-muted-foreground truncate" title={user.email ?? ""}>
            {user.name}
          </div>
        </div>
        <div className="px-3 py-3 space-y-1">
          {agents.map((a) => (
            <button
              key={a.id}
              onClick={() => setAgent(a)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-muted transition-colors",
                a.id === agent.id && "bg-muted"
              )}
            >
              <span className="text-lg leading-none">{a.emoji}</span>
              <span className="flex-1">
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground truncate">{a.description}</div>
              </span>
            </button>
          ))}
        </div>
        <div className="border-t border-border px-3 py-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Conversas
            </div>
            <button
              onClick={newConversation}
              className="text-xs text-primary hover:underline"
            >
              Nova
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-1">
            {conversations.length === 0 && (
              <div className="text-xs text-muted-foreground py-2">Nenhuma ainda.</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors truncate",
                  c.id === activeConvId && "bg-muted"
                )}
                title={c.title ?? ""}
              >
                {c.title || "(sem título)"}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-border px-3 py-3">
          <a
            href="/api/auth/logout"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </a>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border px-6 py-3 flex items-center gap-3">
          <span className="text-xl">{agent.emoji}</span>
          <div>
            <div className="text-sm font-semibold">{agent.name}</div>
            <div className="text-xs text-muted-foreground">{agent.description}</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {orderedMessages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground mt-12">
              Comece uma conversa com {agent.name}.
            </div>
          )}
          {orderedMessages.map((m) => (
            <div
              key={m.id}
              className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role !== "user" && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm">
                  {m.role === "system" ? "⚠️" : agent.emoji}
                </div>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : m.role === "system"
                      ? "bg-destructive/10 border border-destructive/30 text-destructive"
                      : "bg-card border border-border"
                )}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm">
                {agent.emoji}
              </div>
              <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> pensando...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="border-t border-border px-6 py-3 flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={`Mensagem para ${agent.name}...`}
            rows={1}
            className="flex-1 resize-none rounded-lg bg-card border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-40"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="rounded-lg bg-primary text-primary-foreground px-3 py-2 disabled:opacity-40 flex items-center gap-1 text-sm"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </main>
    </div>
  );
}
