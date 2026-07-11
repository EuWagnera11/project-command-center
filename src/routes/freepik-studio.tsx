import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { FreepikImage } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Search, Download, Wand2 } from "lucide-react";

export const Route = createFileRoute("/freepik-studio")({
  head: () => ({ meta: [{ title: "Freepik Studio — InstaBot" }, { name: "description", content: "Busque e gere imagens com IA via Freepik." }] }),
  component: FreepikStudioPage,
});

function FreepikStudioPage() {
  const [q, setQ] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState<FreepikImage | null>(null);
  const search = useQuery({ queryKey: ["freepik", q], queryFn: () => api.freepikSearch(q) });

  const generate = useMutation({
    mutationFn: (p: string) => api.freepikGenerate(p),
    onSuccess: (img) => { setGenerated(img); toast.success("Imagem gerada"); },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Sparkles className="h-6 w-6 text-primary" /> Freepik Studio</h1>
        <p className="text-sm text-muted-foreground">Encontre stock photos ou gere imagens com IA para os seus posts.</p>
      </header>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search"><Search className="mr-2 h-4 w-4" /> Buscar</TabsTrigger>
          <TabsTrigger value="generate"><Wand2 className="mr-2 h-4 w-4" /> Gerar com IA</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por tema — ex: marketing, business, ecommerce…" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {(search.data ?? []).map((img) => (
              <Card key={img.id} className="group overflow-hidden p-0">
                <div className="aspect-square bg-muted">
                  <img src={img.thumbnail_url} alt={img.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                </div>
                <CardContent className="space-y-1 p-2">
                  <div className="truncate text-xs font-medium">{img.title}</div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{img.source}</Badge>
                    <Button size="icon" variant="ghost" className="h-6 w-6" asChild>
                      <a href={img.image_url} target="_blank" rel="noreferrer"><Download className="h-3 w-3" /></a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Descreva a imagem que você quer gerar — ex: 'mockup de smartphone Instagram, feed premium, iluminação suave'" />
              <div className="flex justify-end">
                <Button onClick={() => generate.mutate(prompt)} disabled={!prompt || generate.isPending}>
                  <Wand2 className="mr-2 h-4 w-4" /> {generate.isPending ? "Gerando…" : "Gerar imagem"}
                </Button>
              </div>
            </CardContent>
          </Card>
          {generated && (
            <Card className="overflow-hidden">
              <div className="aspect-square max-h-[520px] bg-muted">
                <img src={generated.image_url} alt={generated.title} className="h-full w-full object-cover" />
              </div>
              <CardContent className="flex items-center justify-between p-3">
                <div className="text-sm font-medium">{generated.title}</div>
                <Button size="sm" variant="outline" asChild>
                  <a href={generated.image_url} download><Download className="mr-2 h-4 w-4" /> Baixar</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
