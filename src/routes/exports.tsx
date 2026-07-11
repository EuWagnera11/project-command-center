import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, FileSpreadsheet, FileType, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/exports")({
  head: () => ({ meta: [{ title: "Exports — InstaBot" }, { name: "description", content: "Downloads de relatórios e dados" }] }),
  component: ExportsPage,
});

const formatIcon = { csv: FileSpreadsheet, pdf: FileText, xlsx: FileType } as const;

function ExportsPage() {
  const { data = [], refetch } = useQuery({ queryKey: ["exports"], queryFn: api.listExports });

  const create = async (kind: string, format: string) => {
    await api.createExport(kind, format);
    toast.success(`Export ${kind} (${format}) iniciado`);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Download className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Exports</h1>
            <p className="text-muted-foreground">Baixe relatórios em CSV, PDF ou Excel</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { kind: "posts", label: "Posts", format: "csv" },
          { kind: "meta", label: "Meta Ads", format: "pdf" },
          { kind: "history", label: "Histórico", format: "xlsx" },
          { kind: "audit", label: "Audit Log", format: "csv" },
        ].map(x => (
          <Card key={x.kind} className="cursor-pointer transition hover:border-primary" onClick={() => create(x.kind, x.format)}>
            <CardContent className="flex items-center gap-3 p-4">
              <Plus className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-medium">Gerar {x.label}</div>
                <div className="text-xs uppercase text-muted-foreground">{x.format}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Exports recentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Arquivo</TableHead><TableHead>Tipo</TableHead><TableHead>Formato</TableHead>
              <TableHead>Tamanho</TableHead><TableHead>Gerado</TableHead><TableHead className="text-right">Ação</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.map(e => {
                const Icon = formatIcon[e.format];
                return (
                  <TableRow key={e.id}>
                    <TableCell className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-muted-foreground" />{e.name}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{e.kind}</Badge></TableCell>
                    <TableCell className="uppercase text-xs">{e.format}</TableCell>
                    <TableCell>{e.size_kb} KB</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(e.created_at), { addSuffix: true, locale: ptBR })}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline"><Download className="mr-2 h-3 w-3" />Baixar</Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
