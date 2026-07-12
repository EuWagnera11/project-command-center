import { Badge } from "@/components/ui/badge";
import type { PostStatus, PostType } from "@/lib/types";

export function PostTypeBadge({ type }: { type: PostType }) {
  const map: Record<PostType, string> = {
    photo: "bg-info/15 text-info-foreground border-info/30",
    reel: "bg-destructive/15 text-destructive border-destructive/30",
    carousel: "bg-primary/15 text-primary border-primary/30",
    story: "bg-warning/20 text-warning-foreground border-warning/40",
  };
  const labels: Record<PostType, string> = { photo: "Foto", reel: "Reel", carousel: "Carrossel", story: "Story" };
  return <Badge variant="outline" className={`rounded-full ${map[type]}`}>{labels[type]}</Badge>;
}

export function StatusBadge({ status }: { status: PostStatus }) {
  const map: Record<PostStatus, string> = {
    pending: "bg-warning/15 text-warning-foreground border-warning/40",
    publishing: "bg-info/15 text-info border-info/30",
    published: "bg-success/15 text-success border-success/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
  };
  const labels: Record<PostStatus, string> = { pending: "Agendado", publishing: "Publicando", published: "Publicado", failed: "Falhou" };
  return <Badge variant="outline" className={`rounded-full ${map[status]}`}>{labels[status]}</Badge>;
}
