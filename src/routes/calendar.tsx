import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { api } from "@/lib/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PostTypeBadge, StatusBadge } from "@/components/post-badges";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { Post } from "@/lib/types";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendário — InstaBot" },
      { name: "description", content: "Visualize e gerencie publicações agendadas por data." },
    ],
  }),
  component: CalendarPage,
});

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS = ["dom","seg","ter","qua","qui","sex","sáb"];

function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState<{ day: Date; posts: Post[] } | null>(null);

  const { data: posts } = useQuery({ queryKey: ["posts"], queryFn: () => api.listPosts() });

  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    (posts ?? []).forEach((p) => {
      const d = new Date(p.scheduled_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      map.set(key, [...(map.get(key) ?? []), p]);
    });
    return map;
  }, [posts]);

  const first = new Date(cursor.year, cursor.month, 1);
  const lastDay = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const startOffset = first.getDay();
  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay }, (_, i) => new Date(cursor.year, cursor.month, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const shift = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Agenda"
        title="Calendário"
        subtitle="Visualize e reorganize suas publicações por data"
      />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="min-w-[180px] text-center text-lg font-bold">
              {MONTHS[cursor.month]} {cursor.year}
            </div>
            <Button variant="outline" size="icon" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCursor({ year: today.getFullYear(), month: today.getMonth() })}>
            Hoje
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold uppercase text-muted-foreground">
            {WEEKDAYS.map((w) => <div key={w} className="p-2">{w}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="min-h-24 border-b border-r bg-muted/20" />;
              const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
              const dayPosts = byDay.get(key) ?? [];
              const isToday = day.toDateString() === today.toDateString();
              return (
                <button
                  key={i}
                  onClick={() => dayPosts.length && setSelected({ day, posts: dayPosts })}
                  className={`min-h-24 border-b border-r p-2 text-left transition hover:bg-accent/40 ${isToday ? "bg-primary/5" : ""}`}
                >
                  <div className={`text-xs font-semibold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {day.getDate()}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayPosts.slice(0, 3).map((p) => (
                      <div key={p.id} className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        p.status === "published" ? "bg-success/15 text-success" :
                        p.status === "failed" ? "bg-destructive/15 text-destructive" :
                        "bg-primary/15 text-primary"
                      }`}>
                        {p.post_type === "reel" ? "🎬" : p.post_type === "carousel" ? "🖼" : p.post_type === "story" ? "⭕" : "📷"} @{p.instagram_username}
                      </div>
                    ))}
                    {dayPosts.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{dayPosts.length - 3} mais</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selected && selected.day.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selected?.posts.map((p) => (
              <div key={p.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-ig text-white">
                  {p.post_type === "reel" ? "🎬" : p.post_type === "carousel" ? "🖼" : p.post_type === "story" ? "⭕" : "📷"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <PostTypeBadge type={p.post_type} />
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-xs font-medium">@{p.instagram_username}</div>
                  <div className="mt-1 line-clamp-2 text-sm">{p.caption}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(p.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
