import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, BookOpen, Bot, User as UserIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatMessage } from "@/lib/types";

export const Route = createFileRoute("/ai-chat")({
  head: () => ({
    meta: [
      { title: "Chat IA — InstaBot" },
      { name: "description", content: "Chat com IA especialista em marketing, com RAG completo sobre suas contas, posts e campanhas." },
    ],
  }),
  component: AIChatPage,
});

const chips = [
  { icon: "📱", label: "Contas", prompt: "Quantas contas eu tenho conectadas?" },
  { icon: "🎯", label: "Campanhas", prompt: "Me mostra minhas campanhas Meta Ads" },
  { icon: "💰", label: "Gasto 7d", prompt: "Qual foi meu gasto nos últimos 7 dias?" },
  { icon: "📅", label: "Posts", prompt: "Quais posts estão agendados?" },
  { icon: "⭐", label: "Melhor CTR", prompt: "Qual conta tem o melhor CTR?" },
  { icon: "🚀", label: "Melhorias", prompt: "Que melhorias você recomenda?" },
];

function AIChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: "👋 Olá! Sou seu assistente de marketing. Tenho acesso a **todas** as suas contas, posts e campanhas + 14 skills de marketing carregadas. Como posso ajudar?", ts: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const { data: skills } = useQuery({ queryKey: ["skills"], queryFn: () => api.listSkills() });
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMut = useMutation({
    mutationFn: (msg: string) => api.aiChat(msg),
    onSuccess: (res) => {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "assistant", content: res.answer, ts: new Date().toISOString() }]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatMut.isPending]);

  const send = (text: string) => {
    if (!text.trim() || chatMut.isPending) return;
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content: text, ts: new Date().toISOString() }]);
    setInput("");
    chatMut.mutate(text);
  };

  return (
    <div>
      <PageHeader eyebrow="IA" title="💬 Chat IA" subtitle="Especialista em marketing com contexto completo do seu bot" />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_300px]">
        <Card className="flex h-[calc(100vh-14rem)] flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-ig text-white"}`}>
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60"}`}>
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-strong:text-current">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                    <div className="mt-1 text-[10px] opacity-60">{new Date(m.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              ))}
              {chatMut.isPending && (
                <div className="flex gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-ig text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-muted/60 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "120ms" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "240ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t p-4">
            <div className="mx-auto max-w-3xl space-y-3">
              <div className="flex flex-wrap gap-2">
                {chips.map((c) => (
                  <Button key={c.label} variant="outline" size="sm" onClick={() => send(c.prompt)} disabled={chatMut.isPending}>
                    <span className="mr-1">{c.icon}</span> {c.label}
                  </Button>
                ))}
              </div>
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte sobre suas contas, campanhas, marketing…" disabled={chatMut.isPending} autoFocus />
                <Button type="submit" disabled={!input.trim() || chatMut.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Contexto ativo</h3>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>📱 Todas as contas Instagram</li>
              <li>🎯 Todas as campanhas Meta Ads</li>
              <li>📅 Posts agendados + histórico</li>
              <li>💰 Métricas de gasto/performance</li>
              <li>🤖 Histórico da própria IA</li>
            </ul>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Skills carregadas</h3>
              <Badge className="ml-auto">{skills?.length ?? 14}</Badge>
            </div>
            <ScrollArea className="h-64 pr-2">
              <ul className="space-y-2">
                {(skills ?? []).map((s) => (
                  <li key={s.slug} className="rounded-md border bg-card/50 p-2">
                    <div className="text-xs font-semibold">{s.title}</div>
                    <div className="text-[11px] text-muted-foreground">{s.description}</div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
