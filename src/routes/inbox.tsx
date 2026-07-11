import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { InboxMessage } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox, MessageCircle, Send, Sparkles, Archive } from "lucide-react";

export const Route = createFileRoute("/inbox")({
  head: () => ({ meta: [{ title: "Inbox — InstaBot" }, { name: "description", content: "DMs e comentários unificados dos seus perfis." }] }),
  component: InboxPage,
});

function InboxPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "sent" | "archived">("pending");
  const list = useQuery({ queryKey: ["inbox", tab], queryFn: () => api.listInbox(tab) });
  const [selected, setSelected] = useState<InboxMessage | null>(null);
  const [draft, setDraft] = useState("");

  const suggest = useMutation({
    mutationFn: (id: number) => api.suggestReplyInbox(id),
    onSuccess: (data) => { setDraft(data.suggestion); toast.success("Sugestão IA gerada"); },
  });
  const reply = useMutation({
    mutationFn: (v: { id: number; text: string }) => api.replyInbox(v.id, v.text),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inbox"] }); toast.success("Resposta enviada"); setDraft(""); setSelected(null); },
  });

  const items = list.data ?? [];
  const active = selected ?? items[0];

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Inbox className="h-6 w-6 text-primary" /> Inbox</h1>
        <p className="text-sm text-muted-foreground">DMs e comentários de todos os perfis num só lugar.</p>
      </header>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setSelected(null); }}>
        <TabsList>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="sent">Respondidas</TabsTrigger>
          <TabsTrigger value="archived">Arquivadas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card className="max-h-[70vh] overflow-y-auto p-0">
          {items.map((m) => (
            <button
              key={m.id}
              onClick={() => { setSelected(m); setDraft(m.ai_reply ?? ""); }}
              className={`w-full border-b px-4 py-3 text-left transition hover:bg-muted/40 ${active?.id === m.id ? "bg-muted/60" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{m.sender}</span>
                <Badge variant="outline" className="shrink-0 text-[10px]">{m.source === "dm" ? "DM" : "Comment"}</Badge>
              </div>
              <div className="mt-0.5 truncate text-xs text-muted-foreground">{m.profile_name}</div>
              <div className="mt-1 line-clamp-2 text-xs">{m.message_text}</div>
            </button>
          ))}
          {items.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">Nada aqui.</div>}
        </Card>

        <Card className="flex min-h-[400px] flex-col p-4">
          {active ? (
            <>
              <div className="border-b pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {active.sender} <span className="text-xs font-normal text-muted-foreground">via {active.profile_name}</span>
                </div>
                <p className="mt-2 rounded-lg bg-muted/40 p-3 text-sm">{active.message_text}</p>
                <div className="mt-2 text-xs text-muted-foreground">{new Date(active.received_at).toLocaleString("pt-BR")}</div>
              </div>
              <div className="mt-4 flex-1">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium">Sua resposta</span>
                  <Button size="sm" variant="outline" onClick={() => suggest.mutate(active.id)} disabled={suggest.isPending}>
                    <Sparkles className="mr-2 h-3.5 w-3.5" /> Sugerir com IA
                  </Button>
                </div>
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} placeholder="Escreva ou peça uma sugestão à IA…" />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm"><Archive className="mr-2 h-4 w-4" /> Arquivar</Button>
                <Button size="sm" onClick={() => reply.mutate({ id: active.id, text: draft })} disabled={!draft.trim()}>
                  <Send className="mr-2 h-4 w-4" /> Responder
                </Button>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center text-sm text-muted-foreground">Selecione uma mensagem</div>
          )}
        </Card>
      </div>
    </div>
  );
}
