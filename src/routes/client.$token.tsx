import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Eye, MousePointerClick, DollarSign, TrendingUp, Zap, Users, Instagram, ShieldCheck } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar,
} from "recharts";

import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/client/$token")({
  head: ({ params }) => ({
    meta: [
      { title: `Relatório do cliente — ${params.token.slice(0, 6)}…` },
      { name: "description", content: "Dashboard read-only compartilhado — métricas de campanhas Meta Ads." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: ({ params }) => {
    if (!params.token || params.token.length < 8) throw notFound();
  },
  component: ClientView,
});

function ClientView() {
  const { token } = Route.useParams();
  const { data } = useQuery({ queryKey: ["client", token], queryFn: () => api.getClientDashboard(token) });

  if (!data) {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Carregando relatório…</div>;
  }

  const kpi = data.kpi;
  const primary = data.organization.primary_color;

  const cards = [
    { label: "Impressões", value: kpi.period_impressions.toLocaleString("pt-BR"), icon: Eye },
    { label: "Cliques", value: kpi.period_clicks.toLocaleString("pt-BR"), icon: MousePointerClick },
    { label: "Alcance", value: kpi.period_reach.toLocaleString("pt-BR"), icon: Users },
    { label: "Gasto", value: `R$ ${kpi.period_spend.toFixed(2)}`, icon: DollarSign },
    { label: "CTR médio", value: `${kpi.avg_ctr.toFixed(2)}%`, icon: TrendingUp },
    { label: "CPC médio", value: `R$ ${kpi.avg_cpc.toFixed(2)}`, icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)` }}>
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-8">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15 backdrop-blur">
            <Instagram className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-widest opacity-80">Relatório do cliente</div>
            <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">{data.organization.name}</h1>
            <div className="text-xs opacity-80">Gerado em {new Date(data.generated_at).toLocaleString("pt-BR")}</div>
          </div>
          <Badge className="hidden gap-1 bg-white/20 text-white sm:flex"><ShieldCheck className="h-3 w-3" /> read-only</Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {cards.map((c) => (
            <Card key={c.label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{c.label}</span>
                <c.icon className="h-4 w-4" style={{ color: primary }} />
              </div>
              <div className="mt-2 text-2xl font-black tabular-nums">{c.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3">
            <h3 className="mb-4 text-sm font-semibold">Gasto diário (7d)</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={data.timeseries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="spend" stroke={primary} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold">Impressões vs cliques</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={data.timeseries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="impressions" fill={primary} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="clicks" fill={`${primary}88`} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Campanhas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Objetivo</th>
                  <th className="pb-2 text-right">Orçamento</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 font-medium">{c.name}</td>
                    <td><Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge></td>
                    <td className="text-xs text-muted-foreground">{c.objective}</td>
                    <td className="text-right tabular-nums">
                      {c.daily_budget ? `R$ ${(c.daily_budget / 100).toFixed(2)}/dia` : c.lifetime_budget ? `R$ ${(c.lifetime_budget / 100).toFixed(2)} total` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <footer className="pt-4 text-center text-xs text-muted-foreground">
          Powered by InstaBot · {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}
