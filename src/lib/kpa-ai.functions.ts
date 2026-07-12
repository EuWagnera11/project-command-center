// KPA Labz — OpenAI-compatible custom API for text/vision.
// Model: claude-opus-4-8 (Claude Opus 4.8 via KPA Labz proxy).

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const KPA_MODEL = "claude-opus-4-8";

const ChatMessage = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.union([
    z.string(),
    z.array(
      z.union([
        z.object({ type: z.literal("text"), text: z.string() }),
        z.object({
          type: z.literal("image_url"),
          image_url: z.object({ url: z.string() }),
        }),
      ]),
    ),
  ]),
});

const ChatInput = z.object({
  messages: z.array(ChatMessage).min(1),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().int().positive().max(8192).optional(),
  model: z.string().optional(),
});

async function callKpa(body: unknown) {
  const key = process.env.KPA_LABZ_API_KEY;
  const base = process.env.KPA_LABZ_BASE_URL;
  if (!key) throw new Error("KPA_LABZ_API_KEY missing");
  if (!base) throw new Error("KPA_LABZ_BASE_URL missing");
  const url = `${base.replace(/\/$/, "")}/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`KPA ${res.status}: ${text.slice(0, 400)}`);
  }
  return (await res.json()) as {
    choices: Array<{ message: { role: string; content: string }; finish_reason?: string }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  };
}

/** Generic chat completion (text or text+vision). */
export const kpaChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const result = await callKpa({
      model: data.model ?? KPA_MODEL,
      messages: data.messages,
      temperature: data.temperature ?? 0.7,
      max_tokens: data.max_tokens ?? 2048,
    });
    return {
      text: result.choices[0]?.message?.content ?? "",
      usage: result.usage,
    };
  });

/** Instagram caption generator. */
export const kpaGenerateCaption = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string().min(1),
        tone: z.enum(["descontraido", "profissional", "engajamento", "informativo"]).default("descontraido"),
        includeHashtags: z.boolean().default(true),
        includeEmojis: z.boolean().default(true),
        maxLength: z.number().int().positive().max(2200).default(500),
        language: z.string().default("pt-BR"),
        referenceImage: z.string().url().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const system = `Você é copywriter especialista em Instagram. Escreva legendas em ${data.language}, tom ${data.tone}${
      data.includeEmojis ? ", com emojis relevantes" : ", sem emojis"
    }. Máximo ${data.maxLength} caracteres.${
      data.includeHashtags ? " Termine com 5-10 hashtags virais." : " NÃO inclua hashtags."
    } Retorne apenas a legenda, sem explicações.`;

    const userContent = data.referenceImage
      ? [
          { type: "text" as const, text: `Tópico: ${data.topic}` },
          { type: "image_url" as const, image_url: { url: data.referenceImage } },
        ]
      : `Tópico: ${data.topic}`;

    const result = await callKpa({
      model: KPA_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      temperature: 0.85,
      max_tokens: 1024,
    });
    return { caption: result.choices[0]?.message?.content?.trim() ?? "" };
  });

/** Hashtag generator. */
export const kpaGenerateHashtags = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string().min(1),
        count: z.number().int().min(5).max(30).default(15),
        niche: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const result = await callKpa({
      model: KPA_MODEL,
      messages: [
        {
          role: "system",
          content:
            "Você é especialista em SEO do Instagram. Retorne SOMENTE uma linha com hashtags separadas por espaço, sem numeração, sem texto extra.",
        },
        {
          role: "user",
          content: `Gere ${data.count} hashtags virais e relevantes para: ${data.topic}${
            data.niche ? ` (nicho: ${data.niche})` : ""
          }. Misture alcance grande + médio + nichado.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 512,
    });
    const raw = result.choices[0]?.message?.content ?? "";
    const hashtags = raw
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.startsWith("#"));
    return { hashtags };
  });

/** Vision: describe an image / suggest post ideas from it. */
export const kpaAnalyzeImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ imageUrl: z.string().url(), question: z.string().default("Descreva esta imagem para um post no Instagram.") }).parse(input),
  )
  .handler(async ({ data }) => {
    const result = await callKpa({
      model: KPA_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: data.question },
            { type: "image_url", image_url: { url: data.imageUrl } },
          ],
        },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });
    return { description: result.choices[0]?.message?.content ?? "" };
  });
