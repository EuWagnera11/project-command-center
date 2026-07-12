import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  listBriefs,
  createBrief,
  updateBriefStatus,
  deleteBrief,
  runBriefAgent,
  approveBriefToSchedule,
  updateBriefContent,
} from "@/lib/kanban.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles, Plus, Trash2, Play, Calendar, Image as ImageIcon, Loader2, X, RefreshCw, AlertCircle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/approvals")({
  component: KanbanPage,
});

type BriefRow = {
  id: string;
  title: string;
  briefing: string;
  reference_urls: string[];
  profile_id: string | null;
  platforms: string[];
  goal: string;
  status: "briefing" | "generating" | "review" | "scheduled" | "published" | "failed";
  ai_analysis: { theme?: string; caption_direction?: string } | null;
  generated_copy: string | null;
  generated_image_url: string | null;
  scheduled_at: string | null;
  error: string | null;
  ai_log: Array<{ step: string; at: string; detail?: string }>;
  meta_profiles: { ig_username: string; profile_picture_url: string | null; page_name: string } | null;
};

const COLUMNS: Array<{ key: BriefRow["status"]; label: string; tint: string }> = [
  { key: "briefing", label: "Briefing", tint: "border-l-4 border-l-blue-500/60" },
  { key: "generating", label: "Gerando com IA", tint: "border-l-4 border-l-purple-500/60" },
  { key: "review", label: "Revisão", tint: "border-l-4 border-l-amber-500/60" },
  { key: "scheduled", label: "Agendado", tint: "border-l-4 border-l-emerald-500/60" },
  { key: "published", label: "Publicado", tint: "border-l-4 border-l-green-600/60" },
  { key: "failed", label: "Falhou", tint: "border-l-4 border-l-red-500/60" },
];

