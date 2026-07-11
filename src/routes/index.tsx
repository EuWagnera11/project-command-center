import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Camera, CheckCircle2, Clock, AlertTriangle, DollarSign,
  PlusCircle, Package, CalendarDays, ListChecks, BarChart3, Settings, Key, Activity,
  Play, X, RefreshCw, Bell,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { BRL, formatDateTime, relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PostStatus, PostType } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — InstaBot" },
      { name: "description", content: "Visão geral: posts agendados, publicações, campanhas Meta Ads e alertas em tempo real." },
    ],
  }),
  component: Dashboard,
});

const kpiGradients = ["bg-gradient-info", "bg-gradient-success", "bg-gradient-warning", "bg-gradient-danger", "bg-gradient-primary"];
const kpiIcons = [Camera, CheckCircle2, Clock, AlertTriangle, DollarSign];

function Dashboard() {
  const { data: posts, isLoading: postsLoading } = useQuery({ queryKey: ["posts"], queryFn: () => api.listPosts() });
  const { data: kpi } = useQuery({ queryKey: ["meta-kpi"], queryFn: () => api.metaKPI() });
  const { data: notifications } = useQuery({ queryKey: ["notifications"], queryFn: () => api.listNotifications(6) });
  const { data: comparison } = useQuery({ queryKey: ["meta-comparison"], queryFn: () => api.metaComparison() });

  const stats = {
    total: posts?.length ?? 0,
    published: posts?.filter((p) => p.status === "published").length ?? 0,
    pending: posts?.filter((p) => p.status === "pending").length ?? 0,
    failed: posts?.filter((p) => p.status === "failed").length ?? 0,
    spend7d: kpi?.period_spend ?? 0,
  };

  const heroCards = [
    { label: "Posts totais", value: stats.total },
    { label: "Publicados", value: stats.published },
    { label: "Agendados", value: stats.pending },
    { label: "Falhas", value: stats.failed },
    { label: "Meta gasto (7d)", value: BRL(stats.spend7d) },
  ];

  const donutData = [
    { name: "Publicados", value: stats.published, color: "var(--success)" },
    { name: "Agendados", value: stats.pending, color: "var(--warning)" },
    { name: "Falhas", value: stats.failed, color: "var(--destructive)" },
  ];

  const upcomingPosts = (posts ?? []).filter((p) => p.status === "pending").slice(0, 5);

  const quickActions = [
    { title: "Novo Post", subtitle: "Agende uma publicação", icon: PlusCircle, to: "/schedule", tint: "border-l-primary" },
    { title: "Em Massa", subtitle: "Upload de vários posts", icon: Package, to: "/bulk", tint: "border-l-info" },
    { title: "Calendário", subtitle: "Visualize por dia", icon: CalendarDays, to: "/calendar", tint: "border-l-success" },
    { title: "Posts", subtitle: "Gerenciar tudo", icon: ListChecks, to: "/posts", tint: "border-l-warning" },
    { title: "Meta Ads", subtitle: "KPIs e campanhas", icon: BarChart3, to: "/meta-dashboard", tint: "border-l-destructive" },
    { title: "Configurações", subtitle: "Contas, mídia, templates", icon: Settings, to: "/settings", tint: "border-l-muted-foreground" },
    { title: "Credenciais Meta", subtitle: "Token da API", icon: Key, to: "/settings/meta-ads", tint: "border-l-ig-purple" },
    { title: "Saúde do Bot", subtitle: "Status do scheduler", icon: Activity, to: "/", tint: "border-l-ig-pink" },
  ] as const;

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Painel geral"
        title="Dashboard"
        subtitle="Visão completa · InstaBot + Meta Ads"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.success("Backup criado")}>Backup</Button>
            <Button variant="outline" size="sm" onClick={() => api.metaCheckAlerts().then(() => toast.info("Alertas verificados"))}>Verificar alertas</Button>
            <Button size="sm" asChild><Link to="/schedule"><PlusCircle className="mr-1 h-4 w-4" />Novo post</Link></Button>
          </>
        }
      />

      <div className="space-y-6 p-6">
        {/* Hero KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {heroCards.map((c, i) => {
            const Icon = kpiIcons[i];
            return (
              <div key={c.label} className={`relative overflow-hidden rounded-2xl p-4 text-white shadow-md ${kpiGradients[i]}`}>
                <div className="text-[11px] font-semibold uppercase tracking-widest opacity-80">{c.label}</div>
                <div className="mt-2 text-2xl font-black tracking-tight">{c.value}</div>
                <Icon className="absolute -right-2 -bottom-2 h-16 w-16 opacity-15" />
              </div>
            );
          })}
        </div>

        {/* Quick actions */}
        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Ações rápidas</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {quickActions.map((q) => (
              <Link
                key={q.title}
                to={q.to}
                className={`group flex items-start gap-3 rounded-xl border-l-4 ${q.tint} bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-muted text-primary">
                  <q.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{q.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{q.subtitle}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Publicações</h3>
                <p className="text-xs text-muted-foreground">Distribuição por status</p>
              </div>
              <Badge variant="secondary">Total {stats.total}</Badge>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} innerRadius={60} outerRadius={95} paddingAngle={3} dataKey="value">
                    {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <RTooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-4 text-xs">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Meta Ads · gasto por conta (7d)</h3>
                <p className="text-xs text-muted-foreground">R$ investidos nos últimos 7 dias</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/meta-dashboard">Ver mais →</Link>
              </Button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison ?? []} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={100} />
                  <RTooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                    formatter={(v: number) => BRL(v)}
                  />
                  <Bar dataKey="period_spend" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Upcoming posts */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold">Próximos posts</h3>
              <p className="text-xs text-muted-foreground">Ordenados pelo horário agendado</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/posts">Ver todos →</Link>
            </Button>
          </div>
          <div className="divide-y">
            {postsLoading && [...Array(3)].map((_, i) => <div key={i} className="p-4"><Skeleton className="h-14" /></div>)}
            {upcomingPosts.map((p) => (
              <div key={p.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 hover:bg-muted/40">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-ig text-lg text-white">
                  {p.post_type === "reel" ? "🎬" : p.post_type === "carousel" ? "🖼" : p.post_type === "story" ? "⭕" : "📷"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <PostTypeBadge type={p.post_type} />
                    <span className="text-xs font-medium text-muted-foreground">@{p.instagram_username}</span>
                  </div>
                  <div className="mt-1 truncate text-sm">{p.caption}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(p.scheduled_at)} · {relativeTime(p.scheduled_at)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <StatusBadge status={p.status} />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toast.success(`Publicando #${p.id}`)}><Play className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => toast.error(`Cancelado #${p.id}`)}><X className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {!postsLoading && upcomingPosts.length === 0 && (
              <div className="p-10 text-center text-sm text-muted-foreground">Nenhum post agendado.</div>
            )}
          </div>
        </Card>

        {/* Activity + Notifications */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-4 text-sm font-semibold">Atividade recente</h3>
            <ul className="space-y-3 text-sm">
              {(notifications ?? []).map((n) => (
                <li key={n.timestamp} className="flex items-start gap-3">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    n.level === "error" ? "bg-destructive" : n.level === "warn" ? "bg-warning" : "bg-success"
                  }`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{n.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{n.message}</div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(n.timestamp)}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Bell className="h-4 w-4" /> Notificações</h3>
              <Button variant="ghost" size="sm" onClick={() => api.clearNotifications().then(() => toast.success("Limpo"))}>
                <RefreshCw className="mr-1 h-3 w-3" /> Limpar
              </Button>
            </div>
            <ul className="space-y-3 text-sm">
              {(notifications ?? []).map((n) => (
                <li key={n.timestamp + n.title} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{n.title}</div>
                    <Badge variant={n.level === "error" ? "destructive" : "secondary"} className="text-[10px]">
                      {n.level}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{n.message}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(n.timestamp)}</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function PostTypeBadge({ type }: { type: PostType }) {
  const map: Record<PostType, string> = {
    photo: "bg-info/15 text-info-foreground border-info/30",
    reel: "bg-destructive/15 text-destructive border-destructive/30",
    carousel: "bg-primary/15 text-primary border-primary/30",
    story: "bg-warning/20 text-warning-foreground border-warning/40",
  };
  const labels: Record<PostType, string> = { photo: "Foto", reel: "Reel", carousel: "Carrossel", story: "Story" };
  return <Badge variant="outline" className={`rounded-full ${map[type]}`}>{labels[type]}</Badge>;
}

export function StatusBadge({ status }: { status: PostStatus }) {
  const map: Record<PostStatus, string> = {
    pending: "bg-warning/15 text-warning-foreground border-warning/40",
    publishing: "bg-info/15 text-info border-info/30",
    published: "bg-success/15 text-success border-success/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
  };
  const labels: Record<PostStatus, string> = { pending: "Agendado", publishing: "Publicando", published: "Publicado", failed: "Falhou" };
  return <Badge variant="outline" className={`rounded-full ${map[status]}`}>{labels[status]}</Badge>;
}
