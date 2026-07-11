import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, CheckCheck } from "lucide-react";
import { InstagramPreview } from "@/components/instagram-preview";

export const Route = createFileRoute("/approvals")({
  head: () => ({ meta: [{ title: "Aprovações — InstaBot" }, { name: "description", content: "Fila de aprovação de posts sugeridos pela IA." }] }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["approvals"], queryFn: api.listApprovals });
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const decide = useMutation({
    mutationFn: (v: { id: number; status: "approved" | "rejected"; reason?: string }) => api.decideApproval(v.id, v.status, v.reason),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      toast.success(v.status === "approved" ? "Post aprovado" : "Post rejeitado");
      setRejectId(null); setReason("");
    },
  });

  const rows = (list.data ?? []).filter((r) => filter === "all" || r.status === filter);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><CheckCheck className="h-6 w-6 text-primary" /> Fila de Aprovação</h1>
        <p className="text-sm text-muted-foreground">Posts sugeridos pela IA aguardando revisão humana.</p>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Post #{r.post_id}</CardTitle>
              <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                {r.status === "pending" ? "Pendente" : r.status === "approved" ? "Aprovado" : "Rejeitado"}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3">
              <InstagramPreview
                imageUrl={r.post.media_path ? `https://picsum.photos/seed/post-${r.post_id}/600/600` : `https://picsum.photos/seed/post-${r.post_id}/600/600`}
                caption={r.post.caption}
                username={r.post.profile_username ?? "instabot"}
              />
              <div className="text-xs text-muted-foreground">
                Solicitado por <strong>{r.requested_by}</strong> · {new Date(r.requested_at).toLocaleString("pt-BR")}
              </div>
              {r.rejection_reason && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs">Motivo: {r.rejection_reason}</div>}
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => decide.mutate({ id: r.id, status: "approved" })}>
                    <Check className="mr-2 h-4 w-4" /> Aprovar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setRejectId(r.id)}>
                    <X className="mr-2 h-4 w-4" /> Rejeitar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum item.</div>}
      </div>

      <Dialog open={rejectId !== null} onOpenChange={(o) => !o && setRejectId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Motivo da rejeição</DialogTitle></DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explique por que o post foi rejeitado" rows={4} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectId(null)}>Cancelar</Button>
            <Button onClick={() => rejectId && decide.mutate({ id: rejectId, status: "rejected", reason })} disabled={!reason}>Rejeitar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
