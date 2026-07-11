import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, Download, Search } from "lucide-react";
import { downloadCSV } from "@/lib/export";

export const Route = createFileRoute("/audit")({
  head: () => ({ meta: [{ title: "Audit Logs — InstaBot" }, { name: "description", content: "Registros de todas as ações executadas no InstaBot." }] }),
  component: AuditPage,
});

function AuditPage() {
  const list = useQuery({ queryKey: ["audit"], queryFn: api.listAuditLogs });
  const [q, setQ] = useState("");
  const [actor, setActor] = useState<string>("all");

  const actors = useMemo(() => Array.from(new Set((list.data ?? []).map((l) => l.actor))), [list.data]);
  const rows = (list.data ?? []).filter((l) =>
    (actor === "all" || l.actor === actor) &&
    (!q || l.action.includes(q) || l.target_id.includes(q))
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><ShieldCheck className="h-6 w-6 text-primary" /> Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Trilha de auditoria — quem fez, o quê e quando.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => list.data && downloadCSV("audit-logs.csv", list.data)}>
          <Download className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por ação ou alvo" className="pl-9" />
          </div>
          <Select value={actor} onValueChange={setActor}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os atores</SelectItem>
              {actors.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <CardTitle className="ml-auto text-xs font-normal text-muted-foreground">{rows.length} registros</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Ator</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Meta</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell><Badge variant={l.actor === "IA" ? "default" : "outline"}>{l.actor}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{l.action}</TableCell>
                  <TableCell className="text-xs">{l.target_type}#{l.target_id}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{l.meta ? JSON.stringify(l.meta) : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.ip ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
