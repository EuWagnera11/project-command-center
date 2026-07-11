import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { InstagramPreview } from "@/components/instagram-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Eye, LayoutGrid, Film, Play } from "lucide-react";

export const Route = createFileRoute("/preview")({
  head: () => ({ meta: [{ title: "Preview Realista — InstaBot" }, { name: "description", content: "Simulação de feed, stories e reels" }] }),
  component: PreviewPage,
});

const defaultImg = "https://images.unsplash.com/photo-1611262588024-d12430b98920?w=800";

function PreviewPage() {
  const [caption, setCaption] = useState("🌟 Novo lançamento! Confira nossa coleção de verão com descontos especiais. #verao2026 #moda #lifestyle");
  const [image, setImage] = useState(defaultImg);
  const [username, setUsername] = useState("wagner.constanteads");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Eye className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Preview Realista</h1>
          <p className="text-muted-foreground">Veja exatamente como o post aparecerá no Instagram</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Conteúdo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">URL da imagem</label>
              <Input value={image} onChange={(e) => setImage(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Caption</label>
              <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={8} />
              <div className="mt-1 text-xs text-muted-foreground">{caption.length} / 2200</div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="feed" className="space-y-4">
          <TabsList>
            <TabsTrigger value="feed"><LayoutGrid className="mr-2 h-4 w-4" />Feed</TabsTrigger>
            <TabsTrigger value="reel"><Film className="mr-2 h-4 w-4" />Reels</TabsTrigger>
            <TabsTrigger value="story"><Play className="mr-2 h-4 w-4" />Story</TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <div className="grid gap-4 md:grid-cols-2">
              <InstagramPreview username={username} imageUrl={image} caption={caption} />
              <Card>
                <CardHeader><CardTitle className="text-sm">Grid do perfil</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-0.5">
                    {[image, ...Array(8).fill(defaultImg)].map((src, i) => (
                      <div key={i} className="aspect-square overflow-hidden bg-muted">
                        <img src={src} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reel">
            <div className="mx-auto max-w-[280px] overflow-hidden rounded-2xl border bg-black" style={{ aspectRatio: "9/16" }}>
              <div className="relative h-full">
                <img src={image} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 space-y-2 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                  <div className="text-sm font-semibold">@{username}</div>
                  <div className="text-xs opacity-90 line-clamp-3">{caption}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="story">
            <div className="mx-auto max-w-[280px] overflow-hidden rounded-2xl border bg-black" style={{ aspectRatio: "9/16" }}>
              <div className="relative h-full">
                <div className="absolute inset-x-3 top-2 h-0.5 rounded-full bg-white/30">
                  <div className="h-full w-1/3 rounded-full bg-white" />
                </div>
                <div className="absolute inset-x-3 top-5 flex items-center gap-2 text-white text-xs">
                  <div className="rounded-full bg-gradient-ig p-0.5">
                    <div className="h-6 w-6 rounded-full bg-black" />
                  </div>
                  <span className="font-semibold">@{username}</span>
                  <span className="opacity-70">há 2h</span>
                </div>
                <img src={image} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
