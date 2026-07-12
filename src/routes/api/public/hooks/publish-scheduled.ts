import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const GRAPH = "https://graph.facebook.com/v21.0";

type ScheduledPost = {
  id: string;
  profile_id: string;
  caption: string;
  image_url: string;
  platforms: string[];
  scheduled_at: string;
};

type Profile = {
  id: string;
  page_id: string;
  ig_business_id: string;
};

async function graphPost<T = unknown>(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<T> {
  const url = new URL(`${GRAPH}${path}`);
  const body = new URLSearchParams({ ...params, access_token: token });
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok || json?.error) {
    throw new Error(json?.error?.message ?? `Graph ${res.status}`);
  }
  return json as T;
}

async function graphGet<T = unknown>(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<T> {
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok || json?.error) {
    throw new Error(json?.error?.message ?? `Graph ${res.status}`);
  }
  return json as T;
}

async function publishInstagram(igId: string, imageUrl: string, caption: string, token: string) {
  const container = await graphPost<{ id: string }>(
    `/${igId}/media`,
    { image_url: imageUrl, caption },
    token,
  );
  // wait briefly for container to be ready
  await new Promise((r) => setTimeout(r, 2500));
  const published = await graphPost<{ id: string }>(
    `/${igId}/media_publish`,
    { creation_id: container.id },
    token,
  );
  return published.id;
}

async function publishFacebook(pageId: string, imageUrl: string, caption: string, userToken: string) {
  // Get page access token
  const page = await graphGet<{ access_token: string }>(`/${pageId}`, { fields: "access_token" }, userToken);
  const pageToken = page.access_token;
  const published = await graphPost<{ id: string; post_id?: string }>(
    `/${pageId}/photos`,
    { url: imageUrl, message: caption, published: "true" },
    pageToken,
  );
  return published.post_id ?? published.id;
}

export const Route = createFileRoute("/api/public/hooks/publish-scheduled")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("apikey") ?? request.headers.get("authorization")?.replace("Bearer ", "");
        if (!auth || auth !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const token = process.env.META_ACCESS_TOKEN;
        if (!token) {
          return new Response(JSON.stringify({ error: "META_ACCESS_TOKEN missing" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const admin = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );

        const nowIso = new Date().toISOString();
        const { data: due, error: dueErr } = await admin
          .from("scheduled_posts")
          .select("id, profile_id, caption, image_url, platforms, scheduled_at")
          .eq("status", "scheduled")
          .lte("scheduled_at", nowIso)
          .limit(10);

        if (dueErr) {
          return new Response(JSON.stringify({ error: dueErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const posts = (due ?? []) as ScheduledPost[];
        if (posts.length === 0) {
          return new Response(JSON.stringify({ processed: 0 }), {
            headers: { "Content-Type": "application/json" },
          });
        }

        const results: Array<{ id: string; ok: boolean; error?: string; ig?: string; fb?: string }> = [];

        for (const post of posts) {
          // Mark as publishing to avoid double runs
          await admin.from("scheduled_posts").update({ status: "publishing" }).eq("id", post.id);

          const { data: profile } = await admin
            .from("meta_profiles")
            .select("id, page_id, ig_business_id")
            .eq("id", post.profile_id)
            .maybeSingle();

          if (!profile) {
            await admin.from("scheduled_posts").update({
              status: "failed",
              error: "profile não encontrado",
            }).eq("id", post.id);
            results.push({ id: post.id, ok: false, error: "profile não encontrado" });
            continue;
          }

          const p = profile as Profile;
          let igId: string | undefined;
          let fbId: string | undefined;
          try {
            if (post.platforms.includes("instagram")) {
              igId = await publishInstagram(p.ig_business_id, post.image_url, post.caption, token);
            }
            if (post.platforms.includes("facebook")) {
              fbId = await publishFacebook(p.page_id, post.image_url, post.caption, token);
            }
            await admin.from("scheduled_posts").update({
              status: "published",
              ig_media_id: igId ?? null,
              fb_post_id: fbId ?? null,
              published_at: new Date().toISOString(),
              error: null,
            }).eq("id", post.id);
            results.push({ id: post.id, ok: true, ig: igId, fb: fbId });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            await admin.from("scheduled_posts").update({
              status: "failed",
              error: msg,
            }).eq("id", post.id);
            results.push({ id: post.id, ok: false, error: msg });
          }
        }

        return new Response(JSON.stringify({ processed: posts.length, results }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
