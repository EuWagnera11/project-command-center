import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2, Globe, LogOut, RefreshCw, Plus, Key, FolderOpen, Search, Database, Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { LoginStatus } from "@/lib/types";

export const Route = createFileRoute("/settings/")({
  head: () => ({
    meta: [
      { title: "Configurações — InstaBot" },
      { name: "description", content: "Contas Instagram, pasta de mídia, templates, hashtags e sistema." },
    ],
  }),
  component: SettingsPage,
});

const statusMap: Record<LoginStatus, { label: string; tone: string }> = {
  logged_in: { label: "Conectado", tone: "bg-success/15 text-success border-success/30" },
  logged_out: { label: "Desconectado", tone: "bg-muted text-muted-foreground" },
  failed: { label: "Falhou", tone: "bg-destructive/15 text-destructive border-destructive/30" },
  expired: { label: "Expirado", tone: "bg-warning/15 text-warning-foreground border-warning/40" },
  browser_login: { label: "Aguardando login", tone: "bg-info/15 text-info border-info/30" },
  "2fa_pending": { label: "2FA pendente", tone: "bg-warning/15 text-warning-foreground border-warning/40" },
  checkpoint: { label: "Checkpoint", tone: "bg-destructive/15 text-destructive border-destructive/30" },
  unknown: { label: "Desconhecido", tone: "bg-muted text-muted-foreground" },
};

