import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { RoleName } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/roles")({
  head: () => ({ meta: [{ title: "Roles & Times — InstaBot" }, { name: "description", content: "Gerencie membros e permissões" }] }),
  component: RolesPage,
});

const roleColors: Record<RoleName, string> = {
  owner: "bg-primary/15 text-primary border-primary/30",
  admin: "bg-info/15 text-info border-info/30",
  editor: "bg-success/15 text-success border-success/30",
  viewer: "bg-muted text-muted-foreground border-border",
};

function RolesPage() {
  const qc = useQueryClient();
  const { data: members = [] } = useQuery({ queryKey: ["role-members"], queryFn: api.roleMembers });
  const { data: roles = [] } = useQuery({ queryKey: ["role-defs"], queryFn: api.roleDefinitions });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Roles & Times</h1>
          <p className="text-muted-foreground">{members.length} membros · {roles.length} papéis</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roles.map(r => (
          <Card key={r.name}>
            <CardHeader className="pb-3"><CardTitle className="text-base"><Badge variant="outline" className={roleColors[r.name]}>{r.label}</Badge></CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {r.permissions.map(p => <li key={p} className="flex items-start gap-2"><Check className="mt-0.5 h-3 w-3 text-success shrink-0" /><span>{p}</span></li>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Membros do time</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Membro</TableHead><TableHead>Email</TableHead><TableHead>Papel</TableHead><TableHead>Último acesso</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {members.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary uppercase">{m.name.slice(0, 2)}</div>
                    <div className="font-medium">{m.name}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                  <TableCell>
                    <Select defaultValue={m.role} onValueChange={async (v) => {
                      await api.updateMemberRole(m.id, v);
                      toast.success(`${m.name} agora é ${v}`);
                      qc.invalidateQueries({ queryKey: ["role-members"] });
                    }} disabled={m.role === "owner"}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r.name} value={r.name}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.last_seen ? formatDistanceToNow(new Date(m.last_seen), { addSuffix: true, locale: ptBR }) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
