import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Plus, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/organizacoes")({
  head: () => ({
    meta: [
      { title: "Agências — InstaBot" },
      { name: "description", content: "Gerencie múltiplas agências, cada uma com suas contas Instagram e Meta Ads isoladas." },
    ],
  }),
  component: OrgsPage,
});

function OrgsPage() {
  const qc = useQueryClient();
  const { data: orgs } = useQuery({ queryKey: ["orgs"], queryFn: () => api.listOrganizations() });
  const activeId = typeof window !== "undefined" ? Number(localStorage.getItem("instabot-org-id") ?? "0") : 0;
  const [form, setForm] = useState({ name: "", slug: "", primary_color: "#321fdb" });

  const create = async () => {
    if (!form.name || !form.slug) return toast.error("Nome e slug são obrigatórios");
    await api.createOrganization(form);
    toast.success("Agência criada");
    setForm({ name: "", slug: "", primary_color: "#321fdb" });
    qc.invalidateQueries({ queryKey: ["orgs"] });
  };

  const activate = async (id: number, name: string) => {
    await api.switchOrganization(id);
    toast.success(`Agência ativa: ${name}`);
    qc.invalidateQueries();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Agência"
        title="Organizações"
        subtitle="Isole clientes, contas Instagram e credenciais Meta por agência"
      />
      <div className="p-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          {orgs?.map((o) => {
            const active = o.id === activeId;
            return (
              <Card key={o.id} className={`flex items-center gap-4 p-4 ${active ? "border-primary ring-2 ring-primary/20" : ""} ${!o.is_active ? "opacity-60" : ""}`}>
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white" style={{ background: o.primary_color }}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">{o.name}</h3>
                    {active && <Badge className="bg-success text-success-foreground text-[10px]">Ativa</Badge>}
                    {!o.is_active && <Badge variant="secondary" className="text-[10px]">arquivada</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">/{o.slug} · criada {formatDateTime(o.created_at)}</div>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    <span>{o.profiles_count} contas IG</span>
                    <span>·</span>
                    <span>{o.meta_accounts_count} contas Meta</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!active && o.is_active && (
                    <Button size="sm" variant="outline" onClick={() => activate(o.id, o.name)}>
                      <Check className="mr-1 h-3.5 w-3.5" /> Ativar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive"
                    onClick={async () => { await api.deleteOrganization(o.id); toast.success("Arquivada"); qc.invalidateQueries({ queryKey: ["orgs"] }); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="space-y-3 p-5 lg:sticky lg:top-20 lg:h-fit">
          <h3 className="text-sm font-semibold">Nova agência</h3>
          <div>
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Loja XYZ" className="mt-1" />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="loja-xyz" className="mt-1" />
          </div>
          <div>
            <Label>Cor primária</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-16 p-1" />
              <Input value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
            </div>
          </div>
          <Button className="w-full" onClick={create}><Plus className="mr-1 h-4 w-4" /> Criar agência</Button>
          <p className="text-[11px] text-muted-foreground">A agência ativa isola dados enviados ao backend via header <code className="rounded bg-muted px-1">X-Org-Id</code>.</p>
        </Card>
      </div>
    </div>
  );
}
