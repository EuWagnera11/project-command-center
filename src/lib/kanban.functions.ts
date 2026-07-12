// Kanban IA — autonomous content pipeline.
// Flow: briefing -> generating (image + copy) -> review -> scheduled -> published/failed

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY!;

function db() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const KANBAN_COLUMNS = ["briefing", "generating", "review", "scheduled", "published", "failed"] as const;
type KanbanStatus = (typeof KANBAN_COLUMNS)[number];

/* -------- List / CRUD -------- */

export const listBriefs = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = db();
  const { data, error } = await supabase
    .from("kanban_briefs")
    .select("*, meta_profiles(ig_username, profile_picture_url, page_name)")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const createBrief = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        title: z.string().min(1),
        briefing: z.string().min(5),
        reference_urls: z.array(z.string()).default([]),
        profile_id: z.string().uuid().nullable().optional(),
        platforms: z.array(z.enum(["instagram", "facebook"])).default(["instagram"]),
        goal: z.enum(["post", "carrossel", "story", "anuncio"]).default("post"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = db();
    const { data: row, error } = await supabase
      .from("kanban_briefs")
      .insert({
        title: data.title,
        briefing: data.briefing,
        reference_urls: data.reference_urls,
        profile_id: data.profile_id ?? null,
        platforms: data.platforms,
        goal: data.goal,
        status: "briefing",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateBriefStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(KANBAN_COLUMNS),
        position: z.number().int().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = db();
    const patch: Record<string, unknown> = { status: data.status };
    if (typeof data.position === "number") patch.position = data.position;
    const { error } = await supabase.from("kanban_briefs").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBrief = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = db();
    const { error } = await supabase.from("kanban_briefs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateBriefContent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        generated_copy: z.string().optional(),
        generated_image_url: z.string().optional(),
        scheduled_at: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = db();
    const patch: Record<string, unknown> = {};
    if (data.generated_copy !== undefined) patch.generated_copy = data.generated_copy;
    if (data.generated_image_url !== undefined) patch.generated_image_url = data.generated_image_url;
    if (data.scheduled_at !== undefined) patch.scheduled_at = data.scheduled_at;
    const { error } = await supabase.from("kanban_briefs").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* -------- Direct API helpers (server-to-server) -------- */

async function kpaChatDirect(messages: unknown[], opts: { max_tokens?: number; temperature?: number } = {}) {
  const key = process.env.KPA_LABZ_API_KEY!;
  const base = process.env.KPA_LABZ_BASE_URL!;
  const res = await fetch(`${base.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "claude-opus-4-8",
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 2048,
    }),
  });
  if (!res.ok) throw new Error(`KPA ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return json.choices[0]?.message?.content ?? "";
}

async function freepikDirect<T>(path: string, body: unknown) {
  const key = process.env.FREEPIK_API_KEY!;
  const res = await fetch(`https://api.freepik.com/v1${path}`, {
    method: "POST",
    headers: { "x-freepik-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Freepik ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

async function freepikGet<T>(path: string) {
  const key = process.env.FREEPIK_API_KEY!;
  const res = await fetch(`https://api.freepik.com/v1${path}`, {
    headers: { "x-freepik-api-key": key },
  });
  if (!res.ok) throw new Error(`Freepik ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as T;
}

async function pollImagen(taskId: string, maxSec = 90): Promise<string | null> {
  const started = Date.now();
  while (Date.now() - started < maxSec * 1000) {
    const r = await freepikGet<{ data: { status: string; generated: string[] } }>(
      `/ai/text-to-image/imagen3/${taskId}`,
    );
    if (r.data.status === "COMPLETED" && r.data.generated?.length) return r.data.generated[0];
    if (r.data.status === "FAILED") return null;
    await new Promise((r) => setTimeout(r, 3000));
  }
  return null;
}

/* -------- The Agent -------- */

export const runBriefAgent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = db();
    const log: Array<{ step: string; at: string; detail?: string }> = [];
    const addLog = (step: string, detail?: string) => {
      log.push({ step, at: new Date().toISOString(), detail });
    };

    // Move to generating
    const { data: brief, error: fetchErr } = await supabase
      .from("kanban_briefs")
      .select("*")
      .eq("id", data.id)
      .single();
    if (fetchErr || !brief) throw new Error("Brief not found");

    await supabase.from("kanban_briefs").update({ status: "generating", ai_log: log, error: null }).eq("id", data.id);

    try {
      // 1) Analyze briefing with Claude Opus 4.8
      addLog("analyze", "Analisando briefing com Claude Opus 4.8");
      const analysisRaw = await kpaChatDirect([
        {
          role: "system",
          content:
            "Você é um estrategista de conteúdo para Instagram. Analise o briefing e retorne APENAS um JSON válido no formato: " +
            '{"theme":"...","visual_prompt":"prompt em inglês fotorrealista para gerar imagem no Freepik Imagen 3","caption_direction":"tom e ângulo da copy em pt-BR","hashtags":["#tag1","#tag2"],"aspect_ratio":"square_1_1|social_story_9_16|widescreen_16_9"}',
        },
        {
          role: "user",
          content: `Briefing: ${brief.briefing}\n\nObjetivo: ${brief.goal}\nPlataformas: ${(brief.platforms as string[]).join(", ")}${brief.reference_urls?.length ? `\nReferências: ${(brief.reference_urls as string[]).join(", ")}` : ""}`,
        },
      ], { max_tokens: 1200, temperature: 0.6 });

      const jsonMatch = analysisRaw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("IA não retornou JSON válido");
      const analysis = JSON.parse(jsonMatch[0]) as {
        theme: string;
        visual_prompt: string;
        caption_direction: string;
        hashtags: string[];
        aspect_ratio: string;
      };
      addLog("analyzed", analysis.theme);

      // 2) Generate image via Freepik Imagen 3
      addLog("image_start", `Gerando imagem: ${analysis.visual_prompt.slice(0, 80)}...`);
      const imgTask = await freepikDirect<{ data: { task_id: string } }>(
        "/ai/text-to-image/imagen3",
        {
          prompt: analysis.visual_prompt,
          aspect_ratio: analysis.aspect_ratio || "square_1_1",
          num_images: 1,
          person_generation: "allow_all",
        },
      );
      const imageUrl = await pollImagen(imgTask.data.task_id);
      if (!imageUrl) throw new Error("Freepik não retornou imagem");
      addLog("image_done", imageUrl);

      // 3) Generate final caption via Claude
      addLog("copy_start", "Escrevendo copy final");
      const copy = await kpaChatDirect([
        {
          role: "system",
          content:
            "Você escreve legendas de Instagram em português brasileiro. Retorne APENAS a legenda pronta pra postar, sem prefixos, com emojis se apropriado, e hashtags no final.",
        },
        {
          role: "user",
          content: `Tema: ${analysis.theme}\nDireção: ${analysis.caption_direction}\nHashtags sugeridas: ${analysis.hashtags.join(" ")}\nBriefing original: ${brief.briefing}`,
        },
      ], { max_tokens: 800, temperature: 0.8 });
      addLog("copy_done", `${copy.length} chars`);

      // 4) Move to review
      await supabase
        .from("kanban_briefs")
        .update({
          status: "review",
          ai_analysis: analysis,
          generated_copy: copy.trim(),
          generated_image_url: imageUrl,
          ai_log: log,
        })
        .eq("id", data.id);

      return { ok: true, image_url: imageUrl, copy };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog("error", msg);
      await supabase
        .from("kanban_briefs")
        .update({ status: "failed", error: msg, ai_log: log })
        .eq("id", data.id);
      throw new Error(msg);
    }
  });

/* -------- Approve to schedule -------- */

export const approveBriefToSchedule = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        scheduled_at: z.string(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const supabase = db();
    const { data: brief, error: fErr } = await supabase
      .from("kanban_briefs")
      .select("*")
      .eq("id", data.id)
      .single();
    if (fErr || !brief) throw new Error("Brief not found");
    if (!brief.profile_id) throw new Error("Perfil não definido no briefing");
    if (!brief.generated_image_url || !brief.generated_copy)
      throw new Error("Copy ou imagem não geradas ainda");

    const { data: post, error: pErr } = await supabase
      .from("scheduled_posts")
      .insert({
        profile_id: brief.profile_id,
        caption: brief.generated_copy,
        image_url: brief.generated_image_url,
        platforms: brief.platforms,
        scheduled_at: data.scheduled_at,
        status: "scheduled",
      })
      .select("id")
      .single();
    if (pErr) throw new Error(pErr.message);

    await supabase
      .from("kanban_briefs")
      .update({
        status: "scheduled",
        scheduled_at: data.scheduled_at,
        scheduled_post_id: post.id,
      })
      .eq("id", data.id);

    return { ok: true, scheduled_post_id: post.id };
  });
