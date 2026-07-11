import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Bot, Bell, ListChecks } from "lucide-react";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Histórico — InstaBot" },
      { name: "description", content: "Histórico consolidado de ações da IA, notificações e posts." },
    ],
  }),
  component: HistoryPage,
});

type Period = "7d" | "30d" | "all";

function HistoryPage() {
  const { data } = useQuery({ queryKey: ["history"], queryFn: () => api.getHistory() });
  const [period, setPeriod] = useState<Period>("7d");

  const cutoff = useMemo(() => {
    if (period === "all") return 0;
    return Date.now() - (period === "7d" ? 7 : 30) * 86400000;
  }, [period]);

  const inRange = (iso: string) => new Date(iso).getTime() >= cutoff;
  const actions = (data?.ai_actions ?? []).filter((a) => inRange(a.created_at));
  const notifs = (data?.notifications ?? []).filter((n) => inRange(n.timestamp));
  const posts = (data?.posts ?? []).filter((p) => inRange(p.scheduled_at));

  return (
    <div>
      <PageHeader
        eyebrow="Timeline"
        title="📜 Histórico"
        subtitle="Ações da IA, notificações e posts em um só lugar"
        actions={
          <div className="flex gap-1 rounded-lg border bg-card p-1">
            {(["7d", "30d", "all"] as Period[]).map((p) => (
              <Button key={p} size="sm" variant={period === p ? "default" : "ghost"} onClick={() => setPeriod(p)}>
                {p === "all" ? "Tudo" : p}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid gap-4 p-6 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Ações da IA</h3>
            <Badge variant="outline" className="ml-auto">{actions.length}</Badge>
          </div>
          <ul className="space-y-3">
            {actions.map((a) => (
              <li key={a.id} className="rounded-lg border bg-card/50 p-3">
                <div className="flex items-center gap-2 text-xs">
                  <StatusChip status={a.status} />
                  <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <div className="mt-1 text-sm font-medium">{a.campaign_name}</div>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </li>
            ))}
            {actions.length === 0 && <Empty>Nenhuma ação da IA no período</Empty>}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Notificações</h3>
            <Badge variant="outline" className="ml-auto">{notifs.length}</Badge>
          </div>
          <ul className="space-y-3">
            {notifs.map((n, i) => (
              <li key={i} className="border-l-2 pl-3" style={{ borderColor: levelColor(n.level) }}>
                <div className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleString("pt-BR")}</div>
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.message}</div>
              </li>
            ))}
            {notifs.length === 0 && <Empty>Sem notificações no período</Empty>}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Posts recentes</h3>
            <Badge variant="outline" className="ml-auto">{posts.length}</Badge>
          </div>
          <ul className="space-y-2">
            {posts.slice(0, 20).map((p) => (
              <li key={p.id} className="rounded-md border bg-card/50 p-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{p.post_type}</Badge>
                  <span className="text-xs text-muted-foreground">@{p.instagram_username}</span>
                  <span className="ml-auto text-[11px] text-muted-foreground">{new Date(p.scheduled_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="mt-1 truncate text-xs">{p.caption}</p>
              </li>
            ))}
            {posts.length === 0 && <Empty>Sem posts no período</Empty>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <li className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">{children}</li>;
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning-foreground border-warning/40",
    approved: "bg-info/15 text-info border-info/40",
    executed: "bg-success/15 text-success border-success/40",
    rejected: "bg-destructive/15 text-destructive border-destructive/40",
  };
  return <Badge variant="outline" className={map[status] ?? ""}>{status}</Badge>;
}

function levelColor(l: string) {
  if (l === "error") return "hsl(var(--destructive))";
  if (l === "warn") return "hsl(var(--warning))";
  return "hsl(var(--primary))";
}
