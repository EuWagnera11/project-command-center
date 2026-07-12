import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Sparkles, UploadCloud, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { listInstagramProfiles } from "@/lib/instagram.functions";
import { kpaGenerateCaption } from "@/lib/kpa-ai.functions";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const listProfiles = useServerFn(listInstagramProfiles);
  const genCaption = useServerFn(kpaGenerateCaption);

  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<"descontraido" | "profissional" | "engajamento" | "informativo">("descontraido");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [profileId, setProfileId] = useState<string>("");
  const [platforms, setPlatforms] = useState<{ instagram: boolean; facebook: boolean }>({ instagram: true, facebook: true });
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("10:00");
  const [publishNow, setPublishNow] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: profiles } = useQuery({ queryKey: ["ig-profiles"], queryFn: () => listProfiles() });

  const onFiles = (fs: File[]) => {
    setFiles(fs);
    if (fs[0]) setPreviewUrl(URL.createObjectURL(fs[0]));
  };

  const runGenCaption = async () => {
    const t = topic.trim() || files[0]?.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ") || "novo post";
    setGenLoading(true);
    try {
      const r = await genCaption({
        data: { topic: t, tone, includeHashtags, includeEmojis, maxLength: 500, language: "pt-BR" },
      });
      setCaption(r.caption);
      toast.success("Legenda gerada com IA");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar");
    } finally {
      setGenLoading(false);
    }
  };

  const submit = async () => {
    if (!profileId) { toast.error("Escolha uma conta"); return; }
    if (!files[0]) { toast.error("Envie uma imagem"); return; }
    if (!caption.trim()) { toast.error("Escreva ou gere uma legenda"); return; }
    const plats: string[] = [];
    if (platforms.instagram) plats.push("instagram");
    if (platforms.facebook) plats.push("facebook");
    if (!plats.length) { toast.error("Escolha ao menos uma plataforma"); return; }

    setSubmitting(true);
    try {
      const file = files[0];
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("bulk-media").upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (upErr) throw new Error(`Upload: ${upErr.message}`);
      const { data: pub } = supabase.storage.from("bulk-media").getPublicUrl(path);

      const scheduledAt = publishNow ? new Date().toISOString() : new Date(`${date}T${time}:00`).toISOString();

      const { error } = await supabase.from("scheduled_posts").insert({
        profile_id: profileId,
        caption,
        image_url: pub.publicUrl,
        platforms: plats,
        scheduled_at: scheduledAt,
        status: "scheduled",
      });
      if (error) throw new Error(error.message);

      toast.success(publishNow ? "Post enviado para publicação" : "Post agendado!");
      navigate({ to: "/calendar" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Nova publicação"
        title="Agendar post"
        subtitle="Selecione a mídia, escreva ou gere a legenda com IA e agende"
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
                <p className="text-sm text-muted-foreground">JPG, PNG ou WEBP.</p>
              </div>
              <label className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border p-12 text-center hover:border-primary hover:bg-accent/40">
                <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
                <div className="text-sm font-medium">Arraste um arquivo aqui ou clique</div>
                <div className="text-xs text-muted-foreground">1 imagem por post</div>
                <input
                  type="file" accept="image/*" hidden
                  onChange={(e) => onFiles(Array.from(e.target.files ?? []))}
                />
              </label>
              {previewUrl && (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <img src={previewUrl} alt="" className="h-20 w-20 rounded-md object-cover" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{files[0]?.name}</div>
                    <div className="text-xs text-muted-foreground">{((files[0]?.size ?? 0) / 1024).toFixed(0)} KB</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Conteúdo</h3>
                <p className="text-sm text-muted-foreground">Escreva ou gere a legenda com Claude Opus 4.8.</p>
              </div>
              <div>
                <Label>Tópico / tema (opcional)</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: dicas de tráfego pago para clínicas" className="mt-1" />
                <p className="mt-1 text-xs text-muted-foreground">Se vazio, usa o nome do arquivo como tópico.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <Label>Tom</Label>
                  <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="descontraido">Descontraído</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="engajamento">Engajamento</SelectItem>
                      <SelectItem value="informativo">Informativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <Checkbox checked={includeHashtags} onCheckedChange={(v) => setIncludeHashtags(!!v)} />
                  Hashtags
                </label>
                <label className="flex items-end gap-2 pb-2 text-sm">
                  <Checkbox checked={includeEmojis} onCheckedChange={(v) => setIncludeEmojis(!!v)} />
                  Emojis
                </label>
              </div>
              <Button variant="outline" onClick={runGenCaption} disabled={genLoading} className="w-full sm:w-auto">
                {genLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
                Gerar legenda com IA
              </Button>
              <div>
                <Label>Legenda</Label>
                <Textarea rows={8} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Sua legenda aparecerá aqui..." className="mt-1" />
                <div className="mt-1 text-right text-xs text-muted-foreground">{caption.length} caracteres</div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Agendar</h3>
                <p className="text-sm text-muted-foreground">Escolha a conta, plataformas e o horário.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Conta</Label>
                  <Select value={profileId} onValueChange={setProfileId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Escolha uma conta" /></SelectTrigger>
                    <SelectContent>
                      {profiles?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>@{p.ig_username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plataformas</Label>
                  <div className="mt-2 flex gap-4 text-sm">
                    <label className="flex items-center gap-2">
                      <Checkbox checked={platforms.instagram} onCheckedChange={(v) => setPlatforms((p) => ({ ...p, instagram: !!v }))} />
                      Instagram
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox checked={platforms.facebook} onCheckedChange={(v) => setPlatforms((p) => ({ ...p, facebook: !!v }))} />
                      Facebook
                    </label>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={publishNow} onCheckedChange={(v) => setPublishNow(!!v)} />
                Publicar agora
              </label>
              {!publishNow && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" /></div>
                  <div><Label>Hora</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" /></div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">ℹ️ O worker roda a cada 5 min e publica os posts com horário vencido.</p>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={step === 0 && !files[0]}>
                Continuar <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitting}>
                {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                {publishNow ? "Publicar agora" : "Agendar post"} →
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
