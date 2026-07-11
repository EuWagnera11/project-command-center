import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bot, Sparkles, Check, X, MessageSquare, TrendingUp, AlertTriangle, CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { AIAction, AISeverity, AIAnalysis, MetaCampaign } from "@/lib/types";

export const Route = createFileRoute("/ai-manager")({
  head: () => ({
    meta: [
      { title: "IA Campaign Manager — InstaBot" },
      { name: "description", content: "IA analisa campanhas Meta Ads e sugere melhorias com aprovação humana." },
    ],
  }),
  component: AIManagerPage,
});

const severityMeta: Record<AISeverity, { icon: typeof AlertTriangle; label: string; className: string }> = {
  high: { icon: AlertTriangle, label: "Crítico", className: "border-destructive/40 bg-destructive/10 text-destructive" },
  info: { icon: TrendingUp, label: "Sugestão", className: "border-info/40 bg-info/10 text-info" },
  ok: { icon: CheckCircle2, label: "Saudável", className: "border-success/40 bg-success/10 text-success" },
};

function AIManagerPage() {
  const qc = useQueryClient();
  const { data: campaigns } = useQuery({ queryKey: ["ai-campaigns"], queryFn: () => api.metaCampaigns() });
  const { data: actions } = useQuery({ queryKey: ["ai-actions"], queryFn: () => api.listAIActions() });
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [rejectFor, setRejectFor] = useState<AIAction | null>(null);
  const [reason, setReason] = useState("");
  const [feedbackFor, setFeedbackFor] = useState<AIAction | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const analyzeMut = useMutation({
    mutationFn: (id: string) => api.analyzeCampaign(id),
    onSuccess: (data) => { setAnalysis(data); toast.success("Análise gerada"); },
  });
  const approveMut = useMutation({
    mutationFn: (id: number) => api.approveAIAction(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-actions"] }); toast.success("Ação aprovada e executada"); },
  });
  const rejectMut = useMutation({
    mutationFn: () => api.rejectAIAction(rejectFor!.id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-actions"] }); toast.success("Ação rejeitada"); setRejectFor(null); setReason(""); },
  });
  const feedbackMut = useMutation({
    mutationFn: () => api.feedbackAIAction(feedbackFor!.id, rating, comment),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ai-actions"] }); toast.success("Feedback registrado — a IA está aprendendo"); setFeedbackFor(null); setRating(0); setComment(""); },
  });

  const pending = (actions ?? []).filter((a) => a.status === "pending");
  const history = (actions ?? []).filter((a) => a.status !== "pending");

  return (
    <div>
      <PageHeader eyebrow="Automação" title="🤖 IA Campaign Manager" subtitle="Análise e execução de melhorias com aprovação humana" />

      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Campanhas</h3>
            <div className="space-y-2">
              {(campaigns ?? []).map((c: MetaCampaign) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border bg-card/50 p-4">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.ad_account_name} · {c.status}</div>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => analyzeMut.mutate(c.id)} disabled={analyzeMut.isPending}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analisar
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {analysis && (
            <Card className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-primary">Análise IA</div>
                  <h3 className="text-lg font-bold">{analysis.campaign_name}</h3>
                </div>
                <Badge variant="outline">{new Date(analysis.analyzed_at).toLocaleTimeString("pt-BR")}</Badge>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Metric label="Gasto" value={`R$ ${analysis.metrics.spend.toFixed(2)}`} />
                <Metric label="Impressões" value={analysis.metrics.impressions.toLocaleString("pt-BR")} />
                <Metric label="Cliques" value={analysis.metrics.clicks.toLocaleString("pt-BR")} />
                <Metric label="CTR" value={`${analysis.metrics.ctr}%`} />
                <Metric label="CPC" value={`R$ ${analysis.metrics.cpc}`} />
              </div>

              <div className="space-y-3">
                {analysis.suggestions.map((s, i) => {
                  const meta = severityMeta[s.severity];
                  const Icon = meta.icon;
                  return (
                    <div key={i} className={`rounded-lg border-l-4 p-4 ${meta.className}`}>
                      <div className="flex items-center gap-2 font-semibold">
                        <Icon className="h-4 w-4" />
                        {s.title}
                        <Badge variant="outline" className="ml-auto">{meta.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm opacity-90">{s.body}</p>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold">Histórico de ações</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2">Campanha</th>
                    <th>Ação</th>
                    <th>Status</th>
                    <th>Feedback</th>
                    <th className="text-right">Quando</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {history.map((a) => (
                    <tr key={a.id}>
                      <td className="py-2 pr-2">{a.campaign_name}</td>
                      <td className="pr-2 text-xs text-muted-foreground">{a.description}</td>
                      <td><StatusBadge status={a.status} /></td>
                      <td>{a.feedback ? "⭐".repeat(a.feedback.rating) : "—"}</td>
                      <td className="text-right text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">Sem histórico ainda</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Ações pendentes</h3>
              <Badge className="ml-auto">{pending.length}</Badge>
            </div>
            <div className="space-y-3">
              {pending.map((a) => {
                const meta = severityMeta[a.severity];
                return (
                  <div key={a.id} className={`rounded-lg border-l-4 p-3 ${meta.className}`}>
                    <div className="text-sm font-medium">{a.campaign_name}</div>
                    <p className="mt-1 text-xs opacity-90">{a.description}</p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => approveMut.mutate(a.id)}>
                        <Check className="mr-1 h-3.5 w-3.5" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectFor(a)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setFeedbackFor(a)}>
                        <MessageSquare className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {pending.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  Nenhuma ação pendente. Analise uma campanha para gerar sugestões.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Reject dialog */}
      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejeitar sugestão</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{rejectFor?.description}</p>
            <Textarea placeholder="Por que você está rejeitando? (opcional, ajuda a IA aprender)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => rejectMut.mutate()}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feedback dialog */}
      <Dialog open={!!feedbackFor} onOpenChange={(o) => !o && setFeedbackFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Feedback para a IA</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{feedbackFor?.description}</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                  <Star className={`h-6 w-6 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
            </div>
            <Textarea placeholder="Comentário (opcional)" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackFor(null)}>Cancelar</Button>
            <Button onClick={() => feedbackMut.mutate()} disabled={rating === 0}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: AIAction["status"] }) {
  const map = {
    pending: { label: "Pendente", cls: "bg-warning/15 text-warning-foreground border-warning/40" },
    approved: { label: "Aprovada", cls: "bg-info/15 text-info border-info/40" },
    executed: { label: "Executada", cls: "bg-success/15 text-success border-success/40" },
    rejected: { label: "Rejeitada", cls: "bg-destructive/15 text-destructive border-destructive/40" },
  } as const;
  const m = map[status];
  return <Badge variant="outline" className={m.cls}>{m.label}</Badge>;
}