function SettingsPage() {
  const { data: profiles, refetch: refetchProfiles } = useQuery({ queryKey: ["profiles"], queryFn: () => api.listProfiles() });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: () => api.getSettings() });
  const { data: templates, refetch: refetchTpl } = useQuery({ queryKey: ["templates"], queryFn: () => api.listTemplates() });
  const { data: hashtags, refetch: refetchHash } = useQuery({ queryKey: ["hashtags"], queryFn: () => api.listHashtags() });
  const { data: backups, refetch: refetchBackups } = useQuery({ queryKey: ["backups"], queryFn: () => api.listBackups() });

  const [newProfile, setNewProfile] = useState({ name: "", instagram_username: "" });
  const [mediaFolder, setMediaFolder] = useState("");
  const [tpl, setTpl] = useState({ name: "", tone: "descontraido" as const, content: "" });
  const [hash, setHash] = useState({ name: "", hashtags: "" });

  return (
    <div>
      <PageHeader
        eyebrow="Sistema"
        title="Configurações"
        subtitle="Contas Instagram, mídia, templates e integrações"
        actions={
          <Button size="sm" variant="outline" asChild>
            <Link to="/settings/meta-ads"><Key className="mr-1 h-4 w-4" /> Credenciais Meta</Link>
          </Button>
        }
      />
      <div className="p-6">
        <Tabs defaultValue="profiles" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profiles">Contas Instagram</TabsTrigger>
            <TabsTrigger value="media">Mídia</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
            <TabsTrigger value="backups">Backups</TabsTrigger>
            <TabsTrigger value="system">Sistema</TabsTrigger>
          </TabsList>

          {/* --- Contas IG --- */}
          <TabsContent value="profiles" className="space-y-4">
            <Card className="divide-y">
              {profiles?.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-ig text-sm font-bold text-white">
                    {p.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">@{p.instagram_username}</div>
                  </div>
                  <Badge variant="outline" className={`rounded-full ${statusMap[p.login_status].tone}`}>
                    {statusMap[p.login_status].label}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => toast.info(`Verificando @${p.instagram_username}`)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  {p.login_status === "logged_in" ? (
                    <Button variant="ghost" size="sm" onClick={() => toast.success("Logout")}><LogOut className="h-4 w-4" /></Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => toast.info("Abrindo navegador...")}><Globe className="h-4 w-4" /></Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-destructive"
                    onClick={async () => { await api.deleteProfile(p.id); toast.success("Removido"); refetchProfiles(); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Adicionar nova conta</h3>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <Input placeholder="Nome (ex: Loja Principal)" value={newProfile.name} onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })} />
                <Input placeholder="@username" value={newProfile.instagram_username} onChange={(e) => setNewProfile({ ...newProfile, instagram_username: e.target.value.replace(/^@/, "") })} />
                <Button onClick={async () => {
                  if (!newProfile.name || !newProfile.instagram_username) return toast.error("Preencha ambos os campos");
                  await api.createProfile(newProfile);
                  toast.success("Adicionado");
                  setNewProfile({ name: "", instagram_username: "" });
                  refetchProfiles();
                }}>
                  <Plus className="mr-1 h-4 w-4" /> Adicionar
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* --- Mídia --- */}
          <TabsContent value="media" className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold flex items-center gap-2"><FolderOpen className="h-4 w-4" /> Pasta de mídia local</h3>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                <Input placeholder={settings?.media_folder ?? ""} value={mediaFolder} onChange={(e) => setMediaFolder(e.target.value)} />
                <Button onClick={() => toast.success("Salvo")}>Salvar</Button>
                <Button variant="outline" onClick={() => toast.info("Escaneando...")}>
                  <Search className="mr-1 h-4 w-4" /> Escanear
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Última pasta salva: {settings?.media_folder}</p>
            </Card>
          </TabsContent>

          {/* --- Templates --- */}
          <TabsContent value="templates" className="space-y-4">
            <Card className="divide-y">
              {templates?.map((t) => (
                <div key={t.id} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name}</span>
                      <Badge variant="secondary">{t.tone}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.content}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive"
                    onClick={async () => { await api.deleteTemplate(t.id); refetchTpl(); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </Card>

            <Card className="space-y-3 p-4">
              <h3 className="text-sm font-semibold">Novo template</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Nome" value={tpl.name} onChange={(e) => setTpl({ ...tpl, name: e.target.value })} />
                <Select value={tpl.tone} onValueChange={(v) => setTpl({ ...tpl, tone: v as typeof tpl.tone })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="descontraido">Descontraído</SelectItem>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="engajamento">Engajamento</SelectItem>
                    <SelectItem value="informativo">Informativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea rows={3} placeholder="Conteúdo do template..." value={tpl.content} onChange={(e) => setTpl({ ...tpl, content: e.target.value })} />
              <Button onClick={async () => {
                if (!tpl.name) return;
                await api.createTemplate(tpl);
                toast.success("Template criado");
                setTpl({ name: "", tone: "descontraido", content: "" });
                refetchTpl();
              }}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar template
              </Button>
            </Card>
          </TabsContent>

          {/* --- Hashtags --- */}
          <TabsContent value="hashtags" className="space-y-4">
            <Card className="divide-y">
              {hashtags?.map((h) => (
                <div key={h.id} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{h.name}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{h.hashtags}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-destructive"
                    onClick={async () => { await api.deleteHashtag(h.id); refetchHash(); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </Card>
            <Card className="space-y-3 p-4">
              <h3 className="text-sm font-semibold">Novo grupo</h3>
              <Input placeholder="Nome do grupo" value={hash.name} onChange={(e) => setHash({ ...hash, name: e.target.value })} />
              <Textarea rows={2} placeholder="#tag1 #tag2 #tag3" value={hash.hashtags} onChange={(e) => setHash({ ...hash, hashtags: e.target.value })} />
              <Button onClick={async () => {
                if (!hash.name) return;
                await api.createHashtag(hash);
                toast.success("Grupo criado");
                setHash({ name: "", hashtags: "" });
                refetchHash();
              }}>
                <Plus className="mr-1 h-4 w-4" /> Adicionar grupo
              </Button>
            </Card>
          </TabsContent>

          {/* --- Backups --- */}
          <TabsContent value="backups" className="space-y-4">
            <Card className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2"><Database className="h-4 w-4" /> Backups do banco SQLite</h3>
                  <p className="text-xs text-muted-foreground">Snapshots automáticos diários + criação manual sob demanda.</p>
                </div>
                <Button size="sm" onClick={async () => { await api.createBackup(); toast.success("Backup criado"); refetchBackups(); }}>
                  <Download className="mr-1 h-4 w-4" /> Criar backup agora
                </Button>
              </div>
              <div className="divide-y rounded-md border">
                {backups?.map((b) => (
                  <div key={b.filename} className="flex items-center gap-3 p-3">
                    <Database className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{b.filename}</div>
                      <div className="text-xs text-muted-foreground">{b.created} · {(b.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={async () => { await api.restoreBackup(b.filename); toast.success("Restaurado"); }}>
                      <Upload className="mr-1 h-3.5 w-3.5" /> Restaurar
                    </Button>
                  </div>
                ))}
                {(!backups || backups.length === 0) && (
                  <div className="p-6 text-center text-xs text-muted-foreground">Nenhum backup ainda.</div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* --- Sistema --- */}
          <TabsContent value="system" className="space-y-4">
            <Card className="p-4">
              <h3 className="mb-4 text-sm font-semibold">Agendamento</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Fuso horário</Label>
                  <Input readOnly value={settings?.scheduler_timezone ?? ""} className="mt-1" />
                </div>
                <div>
                  <Label>Delay mínimo entre posts (segundos)</Label>
                  <Input readOnly value={settings?.min_post_delay ?? ""} className="mt-1" />
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Scheduler</h3>
                  <p className="text-xs text-muted-foreground">Controla se o bot processa posts agendados.</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={settings?.scheduler_running ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}>
                    {settings?.scheduler_running ? "Ativo" : "Parado"}
                  </Badge>
                  <Switch checked={settings?.scheduler_running ?? false} />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
