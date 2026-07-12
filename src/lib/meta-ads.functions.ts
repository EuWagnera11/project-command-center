import { createServerFn } from "@tanstack/react-start";

const GRAPH = "https://graph.facebook.com/v21.0";

async function graph<T = unknown>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new Error("META_ACCESS_TOKEN não configurado");
  const url = new URL(`${GRAPH}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("access_token", token);
  const res = await fetch(url.toString());
  const body = (await res.json()) as { error?: { message?: string } } & Record<string, unknown>;
  if (!res.ok || body?.error) {
    throw new Error(body?.error?.message ?? `Graph API ${res.status}`);
  }
  return body as T;
}

export type RealAdAccount = {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  account_status: number;
  business_name?: string;
  amount_spent: number;
  balance: number;
};

export type RealCampaign = {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective: string;
  daily_budget: number | null;
  lifetime_budget: number | null;
  ad_account_id: string;
  ad_account_name: string;
  insights?: {
    spend: number;
    impressions: number;
    clicks: number;
    reach: number;
    ctr: number;
    cpc: number;
  };
};

export type RealInsightsDaily = { date: string; label: string; spend: number; impressions: number; clicks: number; ctr: number; reach: number };

export const listMetaAdAccounts = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const res = await graph<{ data: Array<{ id: string; account_id: string; name: string; currency: string; account_status: number; business_name?: string; amount_spent: string; balance: string }> }>(
      `/me/adaccounts`,
      { fields: "id,account_id,name,currency,account_status,business_name,amount_spent,balance", limit: "50" },
    );
    return res.data.map((a) => ({
      id: a.id,
      account_id: a.account_id,
      name: a.name,
      currency: a.currency,
      account_status: a.account_status,
      business_name: a.business_name,
      amount_spent: Number(a.amount_spent ?? 0) / 100,
      balance: Number(a.balance ?? 0) / 100,
    })) as RealAdAccount[];
  } catch (e) {
    console.error("[meta] adaccounts:", (e as Error).message);
    return [] as RealAdAccount[];
  }
});

async function fetchInsights(objectId: string, datePreset: string): Promise<{ spend: number; impressions: number; clicks: number; reach: number; ctr: number; cpc: number } | null> {
  try {
    const r = await graph<{ data: Array<{ spend?: string; impressions?: string; clicks?: string; reach?: string; ctr?: string; cpc?: string }> }>(
      `/${objectId}/insights`,
      { fields: "spend,impressions,clicks,reach,ctr,cpc", date_preset: datePreset },
    );
    const row = r.data?.[0];
    if (!row) return null;
    return {
      spend: Number(row.spend ?? 0),
      impressions: Number(row.impressions ?? 0),
      clicks: Number(row.clicks ?? 0),
      reach: Number(row.reach ?? 0),
      ctr: Number(row.ctr ?? 0),
      cpc: Number(row.cpc ?? 0),
    };
  } catch {
    return null;
  }
}

function datePresetFromDays(days: number): string {
  if (days <= 1) return "yesterday";
  if (days <= 7) return "last_7d";
  if (days <= 14) return "last_14d";
  if (days <= 30) return "last_30d";
  if (days <= 90) return "last_90d";
  return "last_90d";
}

export const listRealCampaigns = createServerFn({ method: "GET" })
  .inputValidator((input: { accountId?: string; days?: number }) => input)
  .handler(async ({ data }) => {
    const days = data.days ?? 7;
    const preset = datePresetFromDays(days);
    const accounts = data.accountId
      ? [{ id: data.accountId.startsWith("act_") ? data.accountId : `act_${data.accountId}`, name: "" } as { id: string; name: string }]
      : (await graph<{ data: Array<{ id: string; name: string }> }>(`/me/adaccounts`, { fields: "id,name", limit: "50" })).data;

    const all: RealCampaign[] = [];
    for (const acc of accounts) {
      try {
        const camps = await graph<{ data: Array<{ id: string; name: string; status: string; effective_status: string; objective: string; daily_budget?: string; lifetime_budget?: string }> }>(
          `/${acc.id}/campaigns`,
          { fields: "id,name,status,effective_status,objective,daily_budget,lifetime_budget", limit: "50" },
        );
        for (const c of camps.data) {
          const insights = await fetchInsights(c.id, preset);
          all.push({
            id: c.id,
            name: c.name,
            status: c.status,
            effective_status: c.effective_status,
            objective: c.objective,
            daily_budget: c.daily_budget ? Number(c.daily_budget) : null,
            lifetime_budget: c.lifetime_budget ? Number(c.lifetime_budget) : null,
            ad_account_id: acc.id,
            ad_account_name: acc.name,
            insights: insights ?? undefined,
          });
        }
      } catch (e) {
        console.error("[meta] campaigns for", acc.id, (e as Error).message);
      }
    }
    return all;
  });

export const getRealMetaKPI = createServerFn({ method: "GET" })
  .inputValidator((input: { days?: number }) => input)
  .handler(async ({ data }) => {
    const days = data.days ?? 7;
    const preset = datePresetFromDays(days);
    try {
      const accounts = (await graph<{ data: Array<{ id: string; account_status: number; balance: string }> }>(`/me/adaccounts`, { fields: "id,account_status,balance", limit: "50" })).data;
      let total_balance = 0;
      let period_spend = 0, period_impressions = 0, period_clicks = 0, period_reach = 0;
      let active_campaigns = 0, paused_campaigns = 0;
      for (const acc of accounts) {
        total_balance += Number(acc.balance ?? 0) / 100;
        const ins = await fetchInsights(acc.id, preset);
        if (ins) {
          period_spend += ins.spend;
          period_impressions += ins.impressions;
          period_clicks += ins.clicks;
          period_reach += ins.reach;
        }
        try {
          const camps = (await graph<{ data: Array<{ effective_status: string }> }>(`/${acc.id}/campaigns`, { fields: "effective_status", limit: "100" })).data;
          for (const c of camps) {
            if (c.effective_status === "ACTIVE") active_campaigns++;
            else paused_campaigns++;
          }
        } catch {}
      }
      const avg_ctr = period_impressions > 0 ? (period_clicks / period_impressions) * 100 : 0;
      const avg_cpc = period_clicks > 0 ? period_spend / period_clicks : 0;
      return {
        total_accounts: accounts.length,
        active_campaigns,
        paused_campaigns,
        total_balance,
        period_spend,
        period_impressions,
        period_clicks,
        period_reach,
        avg_ctr,
        avg_cpc,
      };
    } catch (e) {
      console.error("[meta] kpi:", (e as Error).message);
      return { total_accounts: 0, active_campaigns: 0, paused_campaigns: 0, total_balance: 0, period_spend: 0, period_impressions: 0, period_clicks: 0, period_reach: 0, avg_ctr: 0, avg_cpc: 0 };
    }
  });

export const getRealMetaTimeseries = createServerFn({ method: "GET" })
  .inputValidator((input: { days?: number }) => input)
  .handler(async ({ data }): Promise<RealInsightsDaily[]> => {
    const days = data.days ?? 7;
    try {
      const accounts = (await graph<{ data: Array<{ id: string }> }>(`/me/adaccounts`, { fields: "id", limit: "50" })).data;
      const daily = new Map<string, { spend: number; impressions: number; clicks: number; reach: number }>();
      for (const acc of accounts) {
        try {
          const r = await graph<{ data: Array<{ date_start: string; spend?: string; impressions?: string; clicks?: string; reach?: string }> }>(
            `/${acc.id}/insights`,
            { fields: "spend,impressions,clicks,reach", time_increment: "1", date_preset: datePresetFromDays(days) },
          );
          for (const row of r.data ?? []) {
            const cur = daily.get(row.date_start) ?? { spend: 0, impressions: 0, clicks: 0, reach: 0 };
            cur.spend += Number(row.spend ?? 0);
            cur.impressions += Number(row.impressions ?? 0);
            cur.clicks += Number(row.clicks ?? 0);
            cur.reach += Number(row.reach ?? 0);
            daily.set(row.date_start, cur);
          }
        } catch {}
      }
      return Array.from(daily.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({
          date,
          label: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          spend: v.spend,
          impressions: v.impressions,
          clicks: v.clicks,
          reach: v.reach,
          ctr: v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0,
        }));
    } catch (e) {
      console.error("[meta] timeseries:", (e as Error).message);
      return [];
    }
  });

export const getRealMetaComparison = createServerFn({ method: "GET" })
  .inputValidator((input: { days?: number }) => input)
  .handler(async ({ data }) => {
    const days = data.days ?? 7;
    const preset = datePresetFromDays(days);
    try {
      const accounts = (await graph<{ data: Array<{ id: string; account_id: string; name: string; business_name?: string; amount_spent: string }> }>(
        `/me/adaccounts`,
        { fields: "id,account_id,name,business_name,amount_spent", limit: "50" },
      )).data;
      const out: Array<{ account_id: string; name: string; business_name: string; period_spend: number; period_impressions: number; period_clicks: number; avg_ctr: number; lifetime_spent: number }> = [];
      for (const acc of accounts) {
        const ins = await fetchInsights(acc.id, preset);
        out.push({
          account_id: acc.account_id,
          name: acc.name,
          business_name: acc.business_name ?? "—",
          period_spend: ins?.spend ?? 0,
          period_impressions: ins?.impressions ?? 0,
          period_clicks: ins?.clicks ?? 0,
          avg_ctr: ins?.ctr ?? 0,
          lifetime_spent: Number(acc.amount_spent ?? 0) / 100,
        });
      }
      return out;
    } catch (e) {
      console.error("[meta] comparison:", (e as Error).message);
      return [];
    }
  });

export const listRealAdSetsWithAds = createServerFn({ method: "GET" })
  .inputValidator((input: { campaignId: string }) => input)
  .handler(async ({ data }) => {
    try {
      const adsets = (await graph<{ data: Array<{ id: string; name: string; status: string; effective_status: string; daily_budget?: string; lifetime_budget?: string }> }>(
        `/${data.campaignId}/adsets`,
        { fields: "id,name,status,effective_status,daily_budget,lifetime_budget", limit: "50" },
      )).data;
      const out: Array<{ adset: { id: string; name: string; status: string; daily_budget: number | null }; ads: Array<{ id: string; name: string; status: string; image_url?: string; title?: string; body?: string; permalink?: string }> }> = [];
      for (const adset of adsets) {
        const ads = (await graph<{ data: Array<{ id: string; name: string; status: string; effective_status: string; creative?: { id: string } }> }>(
          `/${adset.id}/ads`,
          { fields: "id,name,status,effective_status,creative{id}", limit: "50" },
        )).data;
        const enrichedAds = [] as Array<{ id: string; name: string; status: string; image_url?: string; title?: string; body?: string }>;
        for (const ad of ads) {
          let image_url: string | undefined, title: string | undefined, body: string | undefined;
          if (ad.creative?.id) {
            try {
              const cr = await graph<{ image_url?: string; thumbnail_url?: string; title?: string; body?: string; object_story_spec?: { link_data?: { image_hash?: string; message?: string; name?: string; picture?: string } } }>(
                `/${ad.creative.id}`,
                { fields: "image_url,thumbnail_url,title,body,object_story_spec" },
              );
              image_url = cr.image_url ?? cr.thumbnail_url ?? cr.object_story_spec?.link_data?.picture;
              title = cr.title ?? cr.object_story_spec?.link_data?.name;
              body = cr.body ?? cr.object_story_spec?.link_data?.message;
            } catch {}
          }
          enrichedAds.push({ id: ad.id, name: ad.name, status: ad.effective_status, image_url, title, body });
        }
        out.push({
          adset: {
            id: adset.id,
            name: adset.name,
            status: adset.effective_status,
            daily_budget: adset.daily_budget ? Number(adset.daily_budget) / 100 : null,
          },
          ads: enrichedAds,
        });
      }
      return out;
    } catch (e) {
      console.error("[meta] adsets:", (e as Error).message);
      return [];
    }
  });
