/**
 * InstaBot API client.
 * When VITE_API_URL is set, calls go to the real Flask backend.
 * Otherwise every method resolves with mock data.
 */

import * as mock from "./mock-data";
import type {
  Post, Profile, Template, HashtagGroup, MetaAccount, MetaCampaign,
  MetaKPI, MetaComparison, MetaAlert, Notification, BotStatus, Settings, Backup,
  SharedLink, SharedLinkScope, Organization, ClientDashboardData,
} from "./types";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
export const USE_MOCK = !BASE_URL;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) throw new Error("mock-only");
  const orgId = typeof window !== "undefined" ? localStorage.getItem("instabot-org-id") : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(orgId ? { "X-Org-Id": orgId } : {}),
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

const delay = <T>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms));

// mock stores (mutable)
const state = {
  sharedLinks: [...mock.mockSharedLinks],
  orgs: [...mock.mockOrganizations],
};

const randToken = () => Array.from({ length: 24 }, () => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 62)]).join("");

export const api = {
  health: () => USE_MOCK ? delay({ status: "ok", scheduler: true, timestamp: new Date().toISOString() }) : req("/health"),
  status: (): Promise<BotStatus> => USE_MOCK ? delay(mock.mockBotStatus) : req("/api/status"),

  listPosts: (status?: string): Promise<Post[]> => USE_MOCK
    ? delay(status ? mock.mockPosts.filter((p) => p.status === status) : mock.mockPosts)
    : req(`/api/posts${status ? `?status=${status}` : ""}`),
  getPost: (id: number): Promise<Post> => USE_MOCK ? delay(mock.mockPosts.find((p) => p.id === id)!) : req(`/api/posts/${id}`),
  createPost: (data: FormData | Record<string, unknown>) => USE_MOCK
    ? delay({ success: true, id: Math.floor(Math.random() * 1000) })
    : req("/api/posts", { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data), headers: data instanceof FormData ? {} : undefined }),
  updatePost: (id: number, data: Partial<Post>) => USE_MOCK ? delay({ success: true }) : req(`/api/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePost: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/posts/${id}`, { method: "DELETE" }),
  publishPost: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/posts/${id}/publish`, { method: "POST" }),
  reschedulePost: (id: number, scheduled_at: string) => USE_MOCK ? delay({ success: true }) : req(`/api/posts/${id}/reschedule`, { method: "POST", body: JSON.stringify({ scheduled_at }) }),
  bulkCreatePosts: (data: FormData) => USE_MOCK ? delay({ success: true, created: 0 }) : fetch(`${BASE_URL}/api/posts/bulk`, { method: "POST", body: data }).then((r) => r.json()),

  listProfiles: (): Promise<Profile[]> => USE_MOCK ? delay(mock.mockProfiles) : req("/api/profiles"),
  createProfile: (data: { name: string; instagram_username: string }) => USE_MOCK ? delay({ success: true }) : req("/api/profiles", { method: "POST", body: JSON.stringify(data) }),
  deleteProfile: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/profiles/${id}`, { method: "DELETE" }),
  loginProfile: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/profiles/${id}/login/browser`, { method: "POST" }),
  loginStatus: (id: number) => USE_MOCK ? delay({ login_status: "logged_in", success: true }) : req(`/api/profiles/${id}/login/browser/status`),
  logoutProfile: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/profiles/${id}/logout`, { method: "POST" }),

  listTemplates: (): Promise<Template[]> => USE_MOCK ? delay(mock.mockTemplates) : req("/api/templates"),
  createTemplate: (data: Omit<Template, "id">) => USE_MOCK ? delay({ success: true }) : req("/api/templates", { method: "POST", body: JSON.stringify(data) }),
  deleteTemplate: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/templates/${id}`, { method: "DELETE" }),
  listHashtags: (): Promise<HashtagGroup[]> => USE_MOCK ? delay(mock.mockHashtags) : req("/api/hashtag-groups"),
  createHashtag: (data: Omit<HashtagGroup, "id">) => USE_MOCK ? delay({ success: true }) : req("/api/hashtag-groups", { method: "POST", body: JSON.stringify(data) }),
  deleteHashtag: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/hashtag-groups/${id}`, { method: "DELETE" }),

  calendar: (month: string) => USE_MOCK ? delay({ success: true, year: +month.slice(0, 4), month: +month.slice(5, 7), days: {}, total_posts: 0 }) : req(`/api/calendar?month=${month}`),
  getSettings: (): Promise<Settings> => USE_MOCK ? delay(mock.mockSettings) : req("/api/settings"),
  saveSettings: (data: Partial<Settings>) => USE_MOCK ? delay({ success: true }) : req("/api/settings", { method: "POST", body: JSON.stringify(data) }),

  generateCaption: (data: { media_path: string; tone: string; context?: string }): Promise<{ caption: string }> =>
    USE_MOCK ? delay({ caption: `[IA] Caption gerada com tom ${data.tone} 🚀 #instabot #ai` }) : req("/api/ai/caption", { method: "POST", body: JSON.stringify(data) }),

  suggestSchedule: (profile_id: number): Promise<{ suggestions: Array<{ datetime: string; label: string; score: number }> }> =>
    USE_MOCK ? delay({
      suggestions: [
        { datetime: new Date(Date.now() + 86400000 * 1).toISOString(), label: "Amanhã 09:00", score: 0.92 },
        { datetime: new Date(Date.now() + 86400000 * 1 + 3600000 * 9).toISOString(), label: "Amanhã 18:00", score: 0.88 },
        { datetime: new Date(Date.now() + 86400000 * 2).toISOString(), label: "Quarta 12:00", score: 0.81 },
      ],
    }) : req(`/api/schedule/suggest?profile_id=${profile_id}`),

  listNotifications: (limit = 50): Promise<Notification[]> => USE_MOCK ? delay(mock.mockNotifications.slice(0, limit)) : req(`/api/notifications?limit=${limit}`),
  clearNotifications: () => USE_MOCK ? delay({ success: true }) : req("/api/notifications/clear", { method: "POST" }),

  listBackups: (): Promise<Backup[]> => USE_MOCK ? delay(mock.mockBackups) : req("/api/backups"),
  createBackup: () => USE_MOCK ? delay({ success: true, filename: `instabot_${new Date().toISOString().slice(0, 10)}.db` }) : req("/api/backups/create", { method: "POST" }),
  restoreBackup: (filename: string) => USE_MOCK ? delay({ success: true }) : req(`/api/backups/${filename}/restore`, { method: "POST" }),

  metaStatus: () => USE_MOCK ? delay({ configured: true, has_specific_account: false }) : req("/api/meta-ads/status"),
  metaAccounts: (): Promise<MetaAccount[]> => USE_MOCK ? delay(mock.mockMetaAccounts) : req("/api/meta-ads/accounts"),
  metaKPI: (days = 7): Promise<MetaKPI> => USE_MOCK ? delay(mock.mockMetaKPI) : req(`/api/meta-ads/dashboard/kpis?days=${days}`),
  metaComparison: (days = 7): Promise<MetaComparison[]> => USE_MOCK ? delay(mock.mockMetaComparison) : req(`/api/meta-ads/dashboard/comparison?days=${days}`),
  metaTimeseries: (days = 7): Promise<Array<{ date: string; label: string; spend: number; impressions: number; clicks: number; ctr: number }>> => USE_MOCK ? delay(mock.mockMetaTimeseries) : req(`/api/meta-ads/dashboard/timeseries?days=${days}`),
  metaCampaigns: (accountId?: string): Promise<MetaCampaign[]> => USE_MOCK
    ? delay(accountId ? mock.mockCampaigns.filter((c) => c.ad_account_id === accountId) : mock.mockCampaigns)
    : req(`/api/meta-ads/campaigns${accountId ? `?account_id=${accountId}` : ""}`),
  metaAlerts: (): Promise<MetaAlert[]> => USE_MOCK ? delay(mock.mockMetaAlerts) : req("/api/meta-ads/alerts?unresolved=true"),
  metaResolveAlert: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/meta-ads/alerts/${id}/resolve`, { method: "POST" }),
  metaCheckAlerts: () => USE_MOCK ? delay({ success: true, new_alerts: 0 }) : req("/api/meta-ads/alerts/check", { method: "POST" }),
  metaAutopause: () => USE_MOCK ? delay({ success: true, paused: 0 }) : req("/api/meta-ads/autopause/check", { method: "POST" }),
  metaWeeklyReport: (): Promise<{ summary: string; highlights: string[] }> => USE_MOCK ? delay({
    summary: "Semana com queda de 12% em impressões, mas CPC caiu 8%. Recomendação: aumentar orçamento nas 2 campanhas de maior CTR e pausar 3 conjuntos abaixo de 0,5% CTR.",
    highlights: [
      "CTR médio da semana: 1,21% (+0,08 vs semana anterior)",
      "Melhor conta: Wagner Constanteads — R$ 120 gasto, CTR 1,31%",
      "26 campanhas pausadas — revisar quais podem ser reativadas",
      "Alerta: CA 1 - LojaAds ultrapassou threshold de R$ 150/h",
    ],
  }) : req("/api/meta-ads/report/weekly"),

  // -------- PARTE 10: Shared Links --------
  listSharedLinks: (): Promise<SharedLink[]> => USE_MOCK ? delay([...state.sharedLinks]) : req("/api/shared-links"),
  createSharedLink: (data: { name: string; scope: SharedLinkScope; scope_id?: string; expires_days?: number; password?: string }): Promise<SharedLink> => {
    if (USE_MOCK) {
      const token = randToken();
      const link: SharedLink = {
        id: Date.now(),
        token,
        name: data.name,
        scope: data.scope,
        scope_id: data.scope_id,
        expires_at: data.expires_days ? iso(data.expires_days) : undefined,
        view_password: data.password,
        view_count: 0,
        created_at: new Date().toISOString(),
        is_active: true,
        public_url: `${typeof window !== "undefined" ? window.location.origin : ""}/client/${token}`,
      };
      state.sharedLinks = [link, ...state.sharedLinks];
      return delay(link);
    }
    return req("/api/shared-links", { method: "POST", body: JSON.stringify(data) });
  },
  deleteSharedLink: (id: number) => {
    if (USE_MOCK) { state.sharedLinks = state.sharedLinks.filter((l) => l.id !== id); return delay({ success: true }); }
    return req(`/api/shared-links/${id}`, { method: "DELETE" });
  },
  deactivateSharedLink: (id: number) => {
    if (USE_MOCK) { state.sharedLinks = state.sharedLinks.map((l) => l.id === id ? { ...l, is_active: !l.is_active } : l); return delay({ success: true }); }
    return req(`/api/shared-links/${id}/deactivate`, { method: "POST" });
  },
  getClientDashboard: (token: string): Promise<ClientDashboardData> => USE_MOCK ? delay({
    organization: { name: state.sharedLinks.find(l => l.token === token)?.name ?? "InstaBot Client", primary_color: "#321fdb" },
    kpi: mock.mockMetaKPI,
    campaigns: mock.mockCampaigns,
    timeseries: mock.mockMetaTimeseries,
    scope: state.sharedLinks.find(l => l.token === token)?.scope ?? "overview",
    generated_at: new Date().toISOString(),
  }) : req(`/api/public/client/${token}`),

  // -------- PARTE 10: Organizations --------
  listOrganizations: (): Promise<Organization[]> => USE_MOCK ? delay([...state.orgs]) : req("/api/organizations"),
  createOrganization: (data: { name: string; slug: string; primary_color?: string }): Promise<Organization> => {
    if (USE_MOCK) {
      const org: Organization = { id: Date.now(), name: data.name, slug: data.slug, primary_color: data.primary_color ?? "#321fdb", is_active: true, created_at: new Date().toISOString(), profiles_count: 0, meta_accounts_count: 0 };
      state.orgs = [...state.orgs, org];
      return delay(org);
    }
    return req("/api/organizations", { method: "POST", body: JSON.stringify(data) });
  },
  updateOrganization: (id: number, data: Partial<Organization>) => {
    if (USE_MOCK) { state.orgs = state.orgs.map((o) => o.id === id ? { ...o, ...data } : o); return delay({ success: true }); }
    return req(`/api/organizations/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deleteOrganization: (id: number) => {
    if (USE_MOCK) { state.orgs = state.orgs.map((o) => o.id === id ? { ...o, is_active: false } : o); return delay({ success: true }); }
    return req(`/api/organizations/${id}`, { method: "DELETE" });
  },
  switchOrganization: (id: number) => {
    if (typeof window !== "undefined") localStorage.setItem("instabot-org-id", String(id));
    if (USE_MOCK) return delay({ success: true });
    return req(`/api/organizations/${id}/activate`, { method: "POST" });
  },
};

function iso(dOffset: number) {
  const d = new Date();
  d.setDate(d.getDate() + dOffset);
  return d.toISOString();
}

export type Api = typeof api;
