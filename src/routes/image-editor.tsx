import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Sparkles, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/image-editor")({
  head: () => ({ meta: [{ title: "Editor de Imagem IA — InstaBot" }, { name: "description", content: "Edição de imagem com IA" }] }),
  component: ImageEditorPage,
});

const sample = "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=800";

function ImageEditorPage() {
  const [image, setImage] = useState(sample);
  const [prompt, setPrompt] = useState("adicionar iluminação cinemática, cores vibrantes");
  const [brightness, setBrightness] = useState([100]);
  const [contrast, setContrast] = useState([100]);
  const [saturate, setSaturate] = useState([100]);
  const [loading, setLoading] = useState(false);

  const filter = `brightness(${brightness[0]}%) contrast(${contrast[0]}%) saturate(${saturate[0]}%)`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wand2 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Editor de Imagem IA</h1>
          <p className="text-muted-foreground">Ajustes rápidos + reimaginação com IA</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Controles</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">URL da imagem</label>
              <Input value={image} onChange={(e) => setImage(e.target.value)} />
            </div>

            <Tabs defaultValue="adjust">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="adjust">Ajustar</TabsTrigger>
                <TabsTrigger value="ai">IA</TabsTrigger>
              </TabsList>
              <TabsContent value="adjust" className="space-y-4 pt-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span>Brilho</span><span>{brightness[0]}%</span></div>
                  <Slider value={brightness} onValueChange={setBrightness} min={0} max={200} />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span>Contraste</span><span>{contrast[0]}%</span></div>
                  <Slider value={contrast} onValueChange={setContrast} min={0} max={200} />
                </div>
                <div>
                  <div className="mb-2 flex justify-between text-sm"><span>Saturação</span><span>{saturate[0]}%</span></div>
                  <Slider value={saturate} onValueChange={setSaturate} min={0} max={200} />
                </div>
              </TabsContent>
              <TabsContent value="ai" className="space-y-3 pt-4">
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Descreva a edição..." />
                <Button className="w-full" disabled={loading} onClick={async () => {
                  setLoading(true);
                  await api.runMediaTool("ai-edit", { image, prompt });
                  setLoading(false);
                  toast.success("Edição IA aplicada (mock)");
                }}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Reimaginar com IA
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Preview</CardTitle>
            <Button size="sm" variant="outline"><Download className="mr-2 h-3 w-3" />Exportar</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border bg-black">
              <img src={image} alt="preview" className="mx-auto max-h-[600px] w-full object-contain transition" style={{ filter }} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
