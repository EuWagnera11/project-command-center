// Freepik API — image generation, upscaling (Magnific), background removal, reimagine.
// Docs: https://docs.freepik.com/
// Auth: header `x-freepik-api-key: <key>`

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BASE = "https://api.freepik.com/v1";

async function freepik<T = unknown>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const key = process.env.FREEPIK_API_KEY;
  if (!key) throw new Error("FREEPIK_API_KEY missing");
  const res = await fetch(`${BASE}${path}`, {
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
    throw new Error(`Freepik ${res.status} ${path}: ${text.slice(0, 500)}`);
  }
  return (await res.json()) as T;
}

/* ========== MYSTIC (highest-quality photorealistic) ========== */
export const freepikMystic = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        prompt: z.string().min(3),
        resolution: z.enum(["1k", "2k", "4k"]).default("2k"),
        aspect_ratio: z
          .enum([
            "square_1_1",
            "widescreen_16_9",
            "traditional_3_4",
            "classic_4_3",
            "smartphone_9_16",
            "portrait_2_3",
            "social_story_9_16",
          ])
          .default("square_1_1"),
        model: z.enum(["realism", "fluid", "zen"]).default("realism"),
        creative_detailing: z.number().int().min(0).max(100).default(33),
        engine: z.enum(["automatic", "magnific_illusio", "magnific_sharpy", "magnific_sparkle"]).default("automatic"),
        filter_nsfw: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    // Mystic is async: returns a task_id you poll.
    const task = await freepik<{ data: { task_id: string; status: string } }>("/ai/mystic", {
      method: "POST",
      body: data,
    });
    return task.data;
  });

export const freepikMysticStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ task_id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const res = await freepik<{ data: { task_id: string; status: string; generated: string[] } }>(
      `/ai/mystic/${data.task_id}`,
    );
    return res.data;
  });

/* ========== IMAGEN 3 (Google via Freepik) ========== */
export const freepikImagen3 = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        prompt: z.string().min(3),
        aspect_ratio: z
          .enum(["square_1_1", "social_story_9_16", "widescreen_16_9", "traditional_3_4", "classic_4_3"])
          .default("square_1_1"),
        num_images: z.number().int().min(1).max(4).default(1),
        person_generation: z.enum(["allow_all", "allow_adult", "dont_allow"]).default("allow_all"),
        safety_settings: z.enum(["block_low_and_above", "block_medium_and_above", "block_only_high", "block_none"]).default("block_medium_and_above"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const task = await freepik<{ data: { task_id: string; status: string } }>("/ai/text-to-image/imagen3", {
      method: "POST",
      body: data,
    });
    return task.data;
  });

export const freepikImagen3Status = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ task_id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const res = await freepik<{ data: { task_id: string; status: string; generated: string[] } }>(
      `/ai/text-to-image/imagen3/${data.task_id}`,
    );
    return res.data;
  });

/* ========== FLUX (dev / pro / schnell) ========== */
export const freepikFlux = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        prompt: z.string().min(3),
        variant: z.enum(["flux-dev", "flux-pro-1-1", "flux-schnell"]).default("flux-dev"),
        aspect_ratio: z
          .enum(["square_1_1", "social_story_9_16", "widescreen_16_9", "traditional_3_4", "classic_4_3"])
          .default("square_1_1"),
        num_images: z.number().int().min(1).max(4).default(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const path = `/ai/text-to-image/${data.variant}`;
    const task = await freepik<{ data: { task_id: string; status: string } }>(path, {
      method: "POST",
      body: { prompt: data.prompt, aspect_ratio: data.aspect_ratio, num_images: data.num_images },
    });
    return { ...task.data, variant: data.variant };
  });

/* ========== MAGNIFIC UPSCALER ========== */
export const freepikMagnificUpscale = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        image: z.string().min(10), // base64 or URL
        scale_factor: z.enum(["2x", "4x", "8x", "16x"]).default("2x"),
        engine: z.enum(["automatic", "magnific_illusio", "magnific_sharpy", "magnific_sparkle"]).default("automatic"),
        creativity: z.number().int().min(-10).max(10).default(0),
        hdr: z.number().int().min(-10).max(10).default(0),
        resemblance: z.number().int().min(-10).max(10).default(0),
        fractality: z.number().int().min(-10).max(10).default(0),
        detail_refinement: z.number().int().min(-10).max(10).default(0),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const task = await freepik<{ data: { task_id: string; status: string } }>("/ai/image-upscaler", {
      method: "POST",
      body: data,
    });
    return task.data;
  });

export const freepikMagnificStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ task_id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const res = await freepik<{ data: { task_id: string; status: string; generated: string[] } }>(
      `/ai/image-upscaler/${data.task_id}`,
    );
    return res.data;
  });

/* ========== REMOVE BACKGROUND (sync) ========== */
export const freepikRemoveBg = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ image_url: z.string().url() }).parse(input))
  .handler(async ({ data }) => {
    const res = await freepik<{ data: { url: string; high_resolution: string } }>(
      "/ai/beta/remove-background",
      { method: "POST", body: { image_url: data.image_url } },
    );
    return res.data;
  });

/* ========== REIMAGINE (image-to-image) ========== */
export const freepikReimagine = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        image: z.string().min(10), // base64 or URL
        prompt: z.string().optional(),
        imagination: z.enum(["wild", "subtle", "vivid"]).default("subtle"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const task = await freepik<{ data: { task_id: string; status: string } }>("/ai/beta/reimagine-flux", {
      method: "POST",
      body: data,
    });
    return task.data;
  });

export const freepikReimagineStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ task_id: z.string() }).parse(input))
  .handler(async ({ data }) => {
    const res = await freepik<{ data: { task_id: string; status: string; generated: string[] } }>(
      `/ai/beta/reimagine-flux/${data.task_id}`,
    );
    return res.data;
  });

/* ========== SEARCH FREEPIK STOCK ========== */
export const freepikSearchStock = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        query: z.string().min(1),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(20),
        content_type: z.enum(["photo", "vector", "psd", "ai"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      term: data.query,
      page: String(data.page),
      limit: String(data.limit),
    });
    if (data.content_type) params.set("filters[content_type][" + data.content_type + "]", "1");
    const res = await freepik<{
      data: Array<{ id: number; title: string; url: string; image: { source: { url: string } } }>;
      meta: { pagination: { total: number; page: number; last_page: number } };
    }>(`/resources?${params.toString()}`);
    return res;
  });
