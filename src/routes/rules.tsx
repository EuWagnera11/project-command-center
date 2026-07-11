import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { AutomationRule, AutomationMetric, AutomationOperator, AutomationWindow, AutomationActionKind } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Workflow, Zap } from "lucide-react";

export const Route = createFileRoute("/rules")({
  head: () => ({ meta: [{ title: "Automações — InstaBot" }, { name: "description", content: "Regras se-então para campanhas e posts." }] }),
  component: RulesPage,
});

const actionLabel: Record<AutomationActionKind, string> = {
  pause_campaign: "Pausar campanha",
  resume_campaign: "Retomar campanha",
  notify: "Notificar",
  scale_budget: "Escalar budget +25%",
  reduce_budget: "Reduzir budget -20%",
};

function RulesPage() {
  const qc = useQueryClient();
  const rules = useQuery({ queryKey: ["rules"], queryFn: api.listRules });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", metric: "ctr" as AutomationMetric, operator: "<" as AutomationOperator,
    threshold: 0.4, time_window: "24h" as AutomationWindow, action: "pause_campaign" as AutomationActionKind,
  });

  const toggle = useMutation({
    mutationFn: (r: AutomationRule) => api.toggleRule(r.id, !r.is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rules"] }); toast.success("Regra atualizada"); },
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteRule(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["rules"] }); toast.success("Regra removida"); },
  });
  const create = useMutation({
    mutationFn: () => api.createRule({
      name: form.name, description: form.description, scope: "campaign", scope_id: "*",
      metric: form.metric, operator: form.operator, threshold: form.threshold,
      time_window: form.time_window, action: form.action, is_active: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rules"] });
      toast.success("Regra criada");
      setOpen(false);
      setForm({ ...form, name: "", description: "" });
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Workflow className="h-6 w-6 text-primary" /> Automações</h1>
          <p className="text-sm text-muted-foreground">Regras se-então executadas pelo InstaBot em tempo real.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Nova regra</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova regra de automação</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Pausar CTR baixo" /></div>
              <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="O que essa regra faz" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Métrica</Label>
                  <Select value={form.metric} onValueChange={(v) => setForm({ ...form, metric: v as AutomationMetric })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(["ctr", "cpc", "spend", "engagement"] as AutomationMetric[]).map((m) => <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Operador</Label>
                  <Select value={form.operator} onValueChange={(v) => setForm({ ...form, operator: v as AutomationOperator })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(["<", ">", "==", "<=", ">="] as AutomationOperator[]).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Threshold</Label><Input type="number" step="0.1" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Janela</Label>
                  <Select value={form.time_window} onValueChange={(v) => setForm({ ...form, time_window: v as AutomationWindow })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(["24h", "48h", "7d"] as AutomationWindow[]).map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Ação</Label>
                  <Select value={form.action} onValueChange={(v) => setForm({ ...form, action: v as AutomationActionKind })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(actionLabel) as AutomationActionKind[]).map((a) => <SelectItem key={a} value={a}>{actionLabel[a]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => create.mutate()} disabled={!form.name}>Criar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4">
        {(rules.data ?? []).map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
              <div className="min-w-0">
                <CardTitle className="text-base">{r.name}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="gap-1"><Zap className="h-3 w-3" /> {r.trigger_count}× disparos</Badge>
                <Switch checked={r.is_active} onCheckedChange={() => toggle.mutate(r)} />
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">SE {r.metric.toUpperCase()} {r.operator} {r.threshold}</Badge>
              <Badge variant="secondary">janela {r.time_window}</Badge>
              <Badge>ENTÃO {actionLabel[r.action]}</Badge>
              {r.last_triggered_at && <span className="text-muted-foreground">último: {new Date(r.last_triggered_at).toLocaleString("pt-BR")}</span>}
              <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => remove.mutate(r.id)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
