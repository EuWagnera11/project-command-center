import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { api } from "@/lib/api";
import type { AITemplate } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { LayoutTemplate, Sparkles, Search } from "lucide-react";

export const Route = createFileRoute("/ai-templates")({
  head: () => ({ meta: [{ title: "AI Templates — InstaBot" }, { name: "description", content: "22 templates prontos para IA de marketing" }] }),
  component: AITemplatesPage,
});

const catColors: Record<AITemplate["category"], string> = {
  caption: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  hashtag: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  campaign: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  analysis: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  reply: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

function AITemplatesPage() {
  const { data = [] } = useQuery({ queryKey: ["ai-templates"], queryFn: api.aiTemplates });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [selected, setSelected] = useState<AITemplate | null>(null);
  const [vars, setVars] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => data.filter(t =>
    (cat === "all" || t.category === cat) &&
    (q === "" || t.title.toLowerCase().includes(q.toLowerCase()) || t.description.toLowerCase().includes(q.toLowerCase()))
  ), [data, q, cat]);

  const cats = ["all", "caption", "hashtag", "campaign", "analysis", "reply"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LayoutTemplate className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">AI Templates</h1>
          <p className="text-muted-foreground">22 templates prontos para IA de marketing</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar templates..." className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.map(c => (
            <Button key={c} size="sm" variant={cat === c ? "default" : "outline"} onClick={() => setCat(c)} className="capitalize">
              {c === "all" ? "Todos" : c}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(t => (
          <Card key={t.id} className="transition hover:border-primary/50 cursor-pointer" onClick={() => { setSelected(t); setOutput(null); setVars(""); }}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{t.title}</CardTitle>
                <Badge variant="outline" className={catColors[t.category]}>{t.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{t.description}</p>
              <div className="mt-3 text-xs text-muted-foreground">{t.uses} usos</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Prompt base</div>
                <code className="text-xs">{selected.prompt}</code>
              </div>
              <div>
                <label className="text-sm font-medium">Variáveis (formato: chave=valor por linha)</label>
                <Textarea value={vars} onChange={(e) => setVars(e.target.value)} rows={4} placeholder="produto=Camiseta&#10;tema=verão" />
              </div>
              {output && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                  <div className="mb-1 text-xs font-medium text-primary">Resultado</div>
                  {output}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button disabled={loading} onClick={async () => {
              if (!selected) return;
              setLoading(true);
              const parsed = Object.fromEntries(vars.split("\n").filter(Boolean).map(l => l.split("=")));
              const res = await api.aiRunTemplate(selected.id, parsed);
              setOutput(res.output);
              setLoading(false);
              toast.success("Template executado");
            }}>{loading ? "Gerando..." : "Executar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
