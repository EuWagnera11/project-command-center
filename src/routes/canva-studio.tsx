import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Palette, RefreshCw, Send, Pencil, Eye, CheckCircle2, XCircle,
  Webhook, KeyRound, Circle,
} from "lucide-react";

import { api } from "@/lib/api";
import type { CanvaDesign, CanvaIntentKind } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/canva-studio")({
  head: () => ({
    meta: [
      { title: "Canva Studio — InstaBot" },
      { name: "description", content: "Gerencie designs Canva e publique direto no Instagram via Canva Apps SDK." },
    ],
  }),
  component: CanvaStudioPage,
});

const typeLabel: Record<CanvaDesign["type"], string> = {
  poster: "Poster", social: "Social", video: "Vídeo", doc: "Doc",
};

function CanvaStudioPage() {
  const status = useQuery({ queryKey: ["canva-status"], queryFn: api.canvaStatus });
  const designs = useQuery({ queryKey: ["canva-designs"], queryFn: api.canvaListDesigns });
  const intents = useQuery({ queryKey: ["canva-intents"], queryFn: api.canvaIntents });
  const [busyId, setBusyId] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: ({ intent, id }: { intent: CanvaIntentKind; id: string }) => api.canvaSendIntent(intent, id),
    onMutate: (v) => setBusyId(v.id),
    onSettled: () => setBusyId(null),
    onSuccess: (_d, v) => {
      toast.success(
        v.intent === "publish" ? "Design publicado no Instagram" :
        v.intent === "design" ? "Editor aberto no Canva" :
        "Dados lidos do design",
      );
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Palette className="h-6 w-6 text-primary" /> Canva Studio
          </h1>
          <p className="text-sm text-muted-foreground">
            App Canva conectado — leia dados, edite designs e publique posts pelo Canva Apps SDK.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { designs.refetch(); intents.refetch(); }}>
          <RefreshCw className="mr-2 h-4 w-4" /> Recarregar
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">App ID</CardTitle></CardHeader>
          <CardContent><div className="font-mono text-sm">{status.data?.app_id ?? "—"}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Status</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={status.data?.connected ? "default" : "outline"} className="gap-1.5">
              <Circle className={`h-2 w-2 ${status.data?.connected ? "fill-success text-success" : "fill-muted-foreground text-muted-foreground"}`} />
              {status.data?.connected ? "Conectado" : "Desconectado"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Designs</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{status.data?.designs_count ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Escopos</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-1">
            {(status.data?.scopes ?? []).map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Webhook className="h-4 w-4 text-primary" /> Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="font-mono text-xs text-muted-foreground">{status.data?.webhook_url}</CardContent>
      </Card>

      <Tabs defaultValue="designs">
        <TabsList>
          <TabsTrigger value="designs">Designs</TabsTrigger>
          <TabsTrigger value="intents">Intents recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="designs">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {(designs.data ?? []).map((d) => (
              <Card key={d.id} className="group overflow-hidden p-0">
                <div className="aspect-[4/5] bg-muted">
                  <img src={d.thumbnail_url} alt={d.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
                <CardContent className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold" title={d.name}>{d.name}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{d.id}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{typeLabel[d.type]}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Ler dados"
                      disabled={busyId === d.id} onClick={() => send.mutate({ intent: "data", id: d.id })}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Editar no Canva"
                      disabled={busyId === d.id} onClick={() => send.mutate({ intent: "design", id: d.id })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="default" className="ml-auto h-7 gap-1 px-2 text-xs"
                      disabled={busyId === d.id} onClick={() => send.mutate({ intent: "publish", id: d.id })}>
                      <Send className="h-3 w-3" /> Publicar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="intents">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Intent</th>
                    <th className="px-4 py-2 text-left">Design</th>
                    <th className="px-4 py-2 text-left">Operação</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  {(intents.data ?? []).map((i) => (
                    <tr key={i.id} className="border-b last:border-0">
                      <td className="px-4 py-2"><Badge variant="outline">{i.intent}</Badge></td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{i.design_name}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{i.design_id}</div>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{i.operation}</td>
                      <td className="px-4 py-2">
                        {i.status === "ok"
                          ? <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" /> ok</span>
                          : <span className="flex items-center gap-1 text-destructive"><XCircle className="h-3.5 w-3.5" /> erro</span>}
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <KeyRound className="h-4 w-4 text-primary" /> Como autenticar no Canva
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs text-muted-foreground">
          <div>Provider: <span className="font-mono">instabot</span></div>
          <div>Client ID: <span className="font-mono">instabot-canva-app</span></div>
          <div>Redirect URL: <span className="font-mono">https://www.canva.com/apps/oauth/authorized</span></div>
          <div>Tipo de token: <span className="font-mono">JWT (HS256, 1h access + 30d refresh)</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
