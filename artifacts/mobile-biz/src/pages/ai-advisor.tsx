import { Layout } from "@/components/layout";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useListAnthropicConversations,
  useCreateAnthropicConversation,
  useGetAnthropicConversation,
  useDeleteAnthropicConversation,
  getListAnthropicConversationsQueryKey,
  getGetAnthropicConversationQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import {
  BrainCircuit, Send, Plus, Trash2, MessageSquare, Sparkles, TrendingUp,
  Package, Users, DollarSign, AlertTriangle, ChevronRight, Loader2,
} from "lucide-react";

// ─── Custom fetch base URL ────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// ─── Simple markdown styles ───────────────────────────────────────────────────
const mdComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-white font-bold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-primary/90 italic">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-white/80">{children}</li>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-lg font-black text-white mt-3 mb-1">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-base font-bold text-white mt-3 mb-1">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-bold text-primary mt-2 mb-1">{children}</h3>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="font-mono text-xs bg-black/40 text-emerald-300 px-1.5 py-0.5 rounded">{children}</code>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-white/60 italic">{children}</blockquote>
  ),
};

// ─── Suggested prompts ────────────────────────────────────────────────────────
const SUGGESTED = [
  { icon: TrendingUp,    label: "How is my business performing this month?" },
  { icon: Package,       label: "Which products should I restock urgently?" },
  { icon: DollarSign,    label: "What is my net profit after expenses?" },
  { icon: Users,         label: "Who are my best customers?" },
  { icon: TrendingUp,    label: "How can I increase my sales this week?" },
  { icon: AlertTriangle, label: "What risks should I be aware of right now?" },
];

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ role, content }: { role: string; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black",
        isUser
          ? "bg-primary/20 border border-primary/40 text-primary"
          : "bg-gradient-to-br from-violet-600 to-cyan-600 text-white shadow-[0_0_20px_-5px_hsl(265,80%,60%)]"
      )}>
        {isUser ? "You" : "M"}
      </div>

      {/* Bubble */}
      <div className={cn(
        "max-w-[75%] px-4 py-3 rounded-2xl text-sm",
        isUser
          ? "bg-primary/15 border border-primary/20 text-white/90 rounded-tr-sm"
          : "bg-white/[0.04] border border-white/[0.07] text-white/80 rounded-tl-sm"
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <ReactMarkdown components={mdComponents}>{content}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

// ─── Streaming message bubble ─────────────────────────────────────────────────
function StreamingBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-xs font-black bg-gradient-to-br from-violet-600 to-cyan-600 text-white shadow-[0_0_20px_-5px_hsl(265,80%,60%)]">
        M
      </div>
      <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tl-sm text-sm bg-white/[0.04] border border-white/[0.07] text-white/80">
        {text ? (
          <ReactMarkdown components={mdComponents}>{text}</ReactMarkdown>
        ) : (
          <div className="flex items-center gap-1.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce [animation-delay:300ms]" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AIAdvisor() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sseBufferRef = useRef("");

  // Abort on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const { data: conversations, isLoading: convsLoading } = useListAnthropicConversations();
  const { data: conversation, refetch: refetchConv } = useGetAnthropicConversation(
    activeConvId ?? 0,
    {
      query: {
        enabled: activeConvId !== null,
        queryKey: getGetAnthropicConversationQueryKey(activeConvId ?? 0),
      },
    }
  );
  const createConv = useCreateAnthropicConversation();
  const deleteConv = useDeleteAnthropicConversation();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, streamingText]);

  const messages = conversation?.messages ?? [];

  // ─── Start new conversation ───────────────────────────────────────────────
  const startNew = useCallback(async (firstMessage?: string) => {
    const title = firstMessage
      ? firstMessage.slice(0, 60) + (firstMessage.length > 60 ? "…" : "")
      : "New Chat";

    createConv.mutate({ data: { title } }, {
      onSuccess: async (conv) => {
        setActiveConvId(conv.id);
        qc.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
        if (firstMessage) {
          // Small delay to let state settle
          setTimeout(() => sendMessage(conv.id, firstMessage), 100);
        }
      },
    });
  }, [createConv, qc]);

  // ─── Send message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (convId: number, text: string) => {
    if (!text.trim() || isSending) return;
    setInput("");
    setIsSending(true);
    setStreamingText("");

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${BASE}/api/anthropic/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      sseBufferRef.current = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Append to persistent buffer so SSE frames split across chunks are reassembled
        sseBufferRef.current += decoder.decode(value, { stream: true });

        // Process all complete lines in buffer
        const lines = sseBufferRef.current.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        sseBufferRef.current = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.content) {
              accumulated += data.content;
              setStreamingText(accumulated);
            }
            if (data.done) {
              setStreamingText(null);
              await refetchConv();
            }
            if (data.error) {
              toast({ title: "AI error", description: data.error, variant: "destructive" });
            }
          } catch { /* ignore non-JSON lines */ }
        }
      }
      sseBufferRef.current = "";
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        toast({ title: "Connection error", description: "Could not reach AI. Try again.", variant: "destructive" });
      }
      setStreamingText(null);
    } finally {
      setIsSending(false);
      qc.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
      inputRef.current?.focus();
    }
  }, [isSending, refetchConv, toast, qc]);

  // ─── Handle submit ────────────────────────────────────────────────────────
  const handleSubmit = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    if (activeConvId) {
      sendMessage(activeConvId, msg);
    } else {
      startNew(msg);
    }
  };

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConv.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListAnthropicConversationsQueryKey() });
        if (activeConvId === id) {
          setActiveConvId(null);
          setStreamingText(null);
        }
      },
    });
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-140px)] gap-0 rounded-2xl overflow-hidden border border-white/[0.06] bg-[#060d1a]/80 backdrop-blur-xl">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="w-64 flex-shrink-0 border-r border-white/[0.05] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shadow-[0_0_20px_-3px_hsl(265,80%,60%)]">
                <BrainCircuit className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-white">Mia</p>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">AI Business Advisor</p>
              </div>
            </div>
            <Button
              onClick={() => { setActiveConvId(null); setStreamingText(null); setInput(""); }}
              size="sm"
              className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-bold text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> New Chat
            </Button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto py-2 px-2">
            {convsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            ) : !conversations?.length ? (
              <p className="text-[11px] text-muted-foreground text-center px-3 py-6">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl mb-1 group transition-all flex items-start gap-2",
                    activeConvId === conv.id
                      ? "bg-primary/10 border border-primary/20 text-white"
                      : "text-muted-foreground hover:bg-white/[0.03] hover:text-white border border-transparent"
                  )}
                >
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-60" />
                  <span className="text-xs flex-1 truncate leading-snug font-medium">{conv.title}</span>
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Chat area ───────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">

          {activeConvId === null ? (
            /* Welcome screen */
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center mx-auto mb-5 shadow-[0_0_60px_-10px_hsl(265,80%,60%)]">
                  <BrainCircuit className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">Meet Mia</h2>
                <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
                  Your dedicated AI Business Advisor. She reads your live business data — sales, inventory, expenses, customers — and gives you real answers, strategies, and recommendations.
                </p>
              </div>

              <div className="w-full max-w-2xl">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> Ask Mia anything
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTED.map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.label}
                        onClick={() => handleSubmit(s.label)}
                        disabled={isSending}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-primary/30 transition-all text-left group"
                      >
                        <Icon className="w-4 h-4 text-primary flex-shrink-0 opacity-70 group-hover:opacity-100" />
                        <span className="text-xs text-white/70 group-hover:text-white leading-snug">{s.label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Messages */
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
              ))}
              {streamingText !== null && (
                <StreamingBubble text={streamingText} />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-white/[0.05] p-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={isSending ? "Mia is thinking…" : "Ask Mia anything about your business…"}
                  disabled={isSending}
                  className="bg-white/[0.03] border-white/[0.08] focus:border-primary/40 text-sm h-11 pr-4 rounded-xl placeholder:text-muted-foreground/50"
                />
              </div>
              <Button
                onClick={() => handleSubmit()}
                disabled={!input.trim() || isSending}
                className="h-11 w-11 p-0 flex-shrink-0 bg-gradient-to-br from-violet-600 to-cyan-600 hover:opacity-90 rounded-xl shadow-[0_0_20px_-5px_hsl(265,80%,60%)] disabled:opacity-30"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-white" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-2 text-center">
              Mia reads your live business data · Powered by Claude · Responses may not be 100% accurate
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
