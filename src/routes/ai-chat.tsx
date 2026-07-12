import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Send, Sparkles, Bot, User as UserIcon, Wrench, CheckCircle2, XCircle,
  Paperclip, ImagePlus, Mic, Square, X, FileText, Music,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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
      { name: "description", content: "Agente Claude Opus 4.8 com ferramentas reais + anexos (imagem, arquivo, áudio)." },
    ],
  }),
  component: AIChatPage,
});

type Attachment = { kind: "image" | "file" | "audio"; url: string; name?: string; mime?: string };
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
  trace?: ToolTrace[];
  ts: string;
};

const chips = [
  { icon: "📱", label: "Contas", prompt: "Lista minhas contas do Instagram conectadas" },
  { icon: "📅", label: "Últimos posts", prompt: "Me mostra os 5 últimos posts publicados com likes e comentários" },
  { icon: "🎨", label: "Gerar imagem", prompt: "Gera uma imagem quadrada fotorrealista de um café da manhã fitness bem apetitoso" },
  { icon: "✍️", label: "Legenda", prompt: "Gera uma legenda de engajamento sobre motivação de segunda-feira" },
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

async function uploadToBucket(file: Blob, filename: string, mime: string): Promise<string> {
  const ext = filename.split(".").pop() ?? "bin";
  const path = `chat/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("bulk-media").upload(path, file, {
    contentType: mime, upsert: false,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("bulk-media").getPublicUrl(path).data.publicUrl;
}

function AIChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome", role: "assistant",
      content:
        "👋 Sou o **Claude Opus 4.8** conectado ao seu InstaBot.\n\nAgora aceito **anexos**: imagens (📎), arquivos e áudio 🎙️.\n\nMe conta o que você quer fazer.",
      ts: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const chatMut = useMutation({
    mutationFn: async (history: Msg[]) => {
      const payload = history.filter((m) => m.id !== "welcome").map((m) => ({
        role: m.role, content: m.content,
        ...(m.attachments && m.attachments.length ? { attachments: m.attachments } : {}),
      }));
      return agentChat({ data: { messages: payload } });
    },
    onSuccess: (res) => {
      setMessages((m) => [...m, {
        id: crypto.randomUUID(), role: "assistant",
        content: res.answer || "_(sem resposta)_", trace: res.trace, ts: new Date().toISOString(),
      }]);
    },
    onError: (err) => {
      setMessages((m) => [...m, {
        id: crypto.randomUUID(), role: "assistant",
        content: `❌ Erro: ${err instanceof Error ? err.message : String(err)}`, ts: new Date().toISOString(),
      }]);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, chatMut.isPending]);

  const handleFiles = async (files: FileList | null, kind: "image" | "file") => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const added: Attachment[] = [];
      for (const f of Array.from(files)) {
        const mime = f.type || (kind === "image" ? "image/jpeg" : "application/octet-stream");
        const url = await uploadToBucket(f, f.name, mime);
        added.push({ kind, url, name: f.name, mime });
      }
      setPending((p) => [...p, ...added]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const mime = rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mime });
        const ext = mime.includes("mp4") ? "m4a" : "webm";
        setUploading(true);
        try {
          const url = await uploadToBucket(blob, `audio-${Date.now()}.${ext}`, mime);
          setPending((p) => [...p, { kind: "audio", url, name: `Gravação (${recSeconds}s)`, mime }]);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Falha ao enviar áudio");
        } finally {
          setUploading(false);
        }
      };
      mediaRecRef.current = rec;
      rec.start();
      setRecording(true);
      setRecSeconds(0);
      timerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const send = () => {
    const text = input.trim();
    if ((!text && !pending.length) || chatMut.isPending) return;
    const next: Msg[] = [
      ...messages,
      {
        id: crypto.randomUUID(), role: "user", content: text || "(veja os anexos)",
        attachments: pending.length ? pending : undefined, ts: new Date().toISOString(),
      },
    ];
    setMessages(next);
    setInput("");
    setPending([]);
    chatMut.mutate(next);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Agente IA"
        title="💬 Chat IA"
        subtitle="Claude Opus 4.8 + tools reais — agora com anexos (imagem, arquivo, áudio)"
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
        <Card className="flex h-[calc(100vh-14rem)] flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-ig text-white"
                  }`}>
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className="flex max-w-[75%] flex-col gap-2">
                    {m.trace && m.trace.length > 0 && (
                      <div className="space-y-1">
                        {m.trace.map((t, i) => (
                          <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-[11px]">
                            <Wrench className="h-3 w-3 text-primary" />
                            <span className="font-medium">{TOOL_LABELS[t.name] ?? t.name}</span>
                            {t.error ? (
                              <><XCircle className="h-3 w-3 text-destructive" /><span className="text-destructive">{t.error}</span></>
                            ) : (<CheckCircle2 className="h-3 w-3 text-emerald-500" />)}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 text-sm ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60"
                    }`}>
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {m.attachments.map((a, i) => a.kind === "image" ? (
                            <a key={i} href={a.url} target="_blank" rel="noreferrer">
                              <img src={a.url} alt={a.name ?? ""} className="h-24 w-24 rounded-md object-cover" />
                            </a>
                          ) : a.kind === "audio" ? (
                            <audio key={i} controls src={a.url} className="h-9" />
                          ) : (
                            <a key={i} href={a.url} target="_blank" rel="noreferrer"
                               className="flex items-center gap-2 rounded-md border bg-background/40 px-2 py-1 text-xs">
                              <FileText className="h-3 w-3" /> {a.name ?? "arquivo"}
                            </a>
                          ))}
                        </div>
                      )}
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
                  <Button key={c.label} variant="outline" size="sm"
                    onClick={() => { setInput(c.prompt); }}
                    disabled={chatMut.isPending}>
                    <span className="mr-1">{c.icon}</span> {c.label}
                  </Button>
                ))}
              </div>

              {pending.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-2">
                  {pending.map((a, i) => (
                    <div key={i} className="relative flex items-center gap-2 rounded-md border bg-background px-2 py-1 text-xs">
                      {a.kind === "image" ? (
                        <img src={a.url} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : a.kind === "audio" ? (
                        <Music className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="max-w-[140px] truncate">{a.name ?? a.kind}</span>
                      <button
                        type="button"
                        onClick={() => setPending((p) => p.filter((_, j) => j !== i))}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                        aria-label="Remover"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {uploading && <span className="text-xs text-muted-foreground">enviando…</span>}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2">
                <input ref={imgInputRef} type="file" accept="image/*" multiple hidden
                  onChange={(e) => { handleFiles(e.target.files, "image"); e.target.value = ""; }} />
                <input ref={fileInputRef} type="file" multiple hidden
                  onChange={(e) => { handleFiles(e.target.files, "file"); e.target.value = ""; }} />

                <Button type="button" variant="ghost" size="icon" title="Anexar imagem"
                  onClick={() => imgInputRef.current?.click()} disabled={uploading || chatMut.isPending}>
                  <ImagePlus className="h-4 w-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" title="Anexar arquivo"
                  onClick={() => fileInputRef.current?.click()} disabled={uploading || chatMut.isPending}>
                  <Paperclip className="h-4 w-4" />
                </Button>
                {recording ? (
                  <Button type="button" variant="destructive" size="icon" onClick={stopRecording} title={`Parar (${recSeconds}s)`}>
                    <Square className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" size="icon" title="Gravar áudio"
                    onClick={startRecording} disabled={uploading || chatMut.isPending}>
                    <Mic className="h-4 w-4" />
                  </Button>
                )}

                <Input value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder={recording ? `Gravando… ${recSeconds}s` : "Peça algo real ou anexe uma imagem/áudio…"}
                  disabled={chatMut.isPending} autoFocus />
                <Button type="submit" disabled={(!input.trim() && !pending.length) || chatMut.isPending || uploading}>
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
              <Paperclip className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Anexos suportados</h3>
            </div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>🖼️ Imagens (visão multimodal)</li>
              <li>📎 Arquivos (PDF, docs — link)</li>
              <li>🎙️ Gravação de áudio direto do mic</li>
            </ul>
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
