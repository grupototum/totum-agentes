"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LogOut, Send, Loader2, User as UserIcon } from "lucide-react";
import type { AgentDef } from "@/lib/agents";
import { cn } from "@/lib/utils";
import { MessageContent } from "@/components/chat/MessageContent";

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
        body: JSON.stringify({ agent_id: agent.id, content: text, conversation_id: activeConvId }),
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
      if (data.message) setMessages((m) => [...m, data.message!]);
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
    <div className="flex h-screen bg-surface text-foreground">
      {/* Sidebar */}
      <aside
        className="flex w-72 flex-col bg-neutral"
        style={{ boxShadow: "inset -1px 0 0 hsla(0,0%,100%,0.08)" }}
      >
        {/* Header da sidebar */}
        <div
          className="flex items-center gap-3 px-5 py-4"
          style={{ boxShadow: "inset 0 -1px 0 hsla(0,0%,100%,0.08)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/totum-logo.webp" alt="totum" className="h-5 w-auto" />
          <span className="text-xs text-muted-foreground">agentes</span>
        </div>

        {/* Lista de agentes */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Time
          </div>
          {agents.map((a) => {
            const active = a.id === agent.id;
            return (
              <button
                key={a.id}
                onClick={() => setAgent(a)}
                className={cn(
                  "group w-full text-left rounded-md px-3 py-2.5 text-sm transition-colors flex items-center gap-3",
                  active ? "bg-elevated text-white" : "text-text-soft hover:bg-elevated/60"
                )}
                style={
                  active
                    ? { boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.08)" }
                    : undefined
                }
              >
                <span className="text-base leading-none">{a.emoji}</span>
                <span className="flex-1 min-w-0">
                  <div className="font-normal truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.description}</div>
                </span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Conversas */}
        <div
          className="flex-1 min-h-0 flex flex-col px-3 py-3"
          style={{ boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.08)" }}
        >
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Conversas
            </div>
            <button
              onClick={newConversation}
              className="text-xs text-primary hover:underline"
            >
              Nova
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {conversations.length === 0 && (
              <div className="text-xs text-muted-foreground px-2 py-2">Nenhuma ainda.</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-xs transition-colors truncate",
                  c.id === activeConvId ? "bg-elevated text-white" : "text-text-soft hover:bg-elevated/60"
                )}
                title={c.title ?? ""}
              >
                {c.title || "(sem título)"}
              </button>
            ))}
          </div>
        </div>

        {/* Footer / user */}
        <div
          className="px-4 py-3 flex items-center gap-3"
          style={{ boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.08)" }}
        >
          <div className="h-8 w-8 rounded-full bg-elevated flex items-center justify-center text-xs">
            {user.name?.slice(0, 1).toUpperCase() ?? "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white truncate">{user.name}</div>
            <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
          </div>
          <a
            href="/api/auth/logout"
            className="text-muted-foreground hover:text-white transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </a>
        </div>
      </aside>

      {/* Main chat */}
      <main className="flex flex-1 flex-col min-w-0 bg-surface">
        {/* Header */}
        <header
          className="flex items-center gap-3 px-8 py-5"
          style={{ boxShadow: "inset 0 -1px 0 hsla(0,0%,100%,0.08)" }}
        >
          <span className="text-2xl">{agent.emoji}</span>
          <div>
            <div className="text-base font-normal text-white">{agent.name}</div>
            <div className="text-xs text-muted-foreground">{agent.description}</div>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          {orderedMessages.length === 0 && (
            <div className="mx-auto max-w-md text-center mt-16">
              <div className="text-2xl mb-3">{agent.emoji}</div>
              <h2 className="text-subheading text-white mb-2">
                Conversa com {agent.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                Mande sua primeira mensagem. A resposta pode levar até 45s
                (Cascata Circular).
              </p>
            </div>
          )}

          {orderedMessages.map((m) => {
            const isUser = m.role === "user";
            const isSystem = m.role === "system";
            return (
              <div
                key={m.id}
                className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
              >
                {!isUser && (
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-sm shrink-0",
                      isSystem ? "bg-destructive/15" : "bg-elevated"
                    )}
                  >
                    {isSystem ? "⚠️" : agent.emoji}
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[75%] px-4 py-3 text-sm leading-relaxed",
                    isUser
                      ? "rounded-2xl text-white"
                      : isSystem
                        ? "rounded-2xl text-destructive"
                        : "rounded-2xl text-text-soft bg-neutral"
                  )}
                  style={
                    isUser
                      ? {
                          background:
                            "linear-gradient(135deg, var(--brand-red-bright) 0%, var(--brand-red-vibrant) 100%)",
                          boxShadow:
                            "inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 2px rgba(8,8,8,0.2)",
                        }
                      : isSystem
                        ? {
                            background: "rgba(217,22,22,0.08)",
                            boxShadow: "inset 0 0 0 1px rgba(217,22,22,0.25)",
                          }
                        : {
                            boxShadow:
                              "inset 0 0 0 1px hsla(0,0%,100%,0.08), inset 0 1px 0 hsla(0,0%,100%,0.05)",
                          }
                  }
                >
                  <MessageContent
                    content={m.content}
                    variant={isUser ? "user" : isSystem ? "system" : "assistant"}
                  />
                </div>
                {isUser && (
                  <div className="h-8 w-8 rounded-full bg-elevated flex items-center justify-center shrink-0">
                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}

          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-elevated flex items-center justify-center text-sm">
                {agent.emoji}
              </div>
              <div
                className="rounded-2xl bg-neutral px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground"
                style={{ boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.08)" }}
              >
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>pensando…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="px-8 py-5"
          style={{ boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.08)" }}
        >
          <div
            className="flex items-end gap-2 bg-elevated rounded-2xl px-4 py-3"
            style={{ boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.06)" }}
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
              placeholder={`Mensagem para ${agent.name}…`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-muted-foreground focus:outline-none max-h-40 leading-relaxed py-1"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-full h-9 w-9 flex items-center justify-center disabled:opacity-40 transition-shadow"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-red-bright) 0%, var(--brand-red-vibrant) 100%)",
                color: "white",
                boxShadow:
                  "inset 0 1px 1px rgba(255,255,255,0.2), 0 1px 2px rgba(8,8,8,0.2)",
              }}
              aria-label="Enviar"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </button>
          </div>
          <div className="mt-2 px-1 text-[10px] text-muted-foreground">
            Enter envia · Shift+Enter quebra linha
          </div>
        </form>
      </main>
    </div>
  );
}
