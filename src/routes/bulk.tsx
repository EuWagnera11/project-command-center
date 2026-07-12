import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { UploadCloud, ArrowUp, ArrowDown, X, Sparkles, Save, Loader2 } from "lucide-react";
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

export const Route = createFileRoute("/bulk")({
  head: () => ({
    meta: [
      { title: "Agendamento em Massa — InstaBot" },
      { name: "description", content: "Suba várias imagens, gere legendas com IA e agende posts em massa." },
    ],
  }),
  component: BulkPage,
});

interface BulkItem {
  id: string;
  file: File;
  previewUrl: string;
  caption: string;
  date: string;
  time: string;
  uploadedUrl?: string;
  status: "idle" | "uploading" | "generating" | "scheduling" | "done" | "error";
  error?: string;
}

function BulkPage() {
  const navigate = useNavigate();
  const listProfiles = useServerFn(listInstagramProfiles);
  const genCaption = useServerFn(kpaGenerateCaption);

  const [items, setItems] = useState<BulkItem[]>([]);
  const [profileId, setProfileId] = useState<string>("");
  const [intervalDays, setIntervalDays] = useState(3);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [defaultTime, setDefaultTime] = useState("10:00");
  const [tone, setTone] = useState<"descontraido" | "profissional" | "engajamento" | "informativo">("descontraido");
  const [theme, setTheme] = useState("");
  const [autoGen, setAutoGen] = useState(true);
  const [platforms, setPlatforms] = useState<{ instagram: boolean; facebook: boolean }>({ instagram: true, facebook: true });
  const [busy, setBusy] = useState(false);

  const { data: profiles } = useQuery({ queryKey: ["ig-profiles"], queryFn: () => listProfiles() });

  const recomputeDates = (arr: BulkItem[], start: string, interval: number, time: string) => {
    const base = new Date(`${start}T00:00:00`);
    return arr.map((it, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i * interval);
      return { ...it, date: d.toISOString().slice(0, 10), time };
    });
  };

  const addFiles = (fs: FileList | null) => {
    if (!fs) return;
    const additions: BulkItem[] = Array.from(fs).map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      caption: "",
      date: startDate,
      time: defaultTime,
      status: "idle",
    }));
    setItems((prev) => recomputeDates([...prev, ...additions], startDate, intervalDays, defaultTime));
  };

  const move = (i: number, dir: -1 | 1) => {
    setItems((prev) => {
      const arr = [...prev];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return recomputeDates(arr, startDate, intervalDays, defaultTime);
    });
  };
  const remove = (id: string) =>
    setItems((p) => recomputeDates(p.filter((x) => x.id !== id), startDate, intervalDays, defaultTime));
  const update = (id: string, patch: Partial<BulkItem>) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const applyGlobals = () => {
    setItems((p) => recomputeDates(p, startDate, intervalDays, defaultTime));
  };

  const genCaptionFor = async (it: BulkItem) => {
    update(it.id, { status: "generating" });
    try {
      const topic = theme.trim() || it.file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      const r = await genCaption({
        data: {
          topic,
          tone,
          includeHashtags: true,
          includeEmojis: true,
          maxLength: 500,
          language: "pt-BR",
          profileId: profileId || undefined,
        },
      });
      update(it.id, { caption: r.caption, status: "idle" });
      return r.caption;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro";
      update(it.id, { status: "error", error: msg });
      throw e;
    }
  };

  const genAll = async () => {
    if (!items.length) return;
    setBusy(true);
    toast.info(`Gerando ${items.length} legendas com IA...`);
    try {
      for (const it of items) {
        if (!it.caption) await genCaptionFor(it);
      }
      toast.success("Legendas geradas");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar");
    } finally {
      setBusy(false);
    }
  };

  const uploadOne = async (it: BulkItem): Promise<string> => {
    if (it.uploadedUrl) return it.uploadedUrl;
    update(it.id, { status: "uploading" });
    const ext = it.file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("bulk-media").upload(path, it.file, {
      contentType: it.file.type || "image/jpeg",
      upsert: false,
    });
    if (upErr) throw new Error(`Upload: ${upErr.message}`);
    const { data } = supabase.storage.from("bulk-media").getPublicUrl(path);
    update(it.id, { uploadedUrl: data.publicUrl });
    return data.publicUrl;
  };

  const scheduleAll = async () => {
    if (!profileId) { toast.error("Escolha uma conta"); return; }
    if (!items.length) return;
    const plats: string[] = [];
    if (platforms.instagram) plats.push("instagram");
    if (platforms.facebook) plats.push("facebook");
    if (!plats.length) { toast.error("Escolha ao menos uma plataforma"); return; }

    setBusy(true);
    let ok = 0;
    try {
      for (const it of items) {
        try {
          let caption = it.caption;
          if (!caption && autoGen) caption = await genCaptionFor(it);
          if (!caption) { throw new Error("Sem legenda"); }

          const url = await uploadOne(it);
          update(it.id, { status: "scheduling" });

          const scheduledAt = new Date(`${it.date}T${it.time}:00`).toISOString();
          const { error } = await supabase.from("scheduled_posts").insert({
            profile_id: profileId,
            caption,
            image_url: url,
            platforms: plats,
            scheduled_at: scheduledAt,
            status: "scheduled",
          });
          if (error) throw new Error(error.message);
          update(it.id, { status: "done" });
          ok++;
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Erro";
          update(it.id, { status: "error", error: msg });
        }
      }
      toast.success(`${ok}/${items.length} posts agendados`);
      if (ok === items.length) {
        setTimeout(() => navigate({ to: "/calendar" }), 800);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Bulk"
        title="Agendamento em Massa"
        subtitle="Suba várias mídias, gere legendas com IA e agende de uma vez"
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <label className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed p-12 text-center hover:border-primary hover:bg-accent/40">
            <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
            <div className="text-sm font-medium">Arraste várias imagens aqui ou clique</div>
            <div className="text-xs text-muted-foreground">
              Elas serão distribuídas a cada {intervalDays} dia(s) às {defaultTime}
            </div>
            <input type="file" multiple accept="image/*" hidden onChange={(e) => addFiles(e.target.files)} />
          </label>

          {items.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">Nenhum arquivo adicionado ainda.</Card>
          ) : (
            <div className="space-y-3">
              {items.map((it, i) => (
                <Card key={it.id} className="p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <img src={it.previewUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                        <div className="truncate text-sm font-medium">{it.file.name}</div>
                        {it.status === "uploading" && <span className="text-xs text-muted-foreground">enviando…</span>}
                        {it.status === "generating" && <span className="text-xs text-primary">IA…</span>}
                        {it.status === "scheduling" && <span className="text-xs text-muted-foreground">agendando…</span>}
                        {it.status === "done" && <span className="text-xs text-success">✓ agendado</span>}
                        {it.status === "error" && <span className="text-xs text-destructive">✕ {it.error}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{(it.file.size / 1024).toFixed(0)} KB</div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(it.id)}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <Textarea rows={3} value={it.caption} onChange={(e) => update(it.id, { caption: e.target.value })} placeholder="Legenda (ou gere com IA)" />
                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={it.date} onChange={(e) => update(it.id, { date: e.target.value })} />
                      <Input type="time" value={it.time} onChange={(e) => update(it.id, { time: e.target.value })} />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => genCaptionFor(it).catch((e) => toast.error(e.message))}>
                      {it.status === "generating" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1 h-3.5 w-3.5" />} IA
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <Card className="space-y-4 p-5">
            <h3 className="text-sm font-semibold">Configurações globais</h3>

            <div>
              <Label>Conta</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Escolha a conta" /></SelectTrigger>
                <SelectContent>
                  {profiles?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>@{p.ig_username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Plataformas</Label>
              <div className="mt-2 flex flex-col gap-2 text-sm">
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Início</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Horário</Label>
                <Input type="time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Intervalo (dias)</Label>
              <Input type="number" value={intervalDays} onChange={(e) => setIntervalDays(Math.max(0, +e.target.value))} min={0} className="mt-1" />
            </div>

            <Button variant="outline" size="sm" onClick={applyGlobals} disabled={!items.length} className="w-full">
              Recalcular datas
            </Button>

            <div>
              <Label>Tom das legendas</Label>
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

            <div>
              <Label>Tema (opcional)</Label>
              <Input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="Ex: dicas de tráfego pago" className="mt-1" />
              <p className="mt-1 text-xs text-muted-foreground">Se vazio, usa o nome do arquivo como tópico.</p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={autoGen} onCheckedChange={(v) => setAutoGen(!!v)} />
              Gerar legendas em falta ao agendar
            </label>
          </Card>

          <Button className="w-full" variant="outline" onClick={genAll} disabled={!items.length || busy}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
            Gerar todas as legendas com IA
          </Button>
          <Button className="w-full" onClick={scheduleAll} disabled={!items.length || busy || !profileId}>
            {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Agendar {items.length || ""} post{items.length === 1 ? "" : "s"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
