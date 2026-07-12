// Agent Chat — Claude Opus 4.8 (via KPA Labz) com tool-calling.
// Tools: Instagram (listar contas/posts, publicar) + Freepik (gerar/upscale/remover BG).

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const KPA_MODEL = "claude-opus-4-8";
const GRAPH = "https://graph.facebook.com/v21.0";
const FREEPIK = "https://api.freepik.com/v1";

/* ---------- helpers ---------- */

function sb() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function graph<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN não configurado");
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString());
  const body = await res.json();
  if (!res.ok || body?.error) throw new Error(body?.error?.message ?? `Graph ${res.status}`);
  return body as T;
}

async function freepik<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const key = process.env.FREEPIK_API_KEY;
  if (!key) throw new Error("FREEPIK_API_KEY missing");
  const res = await fetch(`${FREEPIK}${path}`, {
    method: init.method ?? "GET",
    headers: {
      "x-freepik-api-key": key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Freepik ${res.status} ${path}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

async function pollFreepikTask(path: string, maxSeconds = 90): Promise<string[]> {
  const start = Date.now();
  while (Date.now() - start < maxSeconds * 1000) {
    await new Promise((r) => setTimeout(r, 3000));
    const res = await freepik<{ data: { status: string; generated?: string[] } }>(path);
    if (res.data.status === "COMPLETED" || res.data.status === "completed") {
      return res.data.generated ?? [];
    }
    if (res.data.status === "FAILED" || res.data.status === "failed") {
      throw new Error("Task falhou no Freepik");
    }
  }
  throw new Error("Timeout aguardando Freepik");
}

/* ---------- Tool definitions (OpenAI/Anthropic tool schema) ---------- */

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_instagram_profiles",
      description: "Lista todas as contas de Instagram Business conectadas ao app.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_instagram_posts",
      description: "Lista os últimos posts publicados de uma conta Instagram (com likes, comments, permalink, caption).",
      parameters: {
        type: "object",
        properties: {
          ig_username: { type: "string", description: "Username sem @. Se omitido, usa a primeira conta ativa." },
          limit: { type: "integer", description: "Quantos posts (1-50)", default: 10 },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "publish_instagram_post",
      description: "PUBLICA IMEDIATAMENTE uma imagem no feed do Instagram. Use só quando o usuário confirmar explicitamente que quer publicar agora.",
      parameters: {
        type: "object",
        properties: {
          ig_username: { type: "string", description: "Username sem @" },
          image_url: { type: "string", description: "URL pública da imagem (jpg/png)" },
          caption: { type: "string", description: "Legenda completa com hashtags" },
        },
        required: ["ig_username", "image_url", "caption"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Gera uma imagem fotorrealista usando Freepik Mystic (leva 20-60s). Retorna URL(s) pública(s).",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Descrição detalhada em inglês (melhor qualidade)" },
          aspect_ratio: {
            type: "string",
            enum: ["square_1_1", "widescreen_16_9", "smartphone_9_16", "portrait_2_3", "classic_4_3"],
            default: "square_1_1",
          },
          resolution: { type: "string", enum: ["1k", "2k", "4k"], default: "2k" },
        },
        required: ["prompt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "upscale_image",
      description: "Faz upscale de uma imagem usando Magnific (2x, 4x, 8x ou 16x). Leva 30-90s.",
      parameters: {
        type: "object",
        properties: {
          image_url: { type: "string" },
          scale_factor: { type: "string", enum: ["2x", "4x", "8x", "16x"], default: "2x" },
        },
        required: ["image_url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_background",
      description: "Remove o fundo de uma imagem. Retorna PNG transparente.",
      parameters: {
        type: "object",
        properties: { image_url: { type: "string" } },
        required: ["image_url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_caption",
      description: "Gera uma legenda para Instagram sobre um tópico, com hashtags e emojis.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string" },
          tone: { type: "string", enum: ["descontraido", "profissional", "engajamento", "informativo"], default: "descontraido" },
          max_length: { type: "integer", default: 500 },
        },
        required: ["topic"],
      },
    },
  },
] as const;

/* ---------- Tool executor ---------- */

async function resolveIgId(username?: string): Promise<{ id: string; username: string } | null> {
  const client = sb();
  if (username) {
    const clean = username.replace(/^@/, "");
    const { data } = await client.from("meta_profiles").select("ig_business_id, ig_username").eq("ig_username", clean).eq("is_active", true).maybeSingle();
    return data ? { id: data.ig_business_id, username: data.ig_username } : null;
  }
  const { data } = await client.from("meta_profiles").select("ig_business_id, ig_username").eq("is_active", true).limit(1);
  const row = data?.[0];
  return row ? { id: row.ig_business_id, username: row.ig_username } : null;
}

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "list_instagram_profiles": {
      const { data, error } = await sb().from("meta_profiles").select("ig_username,ig_name,followers_count,media_count,ig_business_id").eq("is_active", true);
      if (error) throw error;
      return { profiles: data ?? [] };
    }
    case "list_instagram_posts": {
      const target = await resolveIgId(args.ig_username as string | undefined);
      if (!target) return { error: "Nenhuma conta encontrada" };
      const limit = Math.min(Number(args.limit ?? 10), 50);
      const media = await graph<{ data: Array<Record<string, unknown>> }>(`/${target.id}/media`, {
        fields: "id,caption,media_type,permalink,timestamp,like_count,comments_count,media_url,thumbnail_url",
        limit: String(limit),
      });
      return { username: target.username, posts: media.data };
    }
    case "publish_instagram_post": {
      const target = await resolveIgId(args.ig_username as string);
      if (!target) return { error: "Conta não encontrada" };
      const container = await graph<{ id: string }>(`/${target.id}/media`, {
        image_url: args.image_url as string,
        caption: args.caption as string,
      });
      const pub = await graph<{ id: string }>(`/${target.id}/media_publish`, { creation_id: container.id });
      return { success: true, media_id: pub.id, permalink: `https://www.instagram.com/p/${pub.id}` };
    }
    case "generate_image": {
      const task = await freepik<{ data: { task_id: string } }>("/ai/mystic", {
        method: "POST",
        body: {
          prompt: args.prompt,
          aspect_ratio: args.aspect_ratio ?? "square_1_1",
          resolution: args.resolution ?? "2k",
          model: "realism",
          creative_detailing: 33,
          engine: "automatic",
          filter_nsfw: true,
        },
      });
      const urls = await pollFreepikTask(`/ai/mystic/${task.data.task_id}`, 90);
      return { images: urls };
    }
    case "upscale_image": {
      const task = await freepik<{ data: { task_id: string } }>("/ai/image-upscaler", {
        method: "POST",
        body: { image: args.image_url, scale_factor: args.scale_factor ?? "2x" },
      });
      const urls = await pollFreepikTask(`/ai/image-upscaler/${task.data.task_id}`, 120);
      return { images: urls };
    }
    case "remove_background": {
      const res = await freepik<{ data: { url: string } }>("/ai/beta/remove-background", {
        method: "POST",
        body: { image_url: args.image_url },
      });
      return { image: res.data.url };
    }
    case "generate_caption": {
      const res = await callKpa({
        model: KPA_MODEL,
        messages: [
          {
            role: "system",
            content: `Você é copywriter de Instagram. Gere legendas em pt-BR, tom ${args.tone ?? "descontraido"}, com emojis e 5-8 hashtags. Máx ${args.max_length ?? 500} chars. Retorne SÓ a legenda.`,
          },
          { role: "user", content: `Tópico: ${args.topic}` },
        ],
        temperature: 0.85,
        max_tokens: 800,
      });
      return { caption: res.choices[0]?.message?.content?.trim() ?? "" };
    }
    default:
      throw new Error(`Tool desconhecida: ${name}`);
  }
}

/* ---------- KPA call ---------- */

type ChatMsg = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
  name?: string;
};

async function callKpa(body: Record<string, unknown>) {
  const key = process.env.KPA_LABZ_API_KEY;
  const base = process.env.KPA_LABZ_BASE_URL;
  if (!key || !base) throw new Error("KPA_LABZ credentials missing");
  const res = await fetch(`${base.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`KPA ${res.status}: ${text.slice(0, 400)}`);
  }
  return (await res.json()) as {
    choices: Array<{ message: ChatMsg; finish_reason: string }>;
  };
}

/* ---------- Agent loop ---------- */

const SYSTEM_PROMPT = `Você é o assistente do InstaBot, um app de gestão de Instagram Business e Meta Ads.

Você tem ferramentas REAIS conectadas:
- Ver contas Instagram conectadas
- Ver posts publicados (com likes/comments reais)
- Publicar posts no Instagram (só depois de o usuário confirmar)
- Gerar imagens com IA (Freepik Mystic — fotorrealismo)
- Fazer upscale de imagens (Magnific — 2x a 16x)
- Remover fundo de imagens
- Gerar legendas com hashtags

REGRAS:
- SEMPRE use as ferramentas quando o usuário pedir dados reais ou ações — nunca invente números
- ANTES de publicar, mostre a preview (imagem + legenda) e peça confirmação explícita
- Responda em português BR, direto e sem enrolação
- Formate com markdown (listas, negrito, código quando útil)
- Ao gerar imagem, mostre a URL final em markdown: ![alt](url)`;

const AgentInput = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ).min(1),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JsonValue = any;
export type ToolTrace = {
  name: string;
  args: JsonValue;
  result?: JsonValue;
  error?: string;
};

export const agentChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AgentInput.parse(input))
  .handler(async ({ data }) => {
    const conversation: ChatMsg[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...data.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const trace: ToolTrace[] = [];

    for (let step = 0; step < 8; step++) {
      const res = await callKpa({
        model: KPA_MODEL,
        messages: conversation,
        tools: TOOLS,
        temperature: 0.7,
        max_tokens: 2048,
      });
      const msg = res.choices[0]?.message;
      if (!msg) throw new Error("Sem resposta do modelo");

      conversation.push(msg);

      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        return { answer: msg.content ?? "", trace };
      }

      // execute each tool call
      for (const call of msg.tool_calls) {
        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(call.function.arguments || "{}");
        } catch {
          parsedArgs = {};
        }
        const entry: ToolTrace = { name: call.function.name, args: parsedArgs };
        try {
          const result = await executeTool(call.function.name, parsedArgs);
          entry.result = result;
          conversation.push({
            role: "tool",
            tool_call_id: call.id,
            name: call.function.name,
            content: JSON.stringify(result).slice(0, 8000),
          });
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : String(e);
          entry.error = errMsg;
          conversation.push({
            role: "tool",
            tool_call_id: call.id,
            name: call.function.name,
            content: JSON.stringify({ error: errMsg }),
          });
        }
        trace.push(entry);
      }
    }

    return { answer: "⚠️ Muitos passos — encerrando por segurança.", trace };
  });
