// Real IA Campaign Manager — analisa campanhas Meta Ads com Claude Opus 4.8
// via KPA Labz, salva ações em `meta_ai_actions`, aprova/rejeita/executa.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { KPA_MODEL } from "./kpa-ai.functions";

const GRAPH = "https://graph.facebook.com/v21.0";

function sb() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function graph<T = unknown>(
  path: string,
  params: Record<string, string> = {},
  init?: RequestInit,
): Promise<T> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN não configurado");
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (!init || init.method === undefined || init.method === "GET") {
    url.searchParams.set("access_token", token);
    const res = await fetch(url.toString());
    const body = (await res.json()) as { error?: { message?: string } } & Record<string, unknown>;
    if (!res.ok || body?.error) throw new Error(body?.error?.message ?? `Graph ${res.status}`);
    return body as T;
  }
  const form = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => form.set(k, v));
  form.set("access_token", token);
  const res = await fetch(url.origin + url.pathname, { ...init, body: form });
  const body = (await res.json()) as { error?: { message?: string } } & Record<string, unknown>;
  if (!res.ok || body?.error) throw new Error(body?.error?.message ?? `Graph ${res.status}`);
  return body as T;
}

async function callKpa(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>) {
  const key = process.env.KPA_LABZ_API_KEY;
  const base = process.env.KPA_LABZ_BASE_URL;
  if (!key || !base) throw new Error("KPA_LABZ_* não configurado");
  const res = await fetch(`${base.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: KPA_MODEL, messages, temperature: 0.3, max_tokens: 2048 }),
  });
  if (!res.ok) throw new Error(`KPA ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return j.choices[0]?.message?.content ?? "";
}

type Severity = "high" | "info" | "ok";
type ActionType = "pause_campaign" | "resume_campaign" | "change_daily_budget" | "change_lifetime_budget" | "none";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

type Suggestion = {
  severity: Severity;
  title: string;
  description: string;
  action_type: ActionType;
  action_params: { [k: string]: Json };
};

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Resposta da IA sem JSON");
  return JSON.parse(raw.slice(start, end + 1));
}

/** Analisa 1 campanha via Graph API + Claude Opus 4.8, salva sugestões em `meta_ai_actions`. */
export const analyzeRealCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ campaignId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    // 1. Metadata da campanha
    const camp = await graph<{
      id: string; name: string; status: string; effective_status: string; objective: string;
      daily_budget?: string; lifetime_budget?: string; account_id?: string;
    }>(`/${data.campaignId}`, {
      fields: "id,name,status,effective_status,objective,daily_budget,lifetime_budget,account_id",
    });

    // 2. Insights últimos 7 dias
    const ins7 = await graph<{ data: Array<Record<string, string>> }>(`/${data.campaignId}/insights`, {
      fields: "spend,impressions,clicks,reach,ctr,cpc,cpm,frequency",
      date_preset: "last_7d",
    });
    const ins30 = await graph<{ data: Array<Record<string, string>> }>(`/${data.campaignId}/insights`, {
      fields: "spend,impressions,clicks,reach,ctr,cpc,cpm,frequency",
      date_preset: "last_30d",
    });

    const m7 = ins7.data?.[0] ?? {};
    const m30 = ins30.data?.[0] ?? {};

    const metrics = {
      spend: Number(m7.spend ?? 0),
      impressions: Number(m7.impressions ?? 0),
      clicks: Number(m7.clicks ?? 0),
      reach: Number(m7.reach ?? 0),
      ctr: Number(m7.ctr ?? 0),
      cpc: Number(m7.cpc ?? 0),
      cpm: Number(m7.cpm ?? 0),
      frequency: Number(m7.frequency ?? 0),
    };

    const daily_budget = camp.daily_budget ? Number(camp.daily_budget) / 100 : null;
    const lifetime_budget = camp.lifetime_budget ? Number(camp.lifetime_budget) / 100 : null;

    // 3. Prompt para IA — JSON estruturado
    const system = `Você é um especialista sênior em Meta Ads. Analise a campanha e retorne SOMENTE JSON válido no formato:
{
  "summary": "1-2 frases sobre performance",
  "suggestions": [
    {
      "severity": "high" | "info" | "ok",
      "title": "título curto",
      "description": "explicação clara em 1-2 frases com números",
      "action_type": "pause_campaign" | "resume_campaign" | "change_daily_budget" | "change_lifetime_budget" | "none",
      "action_params": { "daily_budget_cents"?: number, "lifetime_budget_cents"?: number }
    }
  ]
}
Regras:
- severity "high" = urgente (CTR muito baixo, gasto alto sem retorno, frequência > 3).
- "change_daily_budget" só se houver daily_budget atual. Valor em CENTAVOS (BRL x100).
- Máx 5 sugestões. Se tudo bem, 1 sugestão com severity "ok" e action_type "none".
- NUNCA envolva em markdown. APENAS o JSON.`;

    const user = `Campanha: ${camp.name}
Status: ${camp.effective_status} · Objetivo: ${camp.objective}
Orçamento diário: ${daily_budget ? `R$ ${daily_budget.toFixed(2)}` : "—"}
Orçamento total: ${lifetime_budget ? `R$ ${lifetime_budget.toFixed(2)}` : "—"}

MÉTRICAS ÚLTIMOS 7 DIAS:
- Gasto: R$ ${metrics.spend.toFixed(2)}
- Impressões: ${metrics.impressions.toLocaleString("pt-BR")}
- Cliques: ${metrics.clicks.toLocaleString("pt-BR")}
- Alcance: ${metrics.reach.toLocaleString("pt-BR")}
- CTR: ${metrics.ctr.toFixed(2)}%
- CPC: R$ ${metrics.cpc.toFixed(2)}
- CPM: R$ ${metrics.cpm.toFixed(2)}
- Frequência: ${metrics.frequency.toFixed(2)}

ÚLTIMOS 30 DIAS (comparação):
- Gasto: R$ ${Number(m30.spend ?? 0).toFixed(2)} · CTR: ${Number(m30.ctr ?? 0).toFixed(2)}% · CPC: R$ ${Number(m30.cpc ?? 0).toFixed(2)}`;

    const aiText = await callKpa([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);

    let parsed: { summary: string; suggestions: Suggestion[] };
    try {
      parsed = extractJson(aiText) as typeof parsed;
    } catch {
      parsed = {
        summary: "IA não conseguiu estruturar a resposta.",
        suggestions: [{
          severity: "info", title: "Resposta livre da IA",
          description: aiText.slice(0, 500), action_type: "none", action_params: {},
        }],
      };
    }

    // 4. Salvar sugestões como ações pendentes
    const supa = sb();
    const rows = (parsed.suggestions ?? []).map((s) => ({
      campaign_id: camp.id,
      campaign_name: camp.name,
      ad_account_id: camp.account_id ?? null,
      severity: s.severity ?? "info",
      title: s.title ?? "Sugestão",
      description: s.description ?? "",
      action_type: s.action_type ?? "none",
      action_params: s.action_params ?? {},
      status: "pending" as const,
    }));

    let inserted: Array<{ id: string }> = [];
    if (rows.length > 0) {
      const { data: ins, error } = await supa.from("meta_ai_actions").insert(rows).select("id");
      if (error) throw new Error(`Insert falhou: ${error.message}`);
      inserted = ins ?? [];
    }

    return {
      campaign_id: camp.id,
      campaign_name: camp.name,
      analyzed_at: new Date().toISOString(),
      metrics,
      summary: parsed.summary,
      suggestions: parsed.suggestions,
      inserted_ids: inserted.map((i) => i.id),
    };
  });

