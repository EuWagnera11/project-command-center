import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldCheck, KeyRound, Users, Ticket, ExternalLink, Trash2, Ban, Circle,
} from "lucide-react";

import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/idp")({
  head: () => ({
    meta: [
      { title: "IdP OAuth2 — InstaBot" },
      { name: "description", content: "Servidor OAuth2 / OpenID próprio do InstaBot para integrações com Canva, Zapier e CLI." },
    ],
  }),
  component: IdPPage,
});

function IdPPage() {
  const qc = useQueryClient();
  const status = useQuery({ queryKey: ["idp-status"], queryFn: api.idpStatus });
  const clients = useQuery({ queryKey: ["idp-clients"], queryFn: api.idpClients });
  const users = useQuery({ queryKey: ["idp-users"], queryFn: api.idpUsers });
  const tokens = useQuery({ queryKey: ["idp-tokens"], queryFn: api.idpTokens });

  const toggle = useMutation({
    mutationFn: (v: { id: number; is_active: boolean }) => api.idpToggleClient(v.id, v.is_active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["idp-clients"] }); toast.success("Cliente atualizado"); },
  });
  const removeClient = useMutation({
    mutationFn: (id: number) => api.idpDeleteClient(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["idp-clients"] }); toast.success("Cliente removido"); },
  });
  const revoke = useMutation({
    mutationFn: (id: number) => api.idpRevokeToken(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["idp-tokens"] }); toast.success("Token revogado"); },
  });

  const s = status.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ShieldCheck className="h-6 w-6 text-primary" /> IdP OAuth2
        </h1>
        <p className="text-sm text-muted-foreground">
          Servidor de identidade próprio do InstaBot — sem Google/Auth0. Gerencie clientes, usuários e tokens.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Status</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={s?.enabled ? "default" : "outline"} className="gap-1.5">
              <Circle className={`h-2 w-2 ${s?.enabled ? "fill-success text-success" : "fill-muted-foreground text-muted-foreground"}`} />
              {s?.enabled ? "Ativo" : "Desativado"}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Clientes</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{s?.clients_count ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Usuários</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{s?.users_count ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Tokens ativos</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{s?.active_tokens ?? 0}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Endpoints públicos</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-xs md:grid-cols-2">
          {[
            { label: "Issuer", url: s?.issuer },
            { label: "Authorize", url: s?.authorize_url },
            { label: "Token", url: s?.token_url },
            { label: "JWKS", url: s?.jwks_url },
          ].map((e) => (
            <a key={e.label} href={e.url} target="_blank" rel="noreferrer"
              className="flex items-center justify-between rounded border bg-muted/30 px-3 py-2 hover:bg-muted/50">
              <div>
                <div className="font-medium">{e.label}</div>
                <div className="font-mono text-[11px] text-muted-foreground">{e.url}</div>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          ))}
        </CardContent>
      </Card>

      <Tabs defaultValue="clients">
        <TabsList>
          <TabsTrigger value="clients"><KeyRound className="mr-2 h-4 w-4" /> Clientes</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> Usuários</TabsTrigger>
          <TabsTrigger value="tokens"><Ticket className="mr-2 h-4 w-4" /> Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="clients">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-left">Client ID</th>
                    <th className="px-4 py-2 text-left">Redirect</th>
                    <th className="px-4 py-2 text-left">Scopes</th>
                    <th className="px-4 py-2 text-left">Ativo</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {(clients.data ?? []).map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-xs">{c.client_id}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{c.redirect_uris[0]}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.scopes.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Switch checked={c.is_active}
                          onCheckedChange={(v) => toggle.mutate({ id: c.id, is_active: v })} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => removeClient.mutate(c.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Username</th>
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-left">Papel</th>
                    <th className="px-4 py-2 text-left">Criado</th>
                  </tr>
                </thead>
                <tbody>
                  {(users.data ?? []).map((u) => (
                    <tr key={u.username} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono">{u.username}</td>
                      <td className="px-4 py-3">{u.display_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.is_admin ? "default" : "outline"}>{u.is_admin ? "admin" : "user"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">
            Usuários de teste padrão: <span className="font-mono">wagner / instabot2026</span> · <span className="font-mono">demo / demo</span>
          </p>
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 text-left">Cliente</th>
                    <th className="px-4 py-2 text-left">Usuário</th>
                    <th className="px-4 py-2 text-left">Scopes</th>
                    <th className="px-4 py-2 text-left">Emitido</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {(tokens.data ?? []).map((t) => (
                    <tr key={t.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{t.client_id}</td>
                      <td className="px-4 py-3 font-mono text-xs">{t.username}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {t.scopes.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(t.issued_at).toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3">
                        {t.revoked
                          ? <Badge variant="outline" className="text-destructive">revogado</Badge>
                          : <Badge>ativo</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" disabled={t.revoked}
                          onClick={() => revoke.mutate(t.id)}>
                          <Ban className="mr-1 h-3.5 w-3.5" /> Revogar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
