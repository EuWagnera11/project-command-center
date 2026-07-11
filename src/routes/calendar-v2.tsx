import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Sparkles, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import type { CalendarV2Period, CalendarV2Post, PostType } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/calendar-v2")({
  head: () => ({ meta: [
    { title: "Calendário v2 — InstaBot" },
    { name: "description", content: "Calendário com filtros de período, drag-and-drop e agendamento rápido." },
  ] }),
  component: CalendarV2Page,
});

const TYPE_ICON: Record<PostType, string> = { photo: "📷", reel: "🎬", story: "📱", carousel: "🖼️" };
const STATUS_TONE: Record<CalendarV2Post["status"], string> = {
  pending: "bg-primary/15 text-primary border-primary/30",
  publishing: "bg-info/15 text-info border-info/30",
  published: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

function CalendarV2Page() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<CalendarV2Period>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [profileId, setProfileId] = useState<string>("all");
  const [postType, setPostType] = useState<string>("all");
  const [openDay, setOpenDay] = useState<string | null>(null);

  const params = useMemo(() => ({
    period,
    start: period === "custom" ? customStart : undefined,
    end: period === "custom" ? customEnd : undefined,
    profile_id: profileId === "all" ? undefined : profileId,
    type: (postType === "all" ? undefined : postType) as PostType | undefined,
  }), [period, customStart, customEnd, profileId, postType]);

  const query = useQuery({
    queryKey: ["calendar", "v2", params],
    queryFn: () => api.calendarV2(params),
    refetchInterval: 60_000,
  });

  const movePost = useMutation({
    mutationFn: ({ id, date }: { id: number; date: string }) => api.calendarV2Move(id, date),
    onSuccess: () => { toast.success("Post movido"); qc.invalidateQueries({ queryKey: ["calendar"] }); },
    onError: () => toast.error("Falha ao mover post"),
  });

  const data = query.data;
  const grid = useMemo(() => buildGridDays(data?.grouped ?? {}, period, params.start, params.end), [data?.grouped, period, params.start, params.end]);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <CalendarDays className="h-6 w-6 text-primary" /> Calendário v2
          </h1>
          <p className="text-sm text-muted-foreground">Filtros por período, drag-and-drop entre dias e agendamento rápido.</p>
        </div>
        <Badge variant="outline">{data?.period_label ?? "Carregando…"}</Badge>
      </header>

      {/* Toolbar */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[180px] space-y-1">
            <Label className="text-xs">📅 Período</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as CalendarV2Period)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(data?.available_periods ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {period === "custom" && (
            <>
              <div className="space-y-1"><Label className="text-xs">De</Label>
                <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-[160px]" />
              </div>
              <div className="space-y-1"><Label className="text-xs">Até</Label>
                <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-[160px]" />
              </div>
            </>
          )}

          <div className="min-w-[180px] space-y-1">
            <Label className="text-xs">Perfil</Label>
            <Select value={profileId} onValueChange={setProfileId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                {(data?.profiles ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-[160px] space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="photo">📷 Foto</SelectItem>
                <SelectItem value="reel">🎬 Reel</SelectItem>
                <SelectItem value="story">📱 Story</SelectItem>
                <SelectItem value="carousel">🖼️ Carrossel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {data?.stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Total" value={data.stats.total} />
          <StatCard label="Pendentes" value={data.stats.by_status?.pending ?? 0} tone="warning" prefix="⏳" />
          <StatCard label="Publicados" value={data.stats.by_status?.published ?? 0} tone="success" prefix="✅" />
          <StatCard label="Melhor hora" value={data.stats.best_hour ?? "—"} icon={<TrendingUp className="h-4 w-4" />} />
          <StatCard label="Melhor dia" value={translateDay(data.stats.best_day)} icon={<Sparkles className="h-4 w-4" />} />
        </div>
      )}

      {/* Grid */}
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
            {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell) => (
              <DayCell
                key={cell.iso}
                iso={cell.iso}
                inRange={cell.inRange}
                isToday={cell.isToday}
                posts={cell.posts}
                onDrop={(pid, date) => movePost.mutate({ id: pid, date })}
                onOpen={() => setOpenDay(cell.iso)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <DayModal
        open={!!openDay}
        onClose={() => setOpenDay(null)}
        date={openDay}
        posts={openDay ? (data?.grouped?.[openDay] ?? []) : []}
        profiles={data?.profiles ?? []}
        onCreated={() => { qc.invalidateQueries({ queryKey: ["calendar"] }); }}
      />
    </div>
  );
}

function StatCard({ label, value, tone, prefix, icon }: { label: string; value: string | number; tone?: "success" | "warning"; prefix?: string; icon?: React.ReactNode }) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning-foreground" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label}</span>{icon}
        </div>
        <div className={`mt-1 text-xl font-bold ${toneClass}`}>{prefix ? `${prefix} ` : ""}{value}</div>
      </CardContent>
    </Card>
  );
}

type Cell = { iso: string; inRange: boolean; isToday: boolean; posts: CalendarV2Post[] };
function buildGridDays(grouped: Record<string, CalendarV2Post[]>, period: CalendarV2Period, customStart?: string, customEnd?: string): Cell[] {
  const now = new Date();
  const todayIso = toIso(now);
  let anchor = new Date(now.getFullYear(), now.getMonth(), 1);
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (period === "custom" && customStart && customEnd) {
    anchor = new Date(customStart);
    end = new Date(customEnd);
  } else if (period === "week" || period === "today" || period === "yesterday" || period === "7d" || period === "15d") {
    anchor = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else if (period === "quarter") {
    const qs = Math.floor(now.getMonth() / 3) * 3;
    anchor = new Date(now.getFullYear(), qs, 1);
    end = new Date(now.getFullYear(), qs + 3, 0);
  } else if (period === "90d") {
    anchor = new Date(now); anchor.setDate(anchor.getDate() - 45); anchor.setDate(1);
    end = new Date(now); end.setDate(end.getDate() + 45);
  }

  // pad to Sunday start / Saturday end
  const gridStart = new Date(anchor); gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(end); gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
  const cells: Cell[] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    const iso = toIso(cur);
    const inRange = cur >= anchor && cur <= end;
    cells.push({ iso, inRange, isToday: iso === todayIso, posts: grouped[iso] ?? [] });
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

function toIso(d: Date) {
  const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0"); const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function translateDay(en: string | null) {
  if (!en) return "—";
  const map: Record<string, string> = { Sunday: "Domingo", Monday: "Segunda", Tuesday: "Terça", Wednesday: "Quarta", Thursday: "Quinta", Friday: "Sexta", Saturday: "Sábado" };
  return map[en] ?? en;
}

function DayCell({ iso, inRange, isToday, posts, onDrop, onOpen }: {
  iso: string; inRange: boolean; isToday: boolean; posts: CalendarV2Post[];
  onDrop: (postId: number, date: string) => void; onOpen: () => void;
}) {
  const [hover, setHover] = useState(false);
  const day = Number(iso.slice(8, 10));
  return (
    <div
      onClick={onOpen}
      onDragOver={(e) => { e.preventDefault(); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault(); setHover(false);
        const pid = Number(e.dataTransfer.getData("text/plain"));
        if (pid) onDrop(pid, iso);
      }}
      className={[
        "group flex min-h-[110px] cursor-pointer flex-col gap-1 rounded-lg border p-1.5 text-left transition",
        inRange ? "bg-card hover:border-primary/50" : "bg-muted/20 opacity-50",
        isToday ? "border-primary ring-1 ring-primary/40" : "border-border/60",
        hover ? "border-primary bg-primary/10" : "",
      ].join(" ")}
    >
      <div className={`text-xs font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</div>
      <div className="flex flex-col gap-1">
        {posts.slice(0, 4).map((p) => (
          <Link
            key={p.id}
            to="/posts"
            search={{ highlight: p.id } as never}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("text/plain", String(p.id))}
            onClick={(e) => e.stopPropagation()}
            className={`truncate rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_TONE[p.status]}`}
            title={`${p.time} ${p.type} — ${p.caption}`}
          >
            {TYPE_ICON[p.type]} {p.time}
          </Link>
        ))}
        {posts.length > 4 && (
          <div className="text-[10px] text-muted-foreground">+{posts.length - 4} mais</div>
        )}
      </div>
    </div>
  );
}

function DayModal({ open, onClose, date, posts, profiles, onCreated }: {
  open: boolean; onClose: () => void; date: string | null;
  posts: CalendarV2Post[]; profiles: Array<{ id: number; name: string }>;
  onCreated: () => void;
}) {
  const [profileId, setProfileId] = useState<string>("");
  const [type, setType] = useState<PostType>("photo");
  const [time, setTime] = useState("14:00");
  const [caption, setCaption] = useState("");
  const create = useMutation({
    mutationFn: () => api.calendarV2QuickSchedule({
      profile_id: Number(profileId || profiles[0]?.id),
      post_type: type, date: date!, time, caption,
    }),
    onSuccess: () => { toast.success("Post agendado"); setCaption(""); onCreated(); onClose(); },
    onError: () => toast.error("Falha ao agendar"),
  });

  if (!date) return null;
  const title = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="capitalize">{title}</DialogTitle></DialogHeader>

        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Posts do dia</div>
          {posts.length === 0 && <div className="text-sm text-muted-foreground">Nada agendado ainda.</div>}
          {posts.map((p) => (
            <div key={p.id} className={`flex items-center gap-2 rounded border px-2 py-1.5 text-sm ${STATUS_TONE[p.status]}`}>
              <span>{TYPE_ICON[p.type]}</span>
              <span className="font-mono text-xs">{p.time}</span>
              <span className="truncate">{p.caption}</span>
            </div>
          ))}
        </div>

        <div className="mt-2 space-y-3 border-t pt-3">
          <div className="text-xs font-semibold uppercase text-muted-foreground">Agendar novo</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Perfil</Label>
              <Select value={profileId || String(profiles[0]?.id ?? "")} onValueChange={setProfileId}>
                <SelectTrigger><SelectValue placeholder="Perfil" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as PostType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="photo">📷 Foto</SelectItem>
                  <SelectItem value="reel">🎬 Reel</SelectItem>
                  <SelectItem value="story">📱 Story</SelectItem>
                  <SelectItem value="carousel">🖼️ Carrossel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Hora</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Legenda</Label>
            <Textarea rows={3} value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Escreva a legenda…" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={!caption || create.isPending}>
              {create.isPending ? "Agendando…" : "Agendar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
