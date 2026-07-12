import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Bot, User as UserIcon, Wrench, CheckCircle2, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { agentChat, type ToolTrace } from "@/lib/agent-chat.functions";

export const Route = createFileRoute("/ai-chat")({
  head: () => ({
    meta: [
      { title: "Chat IA — InstaBot" },
      { name: "description", content: "Agente Claude Opus 4.8 com ferramentas reais: Instagram, Freepik e Meta Ads." },
    ],
  }),
  component: AIChatPage,
});

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  trace?: ToolTrace[];
  ts: string;
};

const chips = [
  { icon: "📱", label: "Contas", prompt: "Lista minhas contas do Instagram conectadas" },
  { icon: "📅", label: "Últimos posts", prompt: "Me mostra os 5 últimos posts publicados com likes e comentários" },
  { icon: "🎨", label: "Gerar imagem", prompt: "Gera uma imagem quadrada fotorrealista de um café da manhã fitness bem apetitoso" },
  { icon: "✍️", label: "Legenda", prompt: "Gera uma legenda de engajamento sobre motivação de segunda-feira" },
  { icon: "🔍", label: "Analisar", prompt: "Qual post teve mais engajamento nas últimas semanas?" },
  { icon: "📈", label: "Estratégia", prompt: "Que tipo de conteúdo você recomenda pra próxima semana?" },
];

const TOOL_LABELS: Record<string, string> = {
  list_instagram_profiles: "📱 Listar contas",
  list_instagram_posts: "📄 Buscar posts",
  publish_instagram_post: "🚀 Publicar post",
  generate_image: "🎨 Gerar imagem (Mystic)",
  upscale_image: "🔍 Upscale (Magnific)",
  remove_background: "✂️ Remover fundo",
  generate_caption: "✍️ Gerar legenda",
};

function AIChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Sou o **Claude Opus 4.8** conectado ao seu InstaBot.\n\nTenho ferramentas reais:\n- 📱 Ler suas contas e posts do Instagram\n- 🚀 Publicar posts (com sua confirmação)\n- 🎨 Gerar imagens com Freepik Mystic\n- 🔍 Upscale com Magnific (2x–16x)\n- ✂️ Remover fundo de imagens\n- ✍️ Gerar legendas com hashtags\n\nMe conta o que você quer fazer.",
      ts: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMut = useMutation({
    mutationFn: async (history: Msg[]) => {
      const payload = history
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      return agentChat({ data: { messages: payload } });
    },
    onSuccess: (res) => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: res.answer || "_(sem resposta)_",
          trace: res.trace,
          ts: new Date().toISOString(),
        },
      ]);
    },
    onError: (err) => {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `❌ Erro: ${err instanceof Error ? err.message : String(err)}`,
          ts: new Date().toISOString(),
        },
      ]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatMut.isPending]);

  const send = (text: string) => {
    if (!text.trim() || chatMut.isPending) return;
    const next = [
      ...messages,
      { id: crypto.randomUUID(), role: "user" as const, content: text, ts: new Date().toISOString() },
    ];
    setMessages(next);
    setInput("");
    chatMut.mutate(next);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Agente IA"
        title="💬 Chat IA"
        subtitle="Claude Opus 4.8 + tools reais (Instagram, Freepik Mystic, Magnific)"
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <Card className="flex h-[calc(100vh-14rem)] flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-ig text-white"
                    }`}
                  >
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className="flex max-w-[75%] flex-col gap-2">
                    {m.trace && m.trace.length > 0 && (
                      <div className="space-y-1">
                        {m.trace.map((t, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-[11px]"
                          >
                            <Wrench className="h-3 w-3 text-primary" />
                            <span className="font-medium">{TOOL_LABELS[t.name] ?? t.name}</span>
                            {t.error ? (
                              <>
                                <XCircle className="h-3 w-3 text-destructive" />
                                <span className="text-destructive">{t.error}</span>
                              </>
                            ) : (
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm ${
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60"
                      }`}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-img:my-2 prose-img:rounded-lg prose-strong:text-current">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                      <div className="mt-1 text-[10px] opacity-60">
                        {new Date(m.ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {chatMut.isPending && (
                <div className="flex gap-3">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-ig text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-muted/60 px-4 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "120ms" }} />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "240ms" }} />
                      </div>
                      pensando & usando ferramentas...
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
                  <Button
                    key={c.label}
                    variant="outline"
                    size="sm"
                    onClick={() => send(c.prompt)}
                    disabled={chatMut.isPending}
                  >
                    <span className="mr-1">{c.icon}</span> {c.label}
                  </Button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send(input);
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Peça algo real: 'lista minhas contas', 'gera imagem X', 'publica no @conta'…"
                  disabled={chatMut.isPending}
                  autoFocus
                />
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
              <h3 className="text-sm font-semibold">Modelo ativo</h3>
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-xs">
              <div className="font-semibold">Claude Opus 4.8</div>
              <div className="text-muted-foreground">via KPA Labz</div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Ferramentas</h3>
              <Badge className="ml-auto">7</Badge>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>📱 Listar contas Instagram</li>
              <li>📄 Buscar posts publicados</li>
              <li>🚀 Publicar post (com confirmação)</li>
              <li>🎨 Gerar imagem — Freepik Mystic</li>
              <li>🔍 Upscale — Magnific (2x–16x)</li>
              <li>✂️ Remover fundo</li>
              <li>✍️ Gerar legenda + hashtags</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
