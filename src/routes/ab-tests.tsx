import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/ab-tests")({
  head: () => ({ meta: [{ title: "A/B Tests — InstaBot" }, { name: "description", content: "Testes A/B de captions em posts." }] }),
  component: ABTestsPage,
});

function ABTestsPage() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["abtests"], queryFn: api.listABTests });
  const decide = useMutation({
    mutationFn: (v: { id: number; winner: "a" | "b" }) => api.decideABTest(v.id, v.winner),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["abtests"] }); toast.success("Vencedor definido"); },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><FlaskConical className="h-6 w-6 text-primary" /> A/B Tests</h1>
        <p className="text-sm text-muted-foreground">Compare variações de caption e escolha a vencedora.</p>
      </header>

      <div className="grid gap-4">
        {(list.data ?? []).map((t) => {
          const total = t.impressions_a + t.impressions_b || 1;
          const shareA = (t.impressions_a / total) * 100;
          const uplift = t.ctr_a > 0 ? ((t.ctr_b - t.ctr_a) / t.ctr_a) * 100 : 0;
          return (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Teste #{t.id} — post #{t.post_id}</CardTitle>
                <Badge variant={t.status === "decided" ? "default" : "secondary"}>{t.status === "running" ? "Em andamento" : "Decidido"}</Badge>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {(["a", "b"] as const).map((v) => {
                  const isWinner = t.winner === v;
                  const caption = v === "a" ? t.caption_a : t.caption_b;
                  const impressions = v === "a" ? t.impressions_a : t.impressions_b;
                  const clicks = v === "a" ? t.clicks_a : t.clicks_b;
                  const ctr = v === "a" ? t.ctr_a : t.ctr_b;
                  return (
                    <div key={v} className={`relative rounded-lg border p-4 ${isWinner ? "border-primary bg-primary/5" : "bg-muted/20"}`}>
                      {isWinner && (
                        <Badge className="absolute -top-2 right-3 gap-1"><Trophy className="h-3 w-3" /> Vencedor</Badge>
                      )}
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variação {v}</div>
                      <p className="mt-2 text-sm">{caption}</p>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div><div className="font-bold">{impressions.toLocaleString("pt-BR")}</div><div className="text-muted-foreground">Impressões</div></div>
                        <div><div className="font-bold">{clicks}</div><div className="text-muted-foreground">Cliques</div></div>
                        <div><div className="font-bold text-primary">{ctr.toFixed(2)}%</div><div className="text-muted-foreground">CTR</div></div>
                      </div>
                      {t.status === "running" && (
                        <Button size="sm" className="mt-3 w-full" variant="outline" onClick={() => decide.mutate({ id: t.id, winner: v })}>
                          Escolher {v.toUpperCase()} como vencedor
                        </Button>
                      )}
                    </div>
                  );
                })}
                <div className="md:col-span-2">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Divisão de tráfego A / B</span><span>Uplift B vs A: {uplift > 0 ? "+" : ""}{uplift.toFixed(1)}%</span></div>
                  <Progress value={shareA} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
