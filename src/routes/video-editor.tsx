import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api";
import type { VideoEditorTool } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Film, Play, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/video-editor")({
  head: () => ({ meta: [{ title: "Editor de Vídeo — InstaBot" }, { name: "description", content: "Análise, cortes automáticos e pipeline IA" }] }),
  component: VideoEditorPage,
});

function VideoEditorPage() {
  const { data = [] } = useQuery({ queryKey: ["video-editor-tools"], queryFn: api.videoEditorTools });
  const [url, setUrl] = useState("");
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  const run = async (t: VideoEditorTool) => {
    setRunning(t.id);
    const r = await api.runVideoTool(t.id, url || "demo.mp4") as { output_url: string };
    setResults(prev => ({ ...prev, [t.id]: r.output_url }));
    setRunning(null);
    toast.success(`${t.label} concluído`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Film className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Editor de Vídeo</h1>
          <p className="text-muted-foreground">Ferramentas de análise e pipeline automatizada</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Arquivo de entrada</CardTitle></CardHeader>
        <CardContent>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL ou upload de vídeo (.mp4, .mov)" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.map(t => (
          <Card key={t.id}>
            <CardHeader className="pb-3"><CardTitle className="text-base">{t.label}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.description}</p>
              {results[t.id] && (
                <div className="flex items-center gap-2 rounded border border-success/30 bg-success/5 p-2 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  <code>{results[t.id]}</code>
                </div>
              )}
              <Button size="sm" className="w-full" disabled={running === t.id} onClick={() => run(t)}>
                {running === t.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Play className="mr-2 h-3 w-3" />}
                Executar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
