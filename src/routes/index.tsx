import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Camera, Users, TrendingUp, Image as ImageIcon, DollarSign,
  PlusCircle, Package, CalendarDays, ListChecks, BarChart3, Settings, Key, Activity,
  ExternalLink, RefreshCw, Heart, MessageCircle,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
} from "recharts";
import { toast } from "sonner";

import { listInstagramProfiles, listInstagramPosts, refreshInstagramProfile } from "@/lib/instagram.functions";
import { getRealMetaKPI, getRealMetaComparison } from "@/lib/meta-ads.functions";
import { BRL, relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — InstaBot" },
      { name: "description", content: "Visão geral do Instagram conectado e campanhas Meta Ads reais." },
    ],
  }),
  component: Dashboard,
});

const kpiGradients = ["bg-gradient-info", "bg-gradient-success", "bg-gradient-warning", "bg-gradient-primary", "bg-gradient-danger"];
const kpiIcons = [Users, ImageIcon, TrendingUp, Camera, DollarSign];

function Dashboard() {
  const listProfilesFn = useServerFn(listInstagramProfiles);
  const listPostsFn = useServerFn(listInstagramPosts);
  const refreshFn = useServerFn(refreshInstagramProfile);
  const kpiFn = useServerFn(getRealMetaKPI);
  const compFn = useServerFn(getRealMetaComparison);

  const { data: profiles } = useQuery({ queryKey: ["ig-profiles"], queryFn: () => listProfilesFn() });
  const { data: postsData, isLoading: postsLoading, refetch } = useQuery({
    queryKey: ["ig-posts", "dashboard"],
    queryFn: () => listPostsFn({ data: { limit: 6 } }),
  });
  const { data: kpi } = useQuery({ queryKey: ["meta-kpi-real"], queryFn: () => kpiFn({ data: { days: 7 } }) });
  const { data: comparison } = useQuery({ queryKey: ["meta-comparison-real"], queryFn: () => compFn({ data: { days: 7 } }) });

  const profile = profiles?.[0];
  const posts = postsData?.posts ?? [];
  const totalEngagement = posts.reduce((sum, p) => sum + p.like_count + p.comments_count, 0);
  const avgEngagement = posts.length > 0 ? Math.round(totalEngagement / posts.length) : 0;

  const heroCards = [
    { label: "Seguidores", value: profile?.followers_count?.toLocaleString("pt-BR") ?? "—" },
    { label: "Posts totais", value: profile?.media_count ?? "—" },
    { label: "Eng. médio", value: avgEngagement.toLocaleString("pt-BR") },
    { label: "Campanhas ativas", value: kpi?.active_campaigns ?? 0 },
    { label: "Meta gasto (7d)", value: BRL(kpi?.period_spend ?? 0) },
  ];

  const quickActions = [
    { title: "Novo Post", subtitle: "Publicar no Instagram", icon: PlusCircle, to: "/schedule", tint: "border-l-primary" },
    { title: "Em Massa", subtitle: "Upload de vários posts", icon: Package, to: "/bulk", tint: "border-l-info" },
    { title: "Calendário", subtitle: "Visualize por dia", icon: CalendarDays, to: "/calendar", tint: "border-l-success" },
    { title: "Posts", subtitle: "Feed do Instagram", icon: ListChecks, to: "/posts", tint: "border-l-warning" },
    { title: "Meta Ads", subtitle: "KPIs reais", icon: BarChart3, to: "/meta-dashboard", tint: "border-l-destructive" },
    { title: "Criativos", subtitle: "AdSets e ads", icon: ImageIcon, to: "/meta-creatives", tint: "border-l-ig-purple" },
    { title: "Configurações", subtitle: "Contas, mídia, templates", icon: Settings, to: "/settings", tint: "border-l-muted-foreground" },
    { title: "Credenciais Meta", subtitle: "Token da API", icon: Key, to: "/settings/meta-ads", tint: "border-l-ig-pink" },
  ] as const;

  async function handleRefresh() {
    if (!profile) return;
    toast.info("Sincronizando…");
    try {
      await refreshFn({ data: { igBusinessId: profile.ig_business_id } });
      await refetch();
      toast.success("Atualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Painel geral"
        title="Dashboard"
        subtitle={profile ? `@${profile.ig_username} · InstaBot + Meta Ads` : "Conecte uma conta"}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRefresh}><RefreshCw className="mr-1 h-4 w-4" /> Sincronizar</Button>
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

        {/* Profile card */}
        {profile && (
          <Card className="flex flex-wrap items-center gap-4 p-4">
            <img
              src={profile.profile_picture_url ?? ""}
              alt={profile.ig_username}
              className="h-14 w-14 rounded-full border-2 border-primary/40 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
            <div className="min-w-0 flex-1">
              <div className="font-semibold">@{profile.ig_username} <Badge variant="secondary" className="ml-2 text-xs">Business</Badge></div>
              <div className="text-sm text-muted-foreground">{profile.ig_name}</div>
            </div>
            <div className="flex gap-4 text-sm">
              <Stat label="Seguidores" value={profile.followers_count?.toLocaleString("pt-BR") ?? "—"} />
              <Stat label="Segue" value={profile.follows_count?.toLocaleString("pt-BR") ?? "—"} />
              <Stat label="Posts" value={String(profile.media_count ?? "—")} />
            </div>
          </Card>
        )}

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

        {/* Meta comparison chart */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Meta Ads · gasto por conta (7d)</h3>
              <p className="text-xs text-muted-foreground">Dados reais da Graph API</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/meta-dashboard">Ver mais →</Link>
            </Button>
          </div>
          <div className="h-64">
            {comparison && comparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={120} />
                  <RTooltip
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                    formatter={(v: number) => BRL(v)}
                  />
                  <Bar dataKey="period_spend" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                Sem contas de anúncio conectadas ou sem gastos no período.
              </div>
            )}
          </div>
        </Card>

        {/* Recent posts */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold">Últimos posts</h3>
              <p className="text-xs text-muted-foreground">Feed real do Instagram</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/posts">Ver todos →</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-6">
            {postsLoading && [...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
            {posts.slice(0, 6).map((p) => (
              <a key={p.id} href={p.permalink} target="_blank" rel="noreferrer" className="group relative aspect-square overflow-hidden rounded-lg bg-muted">
                {p.media_url && (
                  <img src={p.thumbnail_url ?? p.media_url} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                )}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                  <div className="flex gap-2 text-xs text-white">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {p.like_count}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {p.comments_count}</span>
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </div>
                </div>
              </a>
            ))}
            {!postsLoading && posts.length === 0 && (
              <div className="col-span-full p-8 text-center text-sm text-muted-foreground">Nenhum post encontrado.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
