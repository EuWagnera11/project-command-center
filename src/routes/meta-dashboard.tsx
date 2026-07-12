import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { Eye, MousePointerClick, DollarSign, TrendingUp, Zap, RefreshCcw, Key, Users, Activity, Wallet, PauseCircle, PlayCircle, Target } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import { toast } from "sonner";

import { getRealMetaKPI, getRealMetaTimeseries, getRealMetaComparison, listRealCampaigns } from "@/lib/meta-ads.functions";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/meta-dashboard")({
  head: () => ({
    meta: [
      { title: "Meta Ads Dashboard — InstaBot" },
      { name: "description", content: "KPIs reais das suas contas Meta Ads via Graph API." },
    ],
  }),
  component: MetaDashboardPage,
});

function MetaDashboardPage() {
  const kpiFn = useServerFn(getRealMetaKPI);
  const dailyFn = useServerFn(getRealMetaTimeseries);
  const compFn = useServerFn(getRealMetaComparison);
  const campsFn = useServerFn(listRealCampaigns);

  const { data: kpis, refetch: refetchKpi, isFetching: kpiLoading } = useQuery({ queryKey: ["meta-kpi-real", 7], queryFn: () => kpiFn({ data: { days: 7 } }) });
  const { data: daily } = useQuery({ queryKey: ["meta-daily-real", 7], queryFn: () => dailyFn({ data: { days: 7 } }) });
  const { data: comparison } = useQuery({ queryKey: ["meta-comparison-real", 7], queryFn: () => compFn({ data: { days: 7 } }) });
  const { data: campaigns } = useQuery({ queryKey: ["meta-camps-real", 7], queryFn: () => campsFn({ data: { days: 7 } }) });

  const trend = useMemo(
    () => (daily ?? []).map((d) => ({ date: d.label, Gasto: d.spend, Impressões: d.impressions, Cliques: d.clicks })),
    [daily],
  );

  const kpiCards = kpis ? [
    { label: "Contas", value: String(kpis.total_accounts), icon: Users, color: "text-primary", grad: "bg-gradient-to-br from-primary/10 to-primary/5" },
    { label: "Campanhas ativas", value: String(kpis.active_campaigns), icon: PlayCircle, color: "text-success", grad: "bg-gradient-to-br from-success/10 to-success/5" },
    { label: "Campanhas pausadas", value: String(kpis.paused_campaigns), icon: PauseCircle, color: "text-muted-foreground", grad: "bg-gradient-to-br from-muted/50 to-muted/20" },
    { label: "Saldo total", value: `R$ ${kpis.total_balance.toFixed(2)}`, icon: Wallet, color: "text-info", grad: "bg-gradient-to-br from-info/10 to-info/5" },
    { label: "Impressões (7d)", value: kpis.period_impressions.toLocaleString("pt-BR"), icon: Eye, color: "text-info", grad: "bg-gradient-to-br from-info/10 to-info/5" },
    { label: "Cliques (7d)", value: kpis.period_clicks.toLocaleString("pt-BR"), icon: MousePointerClick, color: "text-accent-foreground", grad: "bg-gradient-to-br from-accent/20 to-accent/5" },
    { label: "Alcance (7d)", value: kpis.period_reach.toLocaleString("pt-BR"), icon: Target, color: "text-ig-purple", grad: "bg-gradient-to-br from-ig-purple/10 to-ig-purple/5" },
    { label: "Gasto (7d)", value: `R$ ${kpis.period_spend.toFixed(2)}`, icon: DollarSign, color: "text-success", grad: "bg-gradient-to-br from-success/10 to-success/5" },
    { label: "CTR médio", value: `${kpis.avg_ctr.toFixed(2)}%`, icon: TrendingUp, color: "text-warning-foreground", grad: "bg-gradient-to-br from-warning/10 to-warning/5" },
    { label: "CPC médio", value: `R$ ${kpis.avg_cpc.toFixed(2)}`, icon: Zap, color: "text-destructive", grad: "bg-gradient-to-br from-destructive/10 to-destructive/5" },
  ] : [];

  return (
    <div>
      <PageHeader
        eyebrow="Meta Ads"
        title="Dashboard de campanhas"
        subtitle="Métricas reais dos últimos 7 dias via Meta Graph API"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/settings/meta-ads"><Key className="mr-1 h-4 w-4" /> Credenciais</Link>
            </Button>
            <Button size="sm" disabled={kpiLoading} onClick={() => { refetchKpi(); toast.info("Atualizando…"); }}>
              <RefreshCcw className={`mr-1 h-4 w-4 ${kpiLoading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
          </div>
        }
      />

      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-10">
          {kpiCards.map((k) => (
            <Card key={k.label} className={`p-4 ${k.grad} border-0`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight">{k.value}</div>
            </Card>
          ))}
        </div>

        {kpis && kpis.total_accounts === 0 && (
          <Card className="border-warning/40 bg-warning/5 p-4 text-sm">
            Nenhuma conta de anúncio encontrada com este token. Verifique se o token tem permissão <code>ads_read</code> e se você tem acesso a contas Meta Ads.
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Evolução — Gasto x Cliques</h3>
              <span className="text-xs text-muted-foreground">últimos 7 dias</span>
            </div>
            <div className="h-64">
              {trend.length > 0 ? (
                <ResponsiveContainer>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Gasto" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Cliques" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">Sem dados no período.</div>
              )}
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold">Impressões diárias</h3>
            <div className="h-64">
              {trend.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="Impressões" fill="var(--accent)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-foreground">Sem dados.</div>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Comparação entre contas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2">Conta</th>
                  <th className="pb-2">Business</th>
                  <th className="pb-2 text-right">Gasto (7d)</th>
                  <th className="pb-2 text-right">Impressões</th>
                  <th className="pb-2 text-right">Cliques</th>
                  <th className="pb-2 text-right">CTR</th>
                  <th className="pb-2 text-right">Lifetime</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(comparison ?? []).map((c) => (
                  <tr key={c.account_id}>
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="text-muted-foreground">{c.business_name}</td>
                    <td className="text-right tabular-nums font-semibold">R$ {c.period_spend.toFixed(2)}</td>
                    <td className="text-right tabular-nums">{c.period_impressions.toLocaleString("pt-BR")}</td>
                    <td className="text-right tabular-nums">{c.period_clicks.toLocaleString("pt-BR")}</td>
                    <td className="text-right tabular-nums">{c.avg_ctr.toFixed(2)}%</td>
                    <td className="text-right tabular-nums text-muted-foreground">R$ {c.lifetime_spent.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
                {(!comparison || comparison.length === 0) && (
                  <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Nenhuma conta.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Campanhas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">Conta</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Objetivo</th>
                  <th className="pb-2 text-right">Orçamento</th>
                  <th className="pb-2 text-right">Gasto</th>
                  <th className="pb-2 text-right">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(campaigns ?? []).map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 font-medium">
                      <Link to="/meta-creatives/$campaignId" params={{ campaignId: c.id }} className="hover:text-primary">{c.name}</Link>
                    </td>
                    <td className="text-muted-foreground">{c.ad_account_name}</td>
                    <td>
                      <Badge variant={c.effective_status === "ACTIVE" ? "default" : "secondary"} className={c.effective_status === "ACTIVE" ? "bg-success text-success-foreground" : ""}>
                        {c.effective_status}
                      </Badge>
                    </td>
                    <td className="text-xs text-muted-foreground">{c.objective}</td>
                    <td className="text-right tabular-nums font-semibold">
                      {c.daily_budget
                        ? `R$ ${(c.daily_budget / 100).toFixed(2)}/dia`
                        : c.lifetime_budget
                          ? `R$ ${(c.lifetime_budget / 100).toFixed(2)} total`
                          : "—"}
                    </td>
                    <td className="text-right tabular-nums">{c.insights ? `R$ ${c.insights.spend.toFixed(2)}` : "—"}</td>
                    <td className="text-right tabular-nums">{c.insights ? `${c.insights.ctr.toFixed(2)}%` : "—"}</td>
                  </tr>
                ))}
                {(!campaigns || campaigns.length === 0) && (
                  <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">Nenhuma campanha.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
