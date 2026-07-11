import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Trash2, Video, ImageIcon, Search } from "lucide-react";

export const Route = createFileRoute("/media-library")({
  head: () => ({ meta: [{ title: "Biblioteca de mídia — InstaBot" }, { name: "description", content: "Todas as fotos e vídeos disponíveis para agendamento." }] }),
  component: MediaLibraryPage,
});

const bytes = (n: number) => (n < 1024 ? `${n} B` : n < 1_048_576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1_048_576).toFixed(1)} MB`);

function MediaLibraryPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["media-library"], queryFn: api.listMediaLibrary });
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteMediaItem(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["media-library"] }); toast.success("Arquivo removido"); },
  });

  const allTags = useMemo(() => Array.from(new Set((list.data ?? []).flatMap((i) => i.tags))), [list.data]);
  const items = (list.data ?? []).filter((i) =>
    (!q || i.name.toLowerCase().includes(q.toLowerCase())) && (!tag || i.tags.includes(tag))
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><FolderOpen className="h-6 w-6 text-primary" /> Biblioteca de mídia</h1>
          <p className="text-sm text-muted-foreground">{items.length} de {list.data?.length ?? 0} arquivos</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} className="w-64 pl-9" placeholder="Buscar por nome" />
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Badge variant={tag === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setTag(null)}>Todas</Badge>
        {allTags.map((t) => (
          <Badge key={t} variant={tag === t ? "default" : "outline"} className="cursor-pointer" onClick={() => setTag(t)}>#{t}</Badge>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((i) => (
          <Card key={i.id} className="group relative overflow-hidden p-0">
            <div className="aspect-square bg-muted">
              <img src={i.url} alt={i.name} loading="lazy" className="h-full w-full object-cover" />
              {i.is_video && (
                <div className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  <Video className="inline h-3 w-3" /> Vídeo
                </div>
              )}
              {i.used && <Badge className="absolute right-2 top-2 text-[10px]">usado</Badge>}
            </div>
            <CardContent className="space-y-1 p-2">
              <div className="truncate text-xs font-medium" title={i.name}>{i.name}</div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{bytes(i.size)}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 transition group-hover:opacity-100" onClick={() => remove.mutate(i.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
            <ImageIcon className="mx-auto mb-2 h-8 w-8 opacity-50" />
            Nenhum arquivo encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
