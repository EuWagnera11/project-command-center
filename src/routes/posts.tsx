import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, X, Pencil, Eye, PlusCircle, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { PostTypeBadge, StatusBadge } from "./index";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { formatDateTime, relativeTime } from "@/lib/format";
import type { Post, PostStatus } from "@/lib/types";

export const Route = createFileRoute("/posts")({
  head: () => ({
    meta: [
      { title: "Posts — InstaBot" },
      { name: "description", content: "Gerencie, edite e agende suas publicações do Instagram." },
    ],
  }),
  component: PostsPage,
});

type Filter = "all" | PostStatus;

function PostsPage() {
  const { data: posts, isLoading } = useQuery({ queryKey: ["posts"], queryFn: () => api.listPosts() });
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Post | null>(null);

  const counts = {
    all: posts?.length ?? 0,
    pending: posts?.filter((p) => p.status === "pending").length ?? 0,
    published: posts?.filter((p) => p.status === "published").length ?? 0,
    failed: posts?.filter((p) => p.status === "failed").length ?? 0,
  };
  const filtered = (posts ?? []).filter((p) => filter === "all" || p.status === filter);

  const pills: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Todos", count: counts.all },
    { key: "pending", label: "Agendados", count: counts.pending },
    { key: "published", label: "Publicados", count: counts.published },
    { key: "failed", label: "Falhas", count: counts.failed },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Publicações"
        title="Gerenciamento de Posts"
        subtitle="Visualize, edite e gerencie todas as publicações"
        actions={
          <>
            <Button variant="outline" size="sm"><Eye className="mr-1 h-4 w-4" /> Preview do feed</Button>
            <Button size="sm"><PlusCircle className="mr-1 h-4 w-4" /> Novo post</Button>
          </>
        }
      />

      <div className="p-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {pills.map((p) => {
            const active = filter === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setFilter(p.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "border bg-card hover:bg-muted"
                }`}
              >
                {p.label} <span className={`ml-1 rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-muted text-muted-foreground"}`}>{p.count}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center text-sm text-muted-foreground">Nada por aqui ainda.</Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <Card key={p.id} className={`overflow-hidden border-l-4 p-4 transition hover:shadow-md ${statusBorder(p.status)}`}>
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-gradient-ig text-lg text-white">
                    {p.post_type === "reel" ? "🎬" : p.post_type === "carousel" ? "🖼" : p.post_type === "story" ? "⭕" : "📷"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <PostTypeBadge type={p.post_type} />
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">@{p.instagram_username}</div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm">{p.caption}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(p.scheduled_at)} · {relativeTime(p.scheduled_at)}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    {p.status === "pending" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast.success(`#${p.id} publicando`)}><Play className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => toast.error(`#${p.id} cancelado`)}><X className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EditPostDialog post={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function statusBorder(s: PostStatus) {
  return s === "published" ? "border-l-success" : s === "failed" ? "border-l-destructive" : s === "publishing" ? "border-l-info" : "border-l-warning";
}

function EditPostDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const [caption, setCaption] = useState(post?.caption ?? "");
  return (
    <Dialog open={!!post} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar post {post ? `#${post.id}` : ""}</DialogTitle>
          <DialogDescription>Atualize a legenda, o horário ou o tipo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Legenda</Label>
            <Textarea rows={5} value={caption} onChange={(e) => setCaption(e.target.value)} className="mt-1" />
            <Button size="sm" variant="outline" className="mt-2" onClick={() => toast.info("Regenerando com IA...")}>
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Regenerar com IA
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input type="datetime-local" defaultValue={post?.scheduled_at.slice(0, 16)} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input readOnly value={post?.post_type ?? ""} />
            </div>
          </div>
        </div>
        <DialogFooter className="justify-between sm:justify-between">
          <Button variant="destructive" size="sm" onClick={() => { toast.error("Deletado"); onClose(); }}>
            <Trash2 className="mr-1 h-4 w-4" /> Deletar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => { toast.success("Post atualizado"); onClose(); }}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Re-export badges so other pages can reuse (already exported from index)
export { Badge };
