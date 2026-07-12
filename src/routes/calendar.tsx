import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Sparkles, TrendingUp, Trash2, ExternalLink } from "lucide-react";
import { listCalendarPosts, rescheduleCalendarPost, deleteCalendarPost, type CalendarPost } from "@/lib/calendar.functions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendário — InstaBot" },
      { name: "description", content: "Calendário real dos posts agendados: filtros, drag-and-drop entre dias, reagendar e excluir." },
    ],
  }),
  component: CalendarPage,
});

const STATUS_TONE: Record<string, string> = {
  scheduled: "bg-primary/15 text-primary border-primary/30",
  publishing: "bg-info/15 text-info border-info/30",
  published: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Agendado",
  publishing: "Publicando",
  published: "Publicado",
  failed: "Falhou",
};

type Period = "month" | "next30" | "quarter";

function CalendarPage() {
  const qc = useQueryClient();
  const [period, setPeriod] = useState<Period>("month");
  const [profileId, setProfileId] = useState<string>("all");
  const [monthOffset, setMonthOffset] = useState(0);
  const [openDay, setOpenDay] = useState<string | null>(null);

  const range = useMemo(() => {
    const now = new Date();
    if (period === "month") {
      const anchor = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0, 23, 59, 59);
      return { start: anchor.toISOString(), end: end.toISOString(), anchor, endDate: end };
    }
    if (period === "next30") {
      const anchor = new Date(now); anchor.setHours(0, 0, 0, 0);
      const end = new Date(now); end.setDate(end.getDate() + 30); end.setHours(23, 59, 59);
      return { start: anchor.toISOString(), end: end.toISOString(), anchor, endDate: end };
    }
    const qs = Math.floor(now.getMonth() / 3) * 3;
    const anchor = new Date(now.getFullYear(), qs, 1);
    const end = new Date(now.getFullYear(), qs + 3, 0, 23, 59, 59);
    return { start: anchor.toISOString(), end: end.toISOString(), anchor, endDate: end };
  }, [period, monthOffset]);

  const params = useMemo(() => ({
    start: range.start,
    end: range.end,
    profile_id: profileId === "all" ? undefined : profileId,
  }), [range, profileId]);

  const query = useQuery({
    queryKey: ["calendar", params],
    queryFn: () => listCalendarPosts({ data: params }),
    refetchInterval: 60_000,
  });

  const move = useMutation({
    mutationFn: ({ id, date }: { id: string; date: string }) => rescheduleCalendarPost({ data: { id, date } }),
    onSuccess: () => { toast.success("Post reagendado"); qc.invalidateQueries({ queryKey: ["calendar"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const data = query.data;
  const grid = useMemo(
    () => buildGrid(data?.grouped ?? {}, range.anchor, range.endDate),
    [data?.grouped, range.anchor, range.endDate],
  );

  const monthLabel = range.anchor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <CalendarDays className="h-6 w-6 text-primary" /> Calendário
          </h1>
          <p className="text-sm text-muted-foreground">Posts agendados reais — arraste entre dias para reagendar.</p>
        </div>
        <Badge variant="outline" className="capitalize">{monthLabel}</Badge>
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[180px] space-y-1">
            <Label className="text-xs">Período</Label>
            <Select value={period} onValueChange={(v) => { setPeriod(v as Period); setMonthOffset(0); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mês</SelectItem>
                <SelectItem value="next30">Próximos 30 dias</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {period === "month" && (
            <div className="flex items-end gap-1">
              <Button variant="outline" size="sm" onClick={() => setMonthOffset((m) => m - 1)}>◀</Button>
              <Button variant="outline" size="sm" onClick={() => setMonthOffset(0)}>Hoje</Button>
              <Button variant="outline" size="sm" onClick={() => setMonthOffset((m) => m + 1)}>▶</Button>
            </div>
          )}

          <div className="min-w-[220px] space-y-1">
            <Label className="text-xs">Perfil</Label>
            <Select value={profileId} onValueChange={setProfileId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                {(data?.profiles ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>@{p.username}{p.name ? ` — ${p.name}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto">
            <Link to="/schedule"><Button size="sm">+ Novo agendamento</Button></Link>
          </div>
        </CardContent>
      </Card>

      {data?.stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Total" value={data.stats.total} />
          <StatCard label="Agendados" value={data.stats.by_status?.scheduled ?? 0} prefix="⏳" />
          <StatCard label="Publicados" value={data.stats.by_status?.published ?? 0} tone="success" prefix="✅" />
          <StatCard label="Melhor hora" value={data.stats.best_hour ?? "—"} icon={<TrendingUp className="h-4 w-4" />} />
          <StatCard label="Melhor dia" value={translateDay(data.stats.best_day)} icon={<Sparkles className="h-4 w-4" />} />
        </div>
      )}

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
                onDrop={(pid, date) => move.mutate({ id: pid, date })}
                onOpen={() => setOpenDay(cell.iso)}
              />
            ))}
          </div>
          {query.isLoading && <div className="p-4 text-center text-sm text-muted-foreground">Carregando…</div>}
          {query.isError && <div className="p-4 text-center text-sm text-destructive">Erro ao carregar posts.</div>}
        </CardContent>
      </Card>

      <DayModal
        open={!!openDay}
        onClose={() => setOpenDay(null)}
        date={openDay}
        posts={openDay ? (data?.grouped?.[openDay] ?? []) : []}
        onChanged={() => qc.invalidateQueries({ queryKey: ["calendar"] })}
      />
    </div>
  );
}

function StatCard({ label, value, tone, prefix, icon }: { label: string; value: string | number; tone?: "success"; prefix?: string; icon?: React.ReactNode }) {
  const toneClass = tone === "success" ? "text-success" : "text-foreground";
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

type Cell = { iso: string; inRange: boolean; isToday: boolean; posts: CalendarPost[] };

function buildGrid(grouped: Record<string, CalendarPost[]>, anchor: Date, end: Date): Cell[] {
  const todayIso = toIso(new Date());
  const gridStart = new Date(anchor); gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(end); gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));
  const cells: Cell[] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    const iso = toIso(cur);
    cells.push({
      iso,
      inRange: cur >= anchor && cur <= end,
      isToday: iso === todayIso,
      posts: grouped[iso] ?? [],
    });
    cur.setDate(cur.getDate() + 1);
  }
  return cells;
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function translateDay(en: string | null) {
  if (!en) return "—";
  const map: Record<string, string> = { Sunday: "Domingo", Monday: "Segunda", Tuesday: "Terça", Wednesday: "Quarta", Thursday: "Quinta", Friday: "Sexta", Saturday: "Sábado" };
  return map[en] ?? en;
}

function DayCell({ iso, inRange, isToday, posts, onDrop, onOpen }: {
  iso: string; inRange: boolean; isToday: boolean; posts: CalendarPost[];
  onDrop: (postId: string, date: string) => void; onOpen: () => void;
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
        const pid = e.dataTransfer.getData("text/plain");
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
          <div
            key={p.id}
            draggable={p.status !== "published"}
            onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
            onClick={(e) => e.stopPropagation()}
            className={`truncate rounded border px-1.5 py-0.5 text-[10px] font-medium ${STATUS_TONE[p.status] ?? ""} ${p.status === "published" ? "" : "cursor-grab active:cursor-grabbing"}`}
            title={`${p.time} @${p.profile_username} — ${p.caption}`}
          >
            {p.time} @{p.profile_username}
          </div>
        ))}
        {posts.length > 4 && (
          <div className="text-[10px] text-muted-foreground">+{posts.length - 4} mais</div>
        )}
      </div>
    </div>
  );
}

function DayModal({ open, onClose, date, posts, onChanged }: {
  open: boolean; onClose: () => void; date: string | null;
  posts: CalendarPost[]; onChanged: () => void;
}) {
  const del = useMutation({
    mutationFn: (id: string) => deleteCalendarPost({ data: { id } }),
    onSuccess: () => { toast.success("Post removido"); onChanged(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!date) return null;
  const title = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="capitalize">{title}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          {posts.length === 0 && (
            <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nada agendado nesse dia.
              <div className="mt-2"><Link to="/schedule"><Button size="sm">+ Agendar</Button></Link></div>
            </div>
          )}
          {posts.map((p) => (
            <div key={p.id} className="flex gap-3 rounded-lg border p-2">
              <img src={p.image_url} alt="" className="h-16 w-16 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-semibold">{p.time}</span>
                  <Badge variant="outline" className="text-[10px]">@{p.profile_username}</Badge>
                  <Badge className={`text-[10px] ${STATUS_TONE[p.status] ?? ""}`}>{STATUS_LABEL[p.status] ?? p.status}</Badge>
                  {p.platforms.map((pl) => <Badge key={pl} variant="secondary" className="text-[10px]">{pl}</Badge>)}
                </div>
                <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.caption}</div>
                {p.error && <div className="mt-1 text-[10px] text-destructive">Erro: {p.error}</div>}
              </div>
              <div className="flex flex-col gap-1">
                <Link to="/posts"><Button size="sm" variant="ghost" className="h-7 w-7 p-0"><ExternalLink className="h-3.5 w-3.5" /></Button></Link>
                {p.status !== "published" && (
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => del.mutate(p.id)} disabled={del.isPending}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
