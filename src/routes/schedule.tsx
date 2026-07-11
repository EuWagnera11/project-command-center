import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Sparkles, UploadCloud, Check } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "Agendar Post — InstaBot" },
      { name: "description", content: "Wizard em 3 etapas para agendar um novo post no Instagram com IA." },
    ],
  }),
  component: SchedulePage,
});

const steps = ["Mídia", "Conteúdo", "Agendar"] as const;

function SchedulePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [tone, setTone] = useState("descontraido");
  const [postType, setPostType] = useState("photo");
  const [publishNow, setPublishNow] = useState(false);

  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: () => api.listProfiles() });
  const { data: templates } = useQuery({ queryKey: ["templates"], queryFn: () => api.listTemplates() });
  const { data: hashtags } = useQuery({ queryKey: ["hashtags"], queryFn: () => api.listHashtags() });

  const genCaption = async () => {
    toast.info("Gerando com IA...");
    const r = await api.generateCaption({ media_path: files[0]?.name ?? "", tone });
    setCaption((c) => (c ? c + "\n\n" + r.caption : r.caption));
    toast.success("Caption gerada");
  };

  const submit = async () => {
    await api.createPost({ caption, post_type: postType });
    toast.success("Post agendado!");
    navigate({ to: "/posts" });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Nova publicação"
        title="Agendar post"
        subtitle="Selecione a mídia, escreva a legenda e agende"
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Stepper */}
        <ol className="space-y-2 lg:sticky lg:top-20 lg:h-fit">
          {steps.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-sm transition ${
                    active ? "border-primary bg-accent" : done ? "bg-muted/40" : ""
                  }`}>
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  done ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className="font-medium">{s}</span>
              </li>
            );
          })}
        </ol>

        <Card className="p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Selecione a mídia</h3>
                <p className="text-sm text-muted-foreground">JPG, PNG, WEBP, MP4 ou MOV.</p>
              </div>
              <label className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border p-12 text-center hover:border-primary hover:bg-accent/40">
                <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
                <div className="text-sm font-medium">Arraste arquivos aqui ou clique para escolher</div>
                <div className="text-xs text-muted-foreground">Suporta múltiplos arquivos</div>
                <input
                  type="file" multiple hidden
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
              </label>
              {files.length > 0 && (
                <ul className="space-y-2">
                  {files.map((f) => (
                    <li key={f.name} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                      <span className="truncate">{f.name}</span>
                      <span className="text-xs text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Conteúdo</h3>
                <p className="text-sm text-muted-foreground">Escreva ou gere a legenda com IA.</p>
              </div>
              <div>
                <Label>Legenda</Label>
                <Textarea rows={6} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Digite a legenda..." className="mt-1" />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Template</Label>
                  <Select onValueChange={(v) => setCaption((c) => c + "\n" + (templates?.find((t) => t.id === +v)?.content ?? ""))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Aplicar template" /></SelectTrigger>
                    <SelectContent>{templates?.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hashtags</Label>
                  <Select onValueChange={(v) => setCaption((c) => c + "\n\n" + (hashtags?.find((h) => h.id === +v)?.hashtags ?? ""))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Aplicar grupo" /></SelectTrigger>
                    <SelectContent>{hashtags?.map((h) => <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tom</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="descontraido">Descontraído</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="engajamento">Engajamento</SelectItem>
                      <SelectItem value="informativo">Informativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button variant="outline" onClick={genCaption} className="w-full sm:w-auto">
                <Sparkles className="mr-1 h-4 w-4" /> Gerar caption com IA
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Agendar</h3>
                <p className="text-sm text-muted-foreground">Escolha conta, formato e horário.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Conta Instagram</Label>
                  <Select>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Escolha uma conta" /></SelectTrigger>
                    <SelectContent>
                      {profiles?.map((p) => <SelectItem key={p.id} value={String(p.id)}>@{p.instagram_username}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de post</Label>
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photo">Foto</SelectItem>
                      <SelectItem value="reel">Reel</SelectItem>
                      <SelectItem value="carousel">Carrossel</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Aspect ratio</Label>
                <RadioGroup defaultValue="original" className="mt-2 flex flex-wrap gap-3">
                  {["original", "1:1", "4:5", "16:9"].map((r) => (
                    <label key={r} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer">
                      <RadioGroupItem value={r} /> {r}
                    </label>
                  ))}
                </RadioGroup>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={publishNow} onCheckedChange={(v) => setPublishNow(!!v)} />
                Publicar agora
              </label>
              {!publishNow && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Data</Label><Input type="date" className="mt-1" /></div>
                  <div><Label>Hora</Label><Input type="time" className="mt-1" /></div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">ℹ️ Delay mínimo entre posts: 5 minutos.</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Continuar <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit}>Agendar post →</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
