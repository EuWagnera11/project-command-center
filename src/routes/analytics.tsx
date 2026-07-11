import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, TrendingUp } from "lucide-react";
import { downloadCSV, printPDF } from "@/lib/export";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart,
} from "recharts";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "Analytics — InstaBot" }, { name: "description", content: "Heatmap de engajamento, top posts e curva de crescimento." }] }),
  component: AnalyticsPage,
});

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function AnalyticsPage() {
  const heatmap = useQuery({ queryKey: ["analytics", "heatmap"], queryFn: api.analyticsHeatmap });
  const top = useQuery({ queryKey: ["analytics", "top"], queryFn: api.analyticsTopPosts });
  const growth = useQuery({ queryKey: ["analytics", "growth"], queryFn: api.analyticsGrowth });

  const cell = (day: number, hour: number) => heatmap.data?.find((c) => c.day === day && c.hour === hour)?.score ?? 0;
  const color = (score: number) => {
    const alpha = score / 100;
    return `hsl(var(--primary) / ${0.08 + alpha * 0.85})`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">Heatmap, top posts e crescimento — últimos 30 dias.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => top.data && downloadCSV("top-posts.csv", top.data)}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={printPDF}>
            <Printer className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">Heatmap de engajamento (dia × hora)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[40px_repeat(24,minmax(0,1fr))] gap-1 text-[10px]">
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-center text-muted-foreground">{h}</div>
              ))}
              {DAYS.map((label, d) => (
                <div key={d} className="contents">
                  <div className="flex items-center justify-end pr-2 text-muted-foreground">{label}</div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const s = cell(d, h);
                    return (
                      <div
                        key={h}
                        className="aspect-square rounded-sm border border-border/40"
                        style={{ background: color(s) }}
                        title={`${label} ${h}h — score ${s}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Baixo</span>
              <div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(to right, hsl(var(--primary)/0.08), hsl(var(--primary)/0.93))" }} />
              <span>Alto</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Crescimento de seguidores</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth.data ?? []}>
                <defs>
                  <linearGradient id="gfoll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Area type="monotone" dataKey="followers" stroke="hsl(var(--primary))" fill="url(#gfoll)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Engajamento médio (%)</CardTitle></CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growth.data ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
                <Line type="monotone" dataKey="engagement" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Top posts</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Post</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Curtidas</TableHead>
                <TableHead className="text-right">Comentários</TableHead>
                <TableHead className="text-right">Alcance</TableHead>
                <TableHead className="text-right">Eng. %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(top.data ?? []).map((r) => (
                <TableRow key={r.post_id}>
                  <TableCell className="max-w-[280px] truncate">{r.caption}</TableCell>
                  <TableCell>{r.profile_name}</TableCell>
                  <TableCell><Badge variant="outline">{r.post_type}</Badge></TableCell>
                  <TableCell className="text-right">{r.likes.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right">{r.comments}</TableCell>
                  <TableCell className="text-right">{r.reach.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right font-semibold">{r.engagement_rate.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
