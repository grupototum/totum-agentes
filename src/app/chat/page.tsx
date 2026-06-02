"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, LogOut, Bot, User, Loader2 } from "lucide-react";
import { getMessages, saveMessage, clearMessages, type MessageRow } from "@/lib/db";
import { sendMessage, type Agent } from "@/lib/openclaw";

const HARDCODED_AGENTS: Agent[] = [
  { id: "pepper", name: "Pepper", emoji: "🌶️", description: "Agente generalista e coordenadora", status: "online" },
  { id: "jonathan-copy", name: "Jonathan", emoji: "✍️", description: "Copywriter e conteúdo", status: "online" },
  { id: "paulo-dev", name: "Paulo", emoji: "💻", description: "Desenvolvimento e código", status: "online" },
  { id: "amanda-crm", name: "Amanda", emoji: "📊", description: "CRM e vendas", status: "online" },
  { id: "juliana-ops", name: "Juliana", emoji: "⚙️", description: "Operações e infra", status: "busy" },
];

export default function ChatPage() {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<Agent>(HARDCODED_AGENTS[0]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auth guard
  useEffect(() => {
    const auth = localStorage.getItem("totum_agentes_auth");
    if (!auth) router.push("/login");
  }, [router]);

  // Load messages when agent changes
  useEffect(() => {
    getMessages(selectedAgent.id).then(setMessages).catch(console.error);
  }, [selectedAgent]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const content = input.trim();
    setInput("");
    setLoading(true);

    // Save user message
    const userMsg: MessageRow = {
      id: `${Date.now()}-u`,
      agentId: selectedAgent.id,
      role: "user",
      content,
      timestamp: Date.now(),
    };
    await saveMessage(userMsg);
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await sendMessage(selectedAgent.id, { content });

      const agentMsg: MessageRow = {
        id: `${Date.now()}-a`,
        agentId: selectedAgent.id,
        role: "agent",
        content: res.message,
        timestamp: Date.now(),
      };
      await saveMessage(agentMsg);
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar mensagem");
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!confirm("Limpar histórico deste agente?")) return;
    await clearMessages(selectedAgent.id);
    setMessages([]);
    toast.success("Histórico limpo");
  }

  function handleLogout() {
    localStorage.removeItem("totum_agentes_auth");
    router.push("/login");
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm">Agentes</h2>
          <p className="text-xs text-muted-foreground">Selecione para conversar</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {HARDCODED_AGENTS.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedAgent.id === agent.id
                  ? "bg-primary/10 border border-primary/20"
                  : "hover:bg-muted"
              }`}
            >
              <span className="text-xl">{agent.emoji}</span>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{agent.name}</div>
                <div className="text-xs text-muted-foreground truncate">{agent.description}</div>
              </div>
              <span
                className={`ml-auto w-2 h-2 rounded-full flex-shrink-0 ${
                  agent.status === "online"
                    ? "bg-green-500"
                    : agent.status === "busy"
                    ? "bg-yellow-500"
                    : "bg-gray-500"
                }`}
              />
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={handleClear}
            className="w-full text-xs py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
          >
            Limpar histórico
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sair
          </button>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card/50">
          <span className="text-xl">{selectedAgent.emoji}</span>
          <div>
            <h1 className="text-sm font-semibold">{selectedAgent.name}</h1>
            <p className="text-xs text-muted-foreground">{selectedAgent.description}</p>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bot className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Inicie uma conversa com {selectedAgent.name}</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "agent" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                  {selectedAgent.emoji}
                </div>
              )}
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                {selectedAgent.emoji}
              </div>
              <div className="bg-card border border-border px-4 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Digitando...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-border bg-card/50"
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Mensagem para ${selectedAgent.name}...`}
              className="flex-1 px-4 py-2.5 rounded-lg bg-card border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
