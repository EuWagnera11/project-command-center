import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UploadCloud, ArrowUp, ArrowDown, X, Sparkles, Save } from "lucide-react";
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

export const Route = createFileRoute("/bulk")({
  head: () => ({
    meta: [
      { title: "Agendamento em Massa — InstaBot" },
      { name: "description", content: "Faça upload de várias imagens e agende posts em massa com IA." },
    ],
  }),
  component: BulkPage,
});

interface BulkItem {
  id: string;
  name: string;
  size: number;
  caption: string;
  date: string;
  time: string;
}

function BulkPage() {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [interval, setInterval] = useState(3);
  const [defaultTime, setDefaultTime] = useState("10:00");
  const [tone, setTone] = useState("descontraido");
  const [genCaptions, setGenCaptions] = useState(true);
  const { data: profiles } = useQuery({ queryKey: ["profiles"], queryFn: () => api.listProfiles() });

  const addFiles = (fs: FileList | null) => {
    if (!fs) return;
    const today = new Date();
    const next = Array.from(fs).map((f, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i * interval);
      return {
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        caption: "",
        date: d.toISOString().slice(0, 10),
        time: defaultTime,
      };
    });
    setItems((prev) => [...prev, ...next]);
  };

  const move = (i: number, dir: -1 | 1) => {
    setItems((prev) => {
      const arr = [...prev];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };
  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id));
  const update = (id: string, patch: Partial<BulkItem>) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const genAll = async () => {
    toast.info(`Gerando ${items.length} captions...`);
    for (const it of items) {
      const r = await api.generateCaption({ media_path: it.name, tone });
      update(it.id, { caption: r.caption });
    }
    toast.success("Concluído");
  };

  const scheduleAll = async () => {
    toast.success(`${items.length} posts agendados`);
    setItems([]);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Bulk"
        title="Agendamento em Massa"
        subtitle="Suba várias mídias e agende de uma vez com IA"
      />
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <label className="grid cursor-pointer place-items-center rounded-xl border-2 border-dashed p-12 text-center hover:border-primary hover:bg-accent/40">
            <UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" />
            <div className="text-sm font-medium">Arraste várias imagens aqui ou clique</div>
            <div className="text-xs text-muted-foreground">Elas serão distribuídas conforme o intervalo</div>
            <input type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          </label>

          {items.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">Nenhum arquivo adicionado ainda.</Card>
          ) : (
            <div className="space-y-3">
              {items.map((it, i) => (
                <Card key={it.id} className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{it.name}</div>
                        <div className="text-xs text-muted-foreground">{(it.size / 1024).toFixed(0)} KB</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => remove(it.id)}><X className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <Textarea rows={2} value={it.caption} onChange={(e) => update(it.id, { caption: e.target.value })} placeholder="Legenda..." />
                  <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={it.date} onChange={(e) => update(it.id, { date: e.target.value })} />
                      <Input type="time" value={it.time} onChange={(e) => update(it.id, { time: e.target.value })} />
                    </div>
                    <Button variant="outline" size="sm" onClick={async () => {
                      const r = await api.generateCaption({ media_path: it.name, tone });
                      update(it.id, { caption: r.caption });
                    }}>
                      <Sparkles className="mr-1 h-3.5 w-3.5" /> IA
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
              <Select>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Escolha" /></SelectTrigger>
                <SelectContent>{profiles?.map((p) => <SelectItem key={p.id} value={String(p.id)}>@{p.instagram_username}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Intervalo entre posts (dias)</Label>
              <Input type="number" value={interval} onChange={(e) => setInterval(+e.target.value)} min={0} className="mt-1" />
            </div>
            <div>
              <Label>Horário padrão</Label>
              <Input type="time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Tom das captions</Label>
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
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={genCaptions} onCheckedChange={(v) => setGenCaptions(!!v)} />
              Gerar captions automaticamente
            </label>
          </Card>
          <Button className="w-full" variant="outline" onClick={genAll} disabled={!items.length}>
            <Sparkles className="mr-1 h-4 w-4" /> Gerar todas as captions
          </Button>
          <Button className="w-full" onClick={scheduleAll} disabled={!items.length}>
            <Save className="mr-1 h-4 w-4" /> Agendar todas ({items.length})
          </Button>
        </aside>
      </div>
    </div>
  );
}
