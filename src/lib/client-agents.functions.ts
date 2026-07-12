// Per-profile "AI agent" context. Every AI call (kanban, captions, chat)
// should load this and inject it into the system prompt.

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!;

function db() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type ClientAgent = {
  id: string;
  profile_id: string;
  business_description: string;
  tone_of_voice: string;
  language: string;
  target_audience: string;
  goals: string[];
  content_pillars: string[];
  offerings: string;
  hashtags_base: string[];
  brand_keywords: string[];
  do_not_use: string;
  posting_frequency: string;
  extra_context: string;
  is_active: boolean;
};

/** List profiles + their agent (agent may be null if never configured). */
export const listAgents = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = db();
  const { data: profiles, error: pErr } = await supabase
    .from("meta_profiles")
    .select("id, ig_username, ig_name, profile_picture_url, page_name, followers_count")
    .eq("is_active", true)
    .order("ig_username");
  if (pErr) throw new Error(pErr.message);

  const { data: agents, error: aErr } = await supabase
    .from("client_agents")
    .select("*");
  if (aErr) throw new Error(aErr.message);

  const byProfile = new Map((agents ?? []).map((a) => [a.profile_id, a]));
  return (profiles ?? []).map((p) => ({
    profile: p,
    agent: (byProfile.get(p.id) ?? null) as ClientAgent | null,
  }));
});

const AgentInput = z.object({
  profile_id: z.string().uuid(),
  business_description: z.string().default(""),
  tone_of_voice: z.string().default(""),
  language: z.string().default("pt-BR"),
  target_audience: z.string().default(""),
  goals: z.array(z.string()).default([]),
  content_pillars: z.array(z.string()).default([]),
  offerings: z.string().default(""),
  hashtags_base: z.array(z.string()).default([]),
  brand_keywords: z.array(z.string()).default([]),
  do_not_use: z.string().default(""),
  posting_frequency: z.string().default(""),
  extra_context: z.string().default(""),
  is_active: z.boolean().default(true),
});

export const upsertAgent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AgentInput.parse(input))
  .handler(async ({ data }) => {
    const supabase = db();
    const { data: row, error } = await supabase
      .from("client_agents")
      .upsert(data, { onConflict: "profile_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getAgentByProfile = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ profile_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = db();
    const { data: row } = await supabase
      .from("client_agents")
      .select("*")
      .eq("profile_id", data.profile_id)
      .maybeSingle();
    return (row ?? null) as ClientAgent | null;
  });

/**
 * Server-only helper — build the system-prompt block that every AI call
 * (kanban, caption, chat) should prepend so the model stays in-character
 * for that client. Import & call this inside other server functions.
 */
export function renderAgentContext(
  agent: ClientAgent | null,
  profileInfo?: { ig_username?: string; page_name?: string },
): string {
  if (!agent) {
    return profileInfo?.ig_username
      ? `Conta alvo: @${profileInfo.ig_username}. (Sem contexto configurado — use bom senso.)`
      : "(Sem contexto de cliente configurado.)";
  }
  const bullets: string[] = [];
  const push = (label: string, val: string | string[] | undefined) => {
    if (!val) return;
    if (Array.isArray(val)) {
      if (!val.length) return;
      bullets.push(`- ${label}: ${val.join(", ")}`);
    } else if (val.trim()) {
      bullets.push(`- ${label}: ${val.trim()}`);
    }
  };
  push("Conta", profileInfo?.ig_username ? `@${profileInfo.ig_username}` : profileInfo?.page_name);
  push("Idioma", agent.language);
  push("Sobre o negócio", agent.business_description);
  push("Público-alvo", agent.target_audience);
  push("Tom de voz", agent.tone_of_voice);
  push("Objetivos", agent.goals);
  push("Pilares de conteúdo", agent.content_pillars);
  push("Ofertas / produtos", agent.offerings);
  push("Palavras-chave da marca", agent.brand_keywords);
  push("Hashtags base", agent.hashtags_base);
  push("Frequência ideal", agent.posting_frequency);
  push("NÃO USAR / evitar", agent.do_not_use);
  push("Contexto extra", agent.extra_context);

  return [
    "== CONTEXTO DO CLIENTE (siga estritamente) ==",
    ...bullets,
    "== FIM DO CONTEXTO ==",
  ].join("\n");
}
