import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eye, MousePointerClick, DollarSign, TrendingUp, Zap, Save, RefreshCcw } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend,
} from "recharts";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/settings/meta-ads")({
  head: () => ({
    meta: [
      { title: "Meta Ads — InstaBot" },
      { name: "description", content: "KPIs de campanhas, evolução diária e configuração de credenciais." },
    ],
  }),
  component: MetaAdsPage,
});

function MetaAdsPage() {
  const [creds, setCreds] = useState({ access_token: "", ad_account_id: "" });
  const { data: kpis } = useQuery({ queryKey: ["meta-kpis"], queryFn: () => api.getMetaKPIs() });
  const { data: campaigns } = useQuery({ queryKey: ["meta-camps"], queryFn: () => api.getMetaCampaigns() });
  const { data: daily } = useQuery({ queryKey: ["meta-daily"], queryFn: () => api.getMetaDaily() });

  const trend = useMemo(() => (daily ?? []).map((d) => ({
    date: d.date.slice(5),
    Gasto: d.spend,
    Impressões: d.impressions / 100,
    Cliques: d.clicks,
  })), [daily]);

  const kpiCards = kpis ? [
    { label: "Impressões", value: kpis.impressions.toLocaleString("pt-BR"), icon: Eye, color: "text-info" },
    { label: "Cliques", value: kpis.clicks.toLocaleString("pt-BR"), icon: MousePointerClick, color: "text-primary" },
    { label: "Gasto", value: `R$ ${kpis.spend.toFixed(2)}`, icon: DollarSign, color: "text-success" },
    { label: "CTR", value: `${kpis.ctr.toFixed(2)}%`, icon: TrendingUp, color: "text-warning-foreground" },
    { label: "CPC", value: `R$ ${kpis.cpc.toFixed(2)}`, icon: Zap, color: "text-accent" },
  ] : [];

  return (
    <div>
      <PageHeader
        eyebrow="Meta Ads"
        title="Dashboard de campanhas"
        subtitle="Métricas em tempo real das suas campanhas"
        actions={
          <Button variant="outline" size="sm" onClick={() => toast.info("Atualizando")}>
            <RefreshCcw className="mr-1 h-4 w-4" /> Atualizar
          </Button>
        }
      />
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {kpiCards.map((k) => (
            <Card key={k.label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</span>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div className="mt-2 text-2xl font-bold">{k.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Evolução (últimos 7 dias)</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Gasto" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="Cliques" stroke="hsl(var(--success))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Impressões diárias</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="Impressões" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Campanhas ativas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2">Campanha</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Impressões</th>
                  <th className="pb-2 text-right">Cliques</th>
                  <th className="pb-2 text-right">CTR</th>
                  <th className="pb-2 text-right">Gasto</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {campaigns?.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 font-medium">{c.name}</td>
                    <td><Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge></td>
                    <td className="text-right tabular-nums">{c.impressions.toLocaleString("pt-BR")}</td>
                    <td className="text-right tabular-nums">{c.clicks.toLocaleString("pt-BR")}</td>
                    <td className="text-right tabular-nums">{c.ctr.toFixed(2)}%</td>
                    <td className="text-right tabular-nums font-semibold">R$ {c.spend.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-1 text-sm font-semibold">Credenciais Meta</h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Configure token e ID de conta para o backend Flask consumir a Meta Graph API.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Access Token</Label>
              <Input type="password" placeholder="EAAG..." value={creds.access_token} onChange={(e) => setCreds({ ...creds, access_token: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Ad Account ID</Label>
              <Input placeholder="act_123456" value={creds.ad_account_id} onChange={(e) => setCreds({ ...creds, ad_account_id: e.target.value })} className="mt-1" />
            </div>
          </div>
          <Button className="mt-4" onClick={() => toast.success("Credenciais salvas")}>
            <Save className="mr-1 h-4 w-4" /> Salvar
          </Button>
        </Card>
      </div>
    </div>
  );
}
