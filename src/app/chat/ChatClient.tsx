"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { LogOut, Send, Loader2, User as UserIcon, Trash2, MessagesSquare } from "lucide-react";
import type { AgentDef } from "@/lib/agents";
import { cn } from "@/lib/utils";
import { streamSSE } from "@/lib/sse-client";
import { relativeTime } from "@/lib/format";
import { MessageContent } from "@/components/chat/MessageContent";
import { AttachmentInput } from "@/components/chat/AttachmentInput";
import { AttachmentPreview } from "@/components/chat/AttachmentPreview";
import { AttachmentRender } from "@/components/chat/AttachmentRender";
import type { AttachmentMeta } from "@/components/chat/attachment-types";
import { useUploader } from "@/lib/use-uploader";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  agent_id?: string | null;
  attachments?: AttachmentMeta[];
}

interface Conversation {
  id: string;
  agent_id: string;
  title: string | null;
  updated_at: string;
  created_at?: string;
  message_count?: number;
}

type ConvScope = "agent" | "all";

interface Props {
  agents: AgentDef[];
  user: { name: string; email: string | null };
  initialAgentId?: string;
}

export default function ChatClient({ agents, user, initialAgentId }: Props) {
  const initial =
    (initialAgentId && agents.find((a) => a.id === initialAgentId)) || agents[0];
  const [agent, setAgent] = useState<AgentDef>(initial);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingText, setStreamingText] = useState<string>("");
  const [pulseTick, setPulseTick] = useState<number>(0);
  const [convScope, setConvScope] = useState<ConvScope>("agent");
  const [dragActive, setDragActive] = useState(false);
  const dragCounter = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const uploader = useUploader({ conversationId: activeConvId });

  const loadConversations = useCallback(
    async (agentId: string, scope: ConvScope = "agent") => {
      const params = scope === "all" ? "?scope=all" : `?agent_id=${agentId}`;
      const r = await fetch(`/api/conversations${params}`, { cache: "no-store" });
      if (!r.ok) return;
      const data = (await r.json()) as { conversations: Conversation[] };
      setConversations(data.conversations);
    },
    []
  );

  const loadMessages = useCallback(async (convId: string) => {
    const r = await fetch(`/api/conversations/${convId}/messages`, { cache: "no-store" });
    if (!r.ok) return;
    const data = (await r.json()) as { messages: Message[] };
    setMessages(data.messages);
  }, []);

  useEffect(() => {
    void loadConversations(agent.id, convScope);
    setActiveConvId(null);
    setMessages([]);
  }, [agent.id, convScope, loadConversations]);

  useEffect(() => {
    if (activeConvId) void loadMessages(activeConvId);
  }, [activeConvId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (uploader.anyUploading) {
      toast.error("Aguarde os anexos terminarem o upload");
      return;
    }
    setSending(true);
    setInput("");
    setStreamingText("");
    setPulseTick(0);
    const attachmentIds = uploader.readyIds;
    // snapshot dos pending pra reuse no optimistic bubble
    const optimisticAtts: AttachmentMeta[] = uploader.pending
      .filter((p) => p.status === "done" && p.serverId && p.url)
      .map((p) => ({
        id: p.serverId!,
        name: p.file.name,
        size: p.file.size,
        type: p.file.type,
        kind: p.kind ?? (p.file.type.startsWith("image/") ? "image" : "markdown"),
        url: p.url!,
      }));
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
      agent_id: agent.id,
      attachments: optimisticAtts.length > 0 ? optimisticAtts : undefined,
    };
    setMessages((m) => [...m, optimistic]);
    uploader.reset();

    let acc = "";
    let streamedConvId: string | null = activeConvId;
    let streamedMessageId: string | null = null;
    let streamedCreatedAt = new Date().toISOString();

    try {
      await streamSSE(
        "/api/messages/stream",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_id: agent.id,
            content: text,
            conversation_id: activeConvId,
            attachment_ids: attachmentIds,
          }),
        },
        (ev) => {
          const data = ev.data as Record<string, unknown>;
          switch (ev.event) {
            case "meta": {
              const cid = data.conversation_id as string | undefined;
              if (cid && cid !== activeConvId) {
                streamedConvId = cid;
                setActiveConvId(cid);
              }
              break;
            }
            case "pulse": {
              setPulseTick(Number(data.tick) || 0);
              break;
            }
            case "start": {
              streamedMessageId = (data.message_id as string) ?? null;
              break;
            }
            case "chunk": {
              const t = String(data.text ?? "");
              acc += t;
              setStreamingText(acc);
              break;
            }
            case "done": {
              streamedMessageId = (data.message_id as string) ?? streamedMessageId;
              streamedCreatedAt = (data.created_at as string) ?? streamedCreatedAt;
              break;
            }
            case "error": {
              const detail = String(data.detail ?? "gateway_error");
              toast.error(detail);
              break;
            }
          }
        }
      );

      if (streamedMessageId && acc) {
        const finalMsg: Message = {
          id: streamedMessageId,
          role: "assistant",
          content: acc,
          created_at: streamedCreatedAt,
          agent_id: agent.id,
        };
        setMessages((m) => [...m, finalMsg]);
        if (streamedConvId) void loadConversations(agent.id, convScope);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "erro";
      toast.error(msg);
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setStreamingText("");
      setPulseTick(0);
      setSending(false);
    }
  }, [input, sending, agent.id, activeConvId, loadConversations, convScope, uploader]);

  // Drag-drop handlers no <main> do chat
  const onDragEnter = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer?.types?.includes("Files")) return;
    e.preventDefault();
    dragCounter.current += 1;
    setDragActive(true);
  }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragActive(false);
    }
  }, []);
  const onDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
  }, []);
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragActive(false);
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) uploader.addFiles(files);
    },
    [uploader]
  );

  const newConversation = useCallback(() => {
    setActiveConvId(null);
    setMessages([]);
  }, []);

  const deleteConversation = useCallback(
    async (convId: string) => {
      if (!confirm("Excluir essa conversa? Esta ação não pode ser desfeita.")) return;
      const r = await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
      if (!r.ok) {
        toast.error("Falha ao excluir");
        return;
      }
      toast.success("Conversa excluída");
      if (convId === activeConvId) {
        setActiveConvId(null);
        setMessages([]);
      }
      void loadConversations(agent.id, convScope);
    },
    [activeConvId, agent.id, convScope, loadConversations]
  );

  const selectConversation = useCallback(
    (c: Conversation) => {
      setActiveConvId(c.id);
      // Se a conv pertence a outro agente, troca seleção
      if (c.agent_id !== agent.id) {
        const target = agents.find((a) => a.id === c.agent_id);
        if (target) setAgent(target);
      }
    },
    [agent.id, agents]
  );

  const agentEmojiById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of agents) map[a.id] = a.emoji;
    return map;
  }, [agents]);

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
              + Nova
            </button>
          </div>

          {/* Toggle scope */}
          <div
            className="flex items-center mb-2 mx-1 rounded-full p-0.5 text-[11px]"
            style={{ background: "var(--elevated)" }}
          >
            <button
              onClick={() => setConvScope("agent")}
              className={cn(
                "flex-1 px-3 py-1 rounded-full transition-colors",
                convScope === "agent" ? "bg-hover-surface text-white" : "text-muted-foreground"
              )}
            >
              {agent.name}
            </button>
            <button
              onClick={() => setConvScope("all")}
              className={cn(
                "flex-1 px-3 py-1 rounded-full transition-colors",
                convScope === "all" ? "bg-hover-surface text-white" : "text-muted-foreground"
              )}
            >
              Todas
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
            {conversations.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center text-xs text-muted-foreground py-8 gap-2">
                <MessagesSquare className="h-5 w-5 opacity-50" />
                <div>Nenhuma conversa ainda.</div>
                <div className="text-[10px]">Mande sua primeira mensagem.</div>
              </div>
            )}
            {conversations.map((c) => {
              const active = c.id === activeConvId;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "group relative w-full rounded-md transition-colors",
                    active ? "bg-elevated" : "hover:bg-elevated/60"
                  )}
                  style={
                    active
                      ? { boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.08)" }
                      : undefined
                  }
                >
                  <button
                    onClick={() => selectConversation(c)}
                    className="w-full text-left px-2 py-2 flex items-start gap-2"
                    title={c.title ?? ""}
                  >
                    <span className="text-sm leading-none mt-0.5 shrink-0">
                      {agentEmojiById[c.agent_id] ?? "·"}
                    </span>
                    <span className="flex-1 min-w-0">
                      <div
                        className={cn(
                          "text-xs truncate pr-6",
                          active ? "text-white" : "text-text-soft"
                        )}
                      >
                        {c.title || "(sem título)"}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <span>{relativeTime(c.updated_at)}</span>
                        {typeof c.message_count === "number" && (
                          <>
                            <span className="opacity-40">·</span>
                            <span>{c.message_count} msg</span>
                          </>
                        )}
                      </div>
                    </span>
                  </button>
                  <button
                    onClick={() => deleteConversation(c.id)}
                    className={cn(
                      "absolute top-1.5 right-1.5 p-1 rounded transition-opacity",
                      "opacity-0 group-hover:opacity-70 hover:opacity-100",
                      "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    )}
                    title="Excluir conversa"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
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
      <main
        className="relative flex flex-1 flex-col min-w-0 bg-surface"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Drag-drop overlay */}
        {dragActive && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{
              background: "rgba(218,33,40,0.06)",
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              className="px-6 py-4 rounded-2xl text-sm text-white font-normal"
              style={{
                background: "var(--neutral)",
                boxShadow: "inset 0 0 0 2px var(--primary), 0 0 40px -8px var(--primary)",
                border: "2px dashed var(--primary)",
              }}
            >
              Solte pra anexar (até 5 arquivos, 10MB cada)
            </div>
          </div>
        )}

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
                  {m.attachments && m.attachments.length > 0 && (
                    <AttachmentRender attachments={m.attachments} />
                  )}
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
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[75%]",
                  streamingText
                    ? "bg-neutral text-text-soft"
                    : "bg-neutral text-muted-foreground flex items-center gap-2"
                )}
                style={{ boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.08)" }}
              >
                {streamingText ? (
                  <span className="whitespace-pre-wrap">
                    {streamingText}
                    <span className="inline-block w-1.5 h-3.5 align-middle ml-0.5 bg-primary rounded-sm animate-pulse" />
                  </span>
                ) : (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>
                      {agent.name} está pensando{".".repeat(((pulseTick - 1) % 3) + 1)}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input + Anexos */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="px-8 py-5"
          style={{ boxShadow: "inset 0 1px 0 hsla(0,0%,100%,0.08)" }}
        >
          <AttachmentPreview pending={uploader.pending} onRemove={uploader.removePending} />
          <div
            className="flex items-end gap-2 bg-elevated rounded-2xl px-3 py-2"
            style={{ boxShadow: "inset 0 0 0 1px hsla(0,0%,100%,0.06)" }}
          >
            <AttachmentInput onAdd={uploader.addFiles} disabled={sending} />
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
              className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-muted-foreground focus:outline-none max-h-40 leading-relaxed py-2"
            />
            <button
              type="submit"
              disabled={sending || !input.trim() || uploader.anyUploading}
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
