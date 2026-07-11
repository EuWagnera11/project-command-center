import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import type { DeepAnalysisResult, TranscriptionResult } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Brain, Languages, Mic, Loader2 } from "lucide-react";

export const Route = createFileRoute("/advanced-ai")({
  head: () => ({ meta: [{ title: "Advanced AI — InstaBot" }, { name: "description", content: "Deep analysis, tradução e transcrição" }] }),
  component: AdvancedAIPage,
});

function AdvancedAIPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Advanced AI</h1>
          <p className="text-muted-foreground">Deep analysis · Tradução · Transcrição</p>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis"><Brain className="mr-2 h-4 w-4" />Deep Analysis</TabsTrigger>
          <TabsTrigger value="translate"><Languages className="mr-2 h-4 w-4" />Tradução</TabsTrigger>
          <TabsTrigger value="transcribe"><Mic className="mr-2 h-4 w-4" />Transcrição</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis"><DeepAnalysisPanel /></TabsContent>
        <TabsContent value="translate"><TranslatePanel /></TabsContent>
        <TabsContent value="transcribe"><TranscribePanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function DeepAnalysisPanel() {
  const [target, setTarget] = useState("@euwagnera");
  const [result, setResult] = useState<DeepAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult(await api.deepAnalysis(target));
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Alvo da análise</CardTitle></CardHeader>
        <CardContent className="flex gap-3">
          <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="@perfil ou URL" />
          <Button onClick={run} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Analisar</Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader><CardTitle className="text-base">Resumo Executivo</CardTitle></CardHeader>
            <CardContent><p className="text-sm">{result.summary}</p></CardContent>
          </Card>
          <ListCard title="Forças" items={result.strengths} tone="text-success" />
          <ListCard title="Fraquezas" items={result.weaknesses} tone="text-destructive" />
          <ListCard title="Oportunidades" items={result.opportunities} tone="text-info" />
          <ListCard title="Recomendações" items={result.recommendations} tone="text-primary" />
        </div>
      )}
    </div>
  );
}

function ListCard({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className={`text-base ${tone}`}>{title}</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">{items.map((x, i) => <li key={i} className="flex gap-2"><span className={tone}>•</span>{x}</li>)}</ul>
      </CardContent>
    </Card>
  );
}

function TranslatePanel() {
  const [text, setText] = useState("Olá! Confira nosso novo lançamento.");
  const [to, setTo] = useState("en");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Tradução IA</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} />
        <div className="flex gap-3">
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="idioma (en, es, fr...)" className="max-w-[200px]" />
          <Button disabled={loading} onClick={async () => {
            setLoading(true);
            const r = await api.translate(text, to) as { text: string };
            setResult(r.text);
            setLoading(false);
          }}>{loading ? "..." : "Traduzir"}</Button>
        </div>
        {result && <div className="rounded-lg border bg-muted/40 p-3 text-sm">{result}</div>}
      </CardContent>
    </Card>
  );
}

function TranscribePanel() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Transcrição de Áudio/Vídeo</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL do áudio/vídeo" />
        <Button disabled={loading} onClick={async () => {
          setLoading(true);
          try {
            setResult(await api.transcribe(url || "demo.mp4"));
          } catch { toast.error("Falha ao transcrever"); }
          setLoading(false);
        }}>{loading ? "Transcrevendo..." : "Transcrever"}</Button>
        {result && (
          <div className="space-y-2">
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Idioma: {result.language}</span>
              <span>Duração: {result.duration_sec}s</span>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-sm leading-relaxed">{result.text}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
