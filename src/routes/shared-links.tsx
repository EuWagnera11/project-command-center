import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link2, Copy, Trash2, Eye, Lock, Clock, Power, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { SharedLinkScope } from "@/lib/types";

export const Route = createFileRoute("/shared-links")({
  head: () => ({
    meta: [
      { title: "Links Compartilháveis — InstaBot" },
      { name: "description", content: "Gere URLs públicas read-only com token, senha e expiração para clientes acompanharem métricas." },
    ],
  }),
  component: SharedLinksPage,
});

function SharedLinksPage() {
  const qc = useQueryClient();
  const { data: links } = useQuery({ queryKey: ["shared-links"], queryFn: () => api.listSharedLinks() });
  const { data: accounts } = useQuery({ queryKey: ["meta-accounts"], queryFn: () => api.metaAccounts() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; scope: SharedLinkScope; scope_id?: string; expires_days?: number; password?: string }>({
    name: "", scope: "overview",
  });

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  };

  const create = async () => {
    if (!form.name) return toast.error("Dê um nome ao link");
    await api.createSharedLink(form);
    toast.success("Link criado");
    setOpen(false);
    setForm({ name: "", scope: "overview" });
    qc.invalidateQueries({ queryKey: ["shared-links"] });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Agência"
        title="Links compartilháveis"
        subtitle="URLs públicas read-only para clientes — com token, senha e expiração"
        actions={<Button size="sm" onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4" /> Novo link</Button>}
      />

      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(links ?? []).map((l) => (
            <Card key={l.id} className={`p-5 ${!l.is_active ? "opacity-60" : ""}`}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" />
                    <h3 className="truncate text-sm font-semibold">{l.name}</h3>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">{l.scope === "overview" ? "Visão geral" : `Conta ${l.scope_id}`}</Badge>
                    {l.view_password && <Badge variant="outline" className="gap-1 text-[10px]"><Lock className="h-2.5 w-2.5" /> senha</Badge>}
                    {l.expires_at && <Badge variant="outline" className="gap-1 text-[10px]"><Clock className="h-2.5 w-2.5" /> {relativeTime(l.expires_at)}</Badge>}
                    <Badge variant={l.is_active ? "default" : "secondary"} className={l.is_active ? "bg-success text-success-foreground text-[10px]" : "text-[10px]"}>
                      {l.is_active ? "ativo" : "pausado"}
                    </Badge>
                  </div>
                </div>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Eye className="h-4 w-4" />
                </div>
              </div>

              <div className="mb-3 flex items-center gap-2 rounded-md bg-muted p-2 text-[11px] font-mono">
                <span className="min-w-0 truncate text-muted-foreground">{l.public_url}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => copy(l.public_url)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-md border p-2">
                  <div className="text-muted-foreground">Views</div>
                  <div className="text-lg font-bold tabular-nums">{l.view_count}</div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-muted-foreground">Último acesso</div>
                  <div className="truncate text-xs font-medium">{l.last_accessed ? relativeTime(l.last_accessed) : "—"}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1" asChild>
                  <a href={`/client/${l.token}`} target="_blank" rel="noreferrer"><ExternalLink className="mr-1 h-3.5 w-3.5" /> Abrir</a>
                </Button>
                <Button size="sm" variant="outline" onClick={async () => { await api.deactivateSharedLink(l.id); qc.invalidateQueries({ queryKey: ["shared-links"] }); }}>
                  <Power className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { await api.deleteSharedLink(l.id); toast.success("Removido"); qc.invalidateQueries({ queryKey: ["shared-links"] }); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {l.created_at && (
                <div className="mt-3 text-[11px] text-muted-foreground">Criado em {formatDateTime(l.created_at)}</div>
              )}
            </Card>
          ))}
        </div>

        {(!links || links.length === 0) && (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            Nenhum link ainda. Clique em "Novo link" para gerar um.
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo link compartilhável</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome interno</Label>
              <Input placeholder="Ex: Cliente ACME — Relatório Mensal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Escopo</Label>
              <Select value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v as SharedLinkScope })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Visão geral (tudo)</SelectItem>
                  <SelectItem value="meta_account">Conta Meta específica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.scope === "meta_account" && (
              <div>
                <Label>Conta</Label>
                <Select value={form.scope_id} onValueChange={(v) => setForm({ ...form, scope_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Escolha uma conta" /></SelectTrigger>
                  <SelectContent>{accounts?.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Expira em (dias)</Label>
                <Input type="number" placeholder="Sem expiração" value={form.expires_days ?? ""} onChange={(e) => setForm({ ...form, expires_days: e.target.value ? +e.target.value : undefined })} className="mt-1" />
              </div>
              <div>
                <Label>Senha (opcional)</Label>
                <Input placeholder="Ex: 1234" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value || undefined })} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={create}><Plus className="mr-1 h-4 w-4" /> Gerar link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