function KanbanPage() {
  const qc = useQueryClient();
  const { data: briefs = [], isLoading, refetch } = useQuery({
    queryKey: ["kanban-briefs"],
    queryFn: () => listBriefs(),
    refetchInterval: 5000,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["meta-profiles-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("meta_profiles")
        .select("id, ig_username, profile_picture_url, page_name")
        .eq("is_active", true);
      return data ?? [];
    },
  });

  const grouped = useMemo(() => {
    const g: Record<string, BriefRow[]> = {};
    for (const col of COLUMNS) g[col.key] = [];
    for (const b of briefs as BriefRow[]) (g[b.status] ??= []).push(b);
    return g;
  }, [briefs]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [selected, setSelected] = useState<BriefRow | null>(null);

  const runAgent = useMutation({
    mutationFn: (id: string) => runBriefAgent({ data: { id } }),
    onSuccess: () => {
      toast.success("Conteúdo gerado — abra para revisar");
      qc.invalidateQueries({ queryKey: ["kanban-briefs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const move = useMutation({
    mutationFn: (v: { id: string; status: BriefRow["status"] }) =>
      updateBriefStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kanban-briefs"] }),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteBrief({ data: { id } }),
    onSuccess: () => {
      toast.success("Removido");
      qc.invalidateQueries({ queryKey: ["kanban-briefs"] });
    },
  });

  const onDrop = (status: BriefRow["status"]) => {
    if (!dragId) return;
    move.mutate({ id: dragId, status });
    setDragId(null);
  };

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" /> Kanban IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Jogue um briefing → IA analisa, gera criativo e copy → você aprova e agenda
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
          </Button>
          <NewBriefDialog profiles={profiles} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div
              key={col.key}
              className="flex w-80 shrink-0 flex-col rounded-lg bg-muted/30"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col.key)}
            >
              <div className="flex items-center justify-between px-3 py-2">
                <div className="text-sm font-semibold">{col.label}</div>
                <Badge variant="secondary">{grouped[col.key]?.length ?? 0}</Badge>
              </div>
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
                {(grouped[col.key] ?? []).map((b) => (
                  <Card
                    key={b.id}
                    draggable
                    onDragStart={() => setDragId(b.id)}
                    onClick={() => setSelected(b)}
                    className={`cursor-grab p-3 ${col.tint} transition hover:shadow-md active:cursor-grabbing`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{b.title}</div>
                        <div className="line-clamp-2 text-xs text-muted-foreground">
                          {b.briefing}
                        </div>
                      </div>
                      {b.generated_image_url && (
                        <img
                          src={b.generated_image_url}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded object-cover"
                        />
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1">
                      {b.meta_profiles && (
                        <Badge variant="outline" className="text-[10px]">
                          @{b.meta_profiles.ig_username}
                        </Badge>
                      )}
                      {b.platforms.map((p) => (
                        <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                      ))}
                      <Badge variant="outline" className="text-[10px]">{b.goal}</Badge>
                    </div>
                    {b.status === "briefing" && (
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          runAgent.mutate(b.id);
                        }}
                        disabled={runAgent.isPending}
                      >
                        {runAgent.isPending && runAgent.variables === b.id ? (
                          <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Rodando...</>
                        ) : (
                          <><Play className="mr-1 h-3 w-3" /> Rodar IA</>
                        )}
                      </Button>
                    )}
                    {b.status === "generating" && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" /> IA trabalhando...
                      </div>
                    )}
                    {b.status === "failed" && b.error && (
                      <div className="mt-2 flex items-start gap-1 text-xs text-red-500">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="line-clamp-2">{b.error}</span>
                      </div>
                    )}
                    {b.status === "scheduled" && b.scheduled_at && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(b.scheduled_at).toLocaleString("pt-BR")}
                      </div>
                    )}
                  </Card>
                ))}
                {(grouped[col.key] ?? []).length === 0 && (
                  <div className="grid place-items-center rounded border border-dashed py-8 text-xs text-muted-foreground">
                    arraste aqui
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <BriefDetailDialog
          brief={selected}
          profiles={profiles}
          onClose={() => setSelected(null)}
          onDelete={() => {
            del.mutate(selected.id);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

/* ---------- New Brief Dialog ---------- */

function NewBriefDialog({ profiles }: { profiles: Array<{ id: string; ig_username: string }> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [briefing, setBriefing] = useState("");
  const [refs, setRefs] = useState("");
  const [profileId, setProfileId] = useState<string | undefined>(profiles[0]?.id);
  const [goal, setGoal] = useState<"post" | "carrossel" | "story" | "anuncio">("post");
  const [ig, setIg] = useState(true);
  const [fb, setFb] = useState(false);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () =>
      createBrief({
        data: {
          title,
          briefing,
          reference_urls: refs.split(/\s+/).filter(Boolean),
          profile_id: profileId ?? null,
          platforms: [ig && "instagram", fb && "facebook"].filter(Boolean) as ("instagram" | "facebook")[],
          goal,
        },
      }),
    onSuccess: () => {
      toast.success("Briefing criado — clique 'Rodar IA' pra começar");
      qc.invalidateQueries({ queryKey: ["kanban-briefs"] });
      setOpen(false);
      setTitle(""); setBriefing(""); setRefs("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Novo Briefing</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Briefing</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Post de terça sobre lançamento" />
          </div>
          <div>
            <Label>Briefing (o que você quer)</Label>
            <Textarea
              rows={5}
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder="Ex: Post sobre viagem de skate pela Serra Gaúcha, tom aventureiro, chamando pra próxima expedição..."
            />
          </div>
          <div>
            <Label>Referências (URLs separadas por espaço)</Label>
            <Textarea
              rows={2}
              value={refs}
              onChange={(e) => setRefs(e.target.value)}
              placeholder="https://... https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Perfil</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>@{p.ig_username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Objetivo</Label>
              <Select value={goal} onValueChange={(v) => setGoal(v as typeof goal)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="carrossel">Carrossel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="anuncio">Anúncio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={ig} onCheckedChange={(v) => setIg(!!v)} /> Instagram
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={fb} onCheckedChange={(v) => setFb(!!v)} /> Facebook
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            disabled={!title || !briefing || !profileId || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Detail Dialog ---------- */

function BriefDetailDialog({
  brief,
  onClose,
  onDelete,
}: {
  brief: BriefRow;
  profiles: Array<{ id: string; ig_username: string }>;
  onClose: () => void;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const [copy, setCopy] = useState(brief.generated_copy ?? "");
  const [when, setWhen] = useState(
    brief.scheduled_at ? brief.scheduled_at.slice(0, 16) : "",
  );

  const saveContent = useMutation({
    mutationFn: () =>
      updateBriefContent({ data: { id: brief.id, generated_copy: copy } }),
    onSuccess: () => {
      toast.success("Copy atualizada");
      qc.invalidateQueries({ queryKey: ["kanban-briefs"] });
    },
  });

  const approve = useMutation({
    mutationFn: () =>
      approveBriefToSchedule({
        data: { id: brief.id, scheduled_at: new Date(when).toISOString() },
      }),
    onSuccess: () => {
      toast.success("Agendado ✅");
      qc.invalidateQueries({ queryKey: ["kanban-briefs"] });
      qc.invalidateQueries({ queryKey: ["scheduled-posts"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rerun = useMutation({
    mutationFn: () => runBriefAgent({ data: { id: brief.id } }),
    onSuccess: () => {
      toast.success("Rodando IA de novo...");
      qc.invalidateQueries({ queryKey: ["kanban-briefs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {brief.title}
            <Badge variant="outline">{brief.status}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Briefing</Label>
              <p className="whitespace-pre-wrap rounded border p-2 text-sm">{brief.briefing}</p>
            </div>
            {brief.ai_analysis?.theme && (
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Análise IA</Label>
                <div className="rounded border bg-muted/30 p-2 text-sm">
                  <div><b>Tema:</b> {brief.ai_analysis.theme}</div>
                  {brief.ai_analysis.caption_direction && (
                    <div className="mt-1"><b>Direção:</b> {brief.ai_analysis.caption_direction}</div>
                  )}
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Copy gerada (editável)</Label>
              <Textarea
                rows={8}
                value={copy}
                onChange={(e) => setCopy(e.target.value)}
                placeholder="Copy será gerada pela IA..."
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => saveContent.mutate()}
                disabled={saveContent.isPending || copy === brief.generated_copy}
              >
                Salvar copy
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Criativo</Label>
              {brief.generated_image_url ? (
                <img
                  src={brief.generated_image_url}
                  alt=""
                  className="w-full rounded border object-cover"
                />
              ) : (
                <div className="grid aspect-square place-items-center rounded border border-dashed text-muted-foreground">
                  <ImageIcon className="h-10 w-10" />
                </div>
              )}
            </div>

            {brief.status === "review" && (
              <div>
                <Label>Agendar para</Label>
                <Input
                  type="datetime-local"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
                <Button
                  className="mt-2 w-full"
                  onClick={() => approve.mutate()}
                  disabled={!when || approve.isPending}
                >
                  {approve.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Aprovar e Agendar
                </Button>
              </div>
            )}

            {brief.ai_log?.length > 0 && (
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Log da IA</Label>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded border bg-muted/30 p-2 text-[11px] font-mono">
                  {brief.ai_log.map((l, i) => (
                    <div key={i}>
                      <span className="text-muted-foreground">
                        {new Date(l.at).toLocaleTimeString("pt-BR")}
                      </span>{" "}
                      <b>{l.step}</b>{l.detail ? `: ${l.detail.slice(0, 100)}` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 flex items-center justify-between sm:justify-between">
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => rerun.mutate()} disabled={rerun.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" /> Rodar IA de novo
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="mr-2 h-4 w-4" /> Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
