import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { MediaTool } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Wrench, ArchiveRestore, Droplets, Eraser, Crop, RefreshCw, AudioLines, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/media-tools")({
  head: () => ({ meta: [{ title: "Ferramentas de Mídia — InstaBot" }, { name: "description", content: "Compressão, watermark, remoção de fundo e mais" }] }),
  component: MediaToolsPage,
});

const iconMap = {
  compress: ArchiveRestore, watermark: Droplets, removebg: Eraser,
  crop: Crop, convert: RefreshCw, audio: AudioLines,
} as const;

function MediaToolsPage() {
  const { data = [] } = useQuery({ queryKey: ["media-tools"], queryFn: api.mediaTools });
  const [tool, setTool] = useState<MediaTool | null>(null);
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wrench className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Ferramentas de Mídia</h1>
          <p className="text-muted-foreground">Otimize imagens e vídeos antes de publicar</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map(t => {
          const Icon = iconMap[t.icon];
          return (
            <Card key={t.id} className="cursor-pointer transition hover:border-primary/50" onClick={() => { setTool(t); setResult(null); setUrl(""); }}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{t.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{t.description}</p></CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!tool} onOpenChange={(o) => !o && setTool(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{tool?.label}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{tool?.description}</p>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL do arquivo ou faça upload" />
            {result && (
              <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Processado. Saída: <code className="text-xs">{result}</code></span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button disabled={loading} onClick={async () => {
              if (!tool) return;
              setLoading(true);
              const r = await api.runMediaTool(tool.id, { url }) as { output_url: string };
              setResult(r.output_url);
              setLoading(false);
              toast.success("Processamento concluído");
            }}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Processar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
