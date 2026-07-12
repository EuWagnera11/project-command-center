import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GRAPH = "https://graph.facebook.com/v21.0";

type ProfileRow = {
  id: string;
  page_id: string;
  ig_business_id: string;
  ig_username: string;
  ig_name: string | null;
  profile_picture_url: string | null;
  followers_count: number | null;
  follows_count: number | null;
  media_count: number | null;
  last_synced_at: string | null;
};

function sb() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function graph<T = unknown>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN não configurado");
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString());
  const body = await res.json();
  if (!res.ok || body?.error) {
    throw new Error(body?.error?.message ?? `Graph API ${res.status}`);
  }
  return body as T;
}

export const listInstagramProfiles = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await sb().from("meta_profiles").select("*").eq("is_active", true).order("created_at");
  if (error) throw error;
  return (data ?? []) as ProfileRow[];
});

export const listInstagramPosts = createServerFn({ method: "GET" })
  .inputValidator((input: { igBusinessId?: string; limit?: number }) => input)
  .handler(async ({ data }) => {
    // pick first active profile if not specified
    let igId = data.igBusinessId;
    if (!igId) {
      const { data: profiles } = await sb().from("meta_profiles").select("ig_business_id").eq("is_active", true).limit(1);
      igId = profiles?.[0]?.ig_business_id;
      if (!igId) return { posts: [], profile: null };
    }
    const limit = Math.min(data.limit ?? 25, 100);
    const [profile, media] = await Promise.all([
      graph<{ id: string; username: string; name: string; profile_picture_url: string; followers_count: number; media_count: number }>(
        `/${igId}`,
        { fields: "id,username,name,profile_picture_url,followers_count,media_count" },
      ),
      graph<{ data: Array<{ id: string; caption?: string; media_type: string; media_url?: string; thumbnail_url?: string; permalink: string; timestamp: string; like_count?: number; comments_count?: number }> }>(
        `/${igId}/media`,
        { fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count", limit: String(limit) },
      ),
    ]);
    return {
      profile,
      posts: media.data.map((m) => ({
        id: m.id,
        caption: m.caption ?? "",
        media_type: m.media_type,
        media_url: m.media_url ?? m.thumbnail_url ?? "",
        thumbnail_url: m.thumbnail_url,
        permalink: m.permalink,
        timestamp: m.timestamp,
        like_count: m.like_count ?? 0,
        comments_count: m.comments_count ?? 0,
      })),
    };
  });

export const publishInstagramPost = createServerFn({ method: "POST" })
  .inputValidator((input: { igBusinessId: string; imageUrl: string; caption: string }) => input)
  .handler(async ({ data }) => {
    const container = await graph<{ id: string }>(`/${data.igBusinessId}/media`, {
      image_url: data.imageUrl,
      caption: data.caption,
    });
    const published = await graph<{ id: string }>(`/${data.igBusinessId}/media_publish`, {
      creation_id: container.id,
    });
    return { success: true, media_id: published.id };
  });

export const refreshInstagramProfile = createServerFn({ method: "POST" })
  .inputValidator((input: { igBusinessId: string }) => input)
  .handler(async ({ data }) => {
    const fresh = await graph<{ followers_count: number; follows_count: number; media_count: number; name: string; profile_picture_url: string }>(
      `/${data.igBusinessId}`,
      { fields: "followers_count,follows_count,media_count,name,profile_picture_url" },
    );
    const { error } = await sb().from("meta_profiles").update({
      followers_count: fresh.followers_count,
      follows_count: fresh.follows_count,
      media_count: fresh.media_count,
      ig_name: fresh.name,
      profile_picture_url: fresh.profile_picture_url,
      last_synced_at: new Date().toISOString(),
    }).eq("ig_business_id", data.igBusinessId);
    if (error) throw error;
    return { success: true, ...fresh };
  });