export const listRealAIActions = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await sb()
    .from("meta_ai_actions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
});

/** Aprova e executa uma ação na Graph API. */
export const approveRealAIAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supa = sb();
    const { data: action, error: getErr } = await supa
      .from("meta_ai_actions").select("*").eq("id", data.id).single();
    if (getErr || !action) throw new Error("Ação não encontrada");
    if (action.status !== "pending") throw new Error(`Ação já ${action.status}`);

    let result = "OK";
    const params = (action.action_params ?? {}) as { [k: string]: Json };

    try {
      switch (action.action_type) {
        case "pause_campaign":
          await graph(`/${action.campaign_id}`, { status: "PAUSED" }, { method: "POST" });
          result = "Campanha pausada";
          break;
        case "resume_campaign":
          await graph(`/${action.campaign_id}`, { status: "ACTIVE" }, { method: "POST" });
          result = "Campanha ativada";
          break;
        case "change_daily_budget": {
          const cents = Number(params.daily_budget_cents);
          if (!Number.isFinite(cents) || cents <= 0) throw new Error("daily_budget_cents inválido");
          await graph(`/${action.campaign_id}`, { daily_budget: String(cents) }, { method: "POST" });
          result = `Orçamento diário → R$ ${(cents / 100).toFixed(2)}`;
          break;
        }
        case "change_lifetime_budget": {
          const cents = Number(params.lifetime_budget_cents);
          if (!Number.isFinite(cents) || cents <= 0) throw new Error("lifetime_budget_cents inválido");
          await graph(`/${action.campaign_id}`, { lifetime_budget: String(cents) }, { method: "POST" });
          result = `Orçamento total → R$ ${(cents / 100).toFixed(2)}`;
          break;
        }
        case "none":
          result = "Sem ação executável";
          break;
        default:
          result = `Tipo desconhecido: ${action.action_type}`;
      }
      await supa.from("meta_ai_actions").update({
        status: "executed",
        execution_result: result,
        executed_at: new Date().toISOString(),
      }).eq("id", data.id);
      return { ok: true, result };
    } catch (e) {
      const msg = (e as Error).message;
      await supa.from("meta_ai_actions").update({
        status: "failed",
        execution_result: msg,
        executed_at: new Date().toISOString(),
      }).eq("id", data.id);
      throw new Error(msg);
    }
  });

export const rejectRealAIAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), reason: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await sb().from("meta_ai_actions").update({
      status: "rejected", rejection_reason: data.reason ?? null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const feedbackRealAIAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), rating: z.number().int().min(1).max(5), comment: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const { error } = await sb().from("meta_ai_actions").update({
      feedback_rating: data.rating, feedback_comment: data.comment ?? null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
