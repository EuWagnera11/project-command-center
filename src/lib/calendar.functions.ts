import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function sb() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export type CalendarPost = {
  id: string;
  profile_id: string;
  profile_username: string;
  scheduled_at: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: string;
  caption: string;
  image_url: string;
  platforms: string[];
  error: string | null;
};

export type CalendarPayload = {
  posts: CalendarPost[];
  grouped: Record<string, CalendarPost[]>;
  profiles: Array<{ id: string; username: string; name: string | null }>;
  stats: {
    total: number;
    by_status: Record<string, number>;
    best_hour: string | null;
    best_day: string | null;
  };
  range: { start: string; end: string };
};

export const listCalendarPosts = createServerFn({ method: "POST" })
  .inputValidator((i: { start?: string; end?: string; profile_id?: string } | undefined) => i ?? {})
  .handler(async ({ data }): Promise<CalendarPayload> => {
    const supabase = sb();
    const now = new Date();
    const start = data.start ?? new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const end = data.end ?? new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59).toISOString();

    let q = supabase
      .from("scheduled_posts")
      .select("id, profile_id, scheduled_at, status, caption, image_url, platforms, error")
      .gte("scheduled_at", start)
      .lte("scheduled_at", end)
      .order("scheduled_at", { ascending: true });
    if (data.profile_id) q = q.eq("profile_id", data.profile_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const { data: profiles, error: pErr } = await supabase
      .from("meta_profiles")
      .select("id, ig_username, ig_name")
      .eq("is_active", true);
    if (pErr) throw new Error(pErr.message);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const posts: CalendarPost[] = (rows ?? []).map((r) => {
      const dt = new Date(r.scheduled_at);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const d = String(dt.getDate()).padStart(2, "0");
      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      const prof = profileMap.get(r.profile_id);
      return {
        id: r.id,
        profile_id: r.profile_id,
        profile_username: prof?.ig_username ?? "?",
        scheduled_at: r.scheduled_at,
        date: `${y}-${m}-${d}`,
        time: `${hh}:${mm}`,
        status: r.status,
        caption: r.caption,
        image_url: r.image_url,
        platforms: r.platforms ?? [],
        error: r.error,
      };
    });

    const grouped: Record<string, CalendarPost[]> = {};
    const byStatus: Record<string, number> = {};
    const hourCount: Record<string, number> = {};
    const dayCount: Record<string, number> = {};
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    for (const p of posts) {
      (grouped[p.date] ??= []).push(p);
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
      hourCount[p.time.slice(0, 2)] = (hourCount[p.time.slice(0, 2)] ?? 0) + 1;
      const dn = dayNames[new Date(p.scheduled_at).getDay()];
      dayCount[dn] = (dayCount[dn] ?? 0) + 1;
    }
    const bestHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const bestDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      posts,
      grouped,
      profiles: (profiles ?? []).map((p) => ({ id: p.id, username: p.ig_username, name: p.ig_name })),
      stats: {
        total: posts.length,
        by_status: byStatus,
        best_hour: bestHour ? `${bestHour}:00` : null,
        best_day: bestDay,
      },
      range: { start, end },
    };
  });

export const rescheduleCalendarPost = createServerFn({ method: "POST" })
  .inputValidator((i: { id: string; date: string; time?: string }) => i)
  .handler(async ({ data }) => {
    const supabase = sb();
    const { data: existing, error: getErr } = await supabase
      .from("scheduled_posts")
      .select("scheduled_at, status")
      .eq("id", data.id)
      .maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!existing) throw new Error("Post não encontrado");
    if (existing.status === "published") throw new Error("Post já foi publicado");

    const prev = new Date(existing.scheduled_at);
    const [h, m] = (data.time ?? `${String(prev.getHours()).padStart(2, "0")}:${String(prev.getMinutes()).padStart(2, "0")}`).split(":");
    const [y, mo, d] = data.date.split("-").map(Number);
    const next = new Date(y, mo - 1, d, Number(h), Number(m));

    const { error } = await supabase
      .from("scheduled_posts")
      .update({ scheduled_at: next.toISOString(), status: "scheduled", error: null })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, scheduled_at: next.toISOString() };
  });

export const deleteCalendarPost = createServerFn({ method: "POST" })
  .inputValidator((i: { id: string }) => i)
  .handler(async ({ data }) => {
    const supabase = sb();
    const { error } = await supabase.from("scheduled_posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
