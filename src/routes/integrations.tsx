import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { IntegrationCard } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plug, Instagram, BarChart3, Palette, FileSpreadsheet, Sparkles, KeyRound, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/integrations")({
  head: () => ({ meta: [{ title: "Integrações — InstaBot" }, { name: "description", content: "Hub central de integrações" }] }),
  component: IntegrationsPage,
});

const iconMap = {
  instagram: Instagram, meta: BarChart3, canva: Palette,
  google: FileSpreadsheet, freepik: Sparkles, idp: KeyRound,
} as const;

const statusMap = {
  connected: { icon: CheckCircle2, cls: "text-success", label: "Conectado" },
  disconnected: { icon: XCircle, cls: "text-muted-foreground", label: "Desconectado" },
  error: { icon: AlertTriangle, cls: "text-destructive", label: "Erro" },
} as const;

function IntegrationsPage() {
  const { data = [] } = useQuery({ queryKey: ["integrations"], queryFn: api.integrationCards });
  const connected = data.filter(i => i.status === "connected").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Plug className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Hub de Integrações</h1>
          <p className="text-muted-foreground">{connected} de {data.length} serviços conectados</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map((it: IntegrationCard) => {
          const Icon = iconMap[it.category];
          const S = statusMap[it.status];
          return (
            <Card key={it.id} className="transition hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{it.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className="gap-1.5">
                    <S.icon className={`h-3 w-3 ${S.cls}`} /> {S.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{it.description}</p>
                {it.last_activity && (
                  <div className="text-xs text-muted-foreground">
                    Última atividade: {formatDistanceToNow(new Date(it.last_activity), { addSuffix: true, locale: ptBR })}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">Configurar</Button>
                  <Button size="sm" variant="ghost">Ver logs</Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
