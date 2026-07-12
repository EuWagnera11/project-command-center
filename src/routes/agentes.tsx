import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listAgents, upsertAgent, type ClientAgent } from "@/lib/client-agents.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCog, Save, Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agentes")({
  head: () => ({
    meta: [
      { title: "Agentes IA — Contexto por Conta" },
      { name: "description", content: "Configure tom, público e estratégia de cada conta para a IA seguir." },
    ],
  }),
  component: AgentsPage,
});

type Row = {
  profile: {
    id: string;
    ig_username: string;
    ig_name: string | null;
    profile_picture_url: string | null;
    page_name: string;
    followers_count: number | null;
  };
  agent: ClientAgent | null;
};

function AgentsPage() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["client-agents"],
    queryFn: () => listAgents() as Promise<Row[]>,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && rows.length) setSelectedId(rows[0].profile.id);
  }, [rows, selectedId]);

  const current = rows.find((r) => r.profile.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <UserCog className="h-6 w-6 text-primary" /> Agentes IA
        </h1>
        <p className="text-sm text-muted-foreground">
          Cada conta tem seu próprio "cérebro". A IA lê isso antes de gerar qualquer copy, criativo ou análise.
        </p>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="grid place-items-center gap-2 p-10 text-center text-muted-foreground">
          <AlertCircle className="h-8 w-8" />
          Nenhum perfil ativo. Conecte contas em <b>Configurações</b> primeiro.
        </Card>
      ) : (
        <div className="grid flex-1 gap-4 lg:grid-cols-[280px_1fr]">
          {/* Lista */}
          <div className="flex flex-col gap-2">
            {rows.map((r) => {
              const configured = !!r.agent && (
                !!r.agent.business_description ||
                !!r.agent.tone_of_voice ||
                r.agent.content_pillars.length > 0
              );
              return (
                <Card
                  key={r.profile.id}
                  onClick={() => setSelectedId(r.profile.id)}
                  className={`flex cursor-pointer items-center gap-3 p-3 transition hover:shadow-md ${
                    selectedId === r.profile.id ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={r.profile.profile_picture_url ?? undefined} />
                    <AvatarFallback>{r.profile.ig_username.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">@{r.profile.ig_username}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.profile.followers_count?.toLocaleString("pt-BR") ?? 0} seguidores
                    </div>
                  </div>
                  {configured ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Badge variant="outline" className="text-[10px]">vazio</Badge>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Editor */}
          {current && <AgentEditor key={current.profile.id} row={current} />}
        </div>
      )}
    </div>
  );
}

function AgentEditor({ row }: { row: Row }) {
  const qc = useQueryClient();
  const initial = useMemo(
    () => ({
      profile_id: row.profile.id,
      business_description: row.agent?.business_description ?? "",
      tone_of_voice: row.agent?.tone_of_voice ?? "",
      language: row.agent?.language ?? "pt-BR",
      target_audience: row.agent?.target_audience ?? "",
      goals: row.agent?.goals ?? [],
      content_pillars: row.agent?.content_pillars ?? [],
      offerings: row.agent?.offerings ?? "",
      hashtags_base: row.agent?.hashtags_base ?? [],
      brand_keywords: row.agent?.brand_keywords ?? [],
      do_not_use: row.agent?.do_not_use ?? "",
      posting_frequency: row.agent?.posting_frequency ?? "",
      extra_context: row.agent?.extra_context ?? "",
      is_active: row.agent?.is_active ?? true,
    }),
    [row],
  );

  const [form, setForm] = useState(initial);
  useEffect(() => setForm(initial), [initial]);

  const save = useMutation({
    mutationFn: () => upsertAgent({ data: form }),
    onSuccess: () => {
      toast.success("Agente salvo — IA vai usar esse contexto");
      qc.invalidateQueries({ queryKey: ["client-agents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const csvToArr = (v: string) =>
    v.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <Card className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={row.profile.profile_picture_url ?? undefined} />
            <AvatarFallback>{row.profile.ig_username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-lg font-bold">@{row.profile.ig_username}</div>
            <div className="text-xs text-muted-foreground">{row.profile.page_name}</div>
          </div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Agente
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Sobre o negócio" hint="O que a marca faz? Quem é ela em 2 frases.">
          <Textarea rows={3} value={form.business_description}
            onChange={(e) => set("business_description", e.target.value)}
            placeholder="Ex: Sou o Wagner, viajo o Brasil de skate e monto conteúdo de aventura..." />
        </Field>

        <Field label="Público-alvo" hint="Quem consome esse conteúdo?">
          <Textarea rows={3} value={form.target_audience}
            onChange={(e) => set("target_audience", e.target.value)}
            placeholder="Ex: Homens 20-35 que curtem skate, viagem, cultura urbana." />
        </Field>

        <Field label="Tom de voz" hint="Como a marca fala?">
          <Textarea rows={2} value={form.tone_of_voice}
            onChange={(e) => set("tone_of_voice", e.target.value)}
            placeholder="Ex: informal, direto, primeira pessoa, com gíria de skate, sem clichê motivacional." />
        </Field>

        <Field label="Idioma">
          <Input value={form.language} onChange={(e) => set("language", e.target.value)} />
        </Field>

        <Field label="Objetivos (vírgula)" hint="O que a conta precisa alcançar?">
          <Input value={form.goals.join(", ")}
            onChange={(e) => set("goals", csvToArr(e.target.value))}
            placeholder="crescer seguidores, gerar leads, vender curso" />
        </Field>

        <Field label="Pilares de conteúdo (vírgula)" hint="Temas recorrentes.">
          <Input value={form.content_pillars.join(", ")}
            onChange={(e) => set("content_pillars", csvToArr(e.target.value))}
            placeholder="aventura, bastidores, dicas de viagem, patrocinadores" />
        </Field>

        <Field label="Ofertas / produtos" hint="O que a marca vende ou promove.">
          <Textarea rows={2} value={form.offerings}
            onChange={(e) => set("offerings", e.target.value)}
            placeholder="Ex: curso online de skate street R$297, kit merch (bones, moletom)." />
        </Field>

        <Field label="Frequência ideal">
          <Input value={form.posting_frequency}
            onChange={(e) => set("posting_frequency", e.target.value)}
            placeholder="ex: 3 posts/semana, 1 reels por dia" />
        </Field>

        <Field label="Hashtags base (vírgula)" hint="Sempre incluídas nas copies.">
          <Input value={form.hashtags_base.join(", ")}
            onChange={(e) => set("hashtags_base", csvToArr(e.target.value))}
            placeholder="#skatelife, #brasil, #viagemdeskate" />
        </Field>

        <Field label="Palavras-chave da marca (vírgula)">
          <Input value={form.brand_keywords.join(", ")}
            onChange={(e) => set("brand_keywords", csvToArr(e.target.value))}
            placeholder="skate, rua, roll, deck" />
        </Field>

        <Field label="NÃO USAR / evitar" hint="Palavras, temas, tons proibidos." full>
          <Textarea rows={2} value={form.do_not_use}
            onChange={(e) => set("do_not_use", e.target.value)}
            placeholder="Ex: não usar emoji 🙏, não falar de política, evitar clichê 'bora família!'" />
        </Field>

        <Field label="Contexto extra livre" hint="Qualquer coisa que ajude a IA a acertar o tom." full>
          <Textarea rows={4} value={form.extra_context}
            onChange={(e) => set("extra_context", e.target.value)}
            placeholder="Ex: minha próxima expedição é pro Nordeste em fev/2026, meu bordão é 'roll on'..." />
        </Field>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          Esse contexto é injetado em todas as chamadas de IA para <b>@{row.profile.ig_username}</b>: Kanban IA,
          geração de copy no /schedule e /bulk, e Chat IA quando você mencionar essa conta.
        </div>
      </div>
    </Card>
  );
}

function Field({
  label, hint, children, full,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <Label className="text-xs font-semibold uppercase">{label}</Label>
      {hint && <div className="mb-1 text-[11px] text-muted-foreground">{hint}</div>}
      {children}
    </div>
  );
}
