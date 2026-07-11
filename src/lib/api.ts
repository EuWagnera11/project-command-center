/**
 * InstaBot API client.
 *
 * When VITE_API_URL is set (e.g. http://localhost:5000), calls go to the real
 * Flask backend. Otherwise every method resolves with mock data so the UI
 * runs standalone in Lovable/preview.
 *
 * Contract mirrors sections 4 & 5 of INSTRUCOES_LOVABLE.md.
 */

import * as mock from "./mock-data";
import type {
  Post, Profile, Template, HashtagGroup, MetaAccount, MetaCampaign,
  MetaKPI, MetaComparison, MetaAlert, Notification, BotStatus, Settings, Backup,
} from "./types";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
export const USE_MOCK = !BASE_URL;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK) throw new Error("mock-only");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

const delay = <T>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export const api = {
  // Health / status
  health: () => USE_MOCK ? delay({ status: "ok", scheduler: true, timestamp: new Date().toISOString() }) : req("/health"),
  status: (): Promise<BotStatus> => USE_MOCK ? delay(mock.mockBotStatus) : req("/api/status"),

  // Posts
  listPosts: (status?: string): Promise<Post[]> => USE_MOCK
    ? delay(status ? mock.mockPosts.filter((p) => p.status === status) : mock.mockPosts)
    : req(`/api/posts${status ? `?status=${status}` : ""}`),
  getPost: (id: number): Promise<Post> => USE_MOCK
    ? delay(mock.mockPosts.find((p) => p.id === id)!)
    : req(`/api/posts/${id}`),
  createPost: (data: FormData | Record<string, unknown>) => USE_MOCK
    ? delay({ success: true, id: Math.floor(Math.random() * 1000) })
    : req("/api/posts", { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data), headers: data instanceof FormData ? {} : undefined }),
  updatePost: (id: number, data: Partial<Post>) => USE_MOCK ? delay({ success: true }) : req(`/api/posts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deletePost: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/posts/${id}`, { method: "DELETE" }),
  publishPost: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/posts/${id}/publish`, { method: "POST" }),
  bulkCreatePosts: (data: FormData) => USE_MOCK ? delay({ success: true, created: 0 }) : fetch(`${BASE_URL}/api/posts/bulk`, { method: "POST", body: data }).then((r) => r.json()),

  // Profiles
  listProfiles: (): Promise<Profile[]> => USE_MOCK ? delay(mock.mockProfiles) : req("/api/profiles"),
  createProfile: (data: { name: string; instagram_username: string }) => USE_MOCK ? delay({ success: true }) : req("/api/profiles", { method: "POST", body: JSON.stringify(data) }),
  deleteProfile: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/profiles/${id}`, { method: "DELETE" }),
  loginProfile: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/profiles/${id}/login/browser`, { method: "POST" }),
  loginStatus: (id: number) => USE_MOCK ? delay({ login_status: "logged_in", success: true }) : req(`/api/profiles/${id}/login/browser/status`),
  logoutProfile: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/profiles/${id}/logout`, { method: "POST" }),

  // Templates & hashtags
  listTemplates: (): Promise<Template[]> => USE_MOCK ? delay(mock.mockTemplates) : req("/api/templates"),
  createTemplate: (data: Omit<Template, "id">) => USE_MOCK ? delay({ success: true }) : req("/api/templates", { method: "POST", body: JSON.stringify(data) }),
  deleteTemplate: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/templates/${id}`, { method: "DELETE" }),
  listHashtags: (): Promise<HashtagGroup[]> => USE_MOCK ? delay(mock.mockHashtags) : req("/api/hashtag-groups"),
  createHashtag: (data: Omit<HashtagGroup, "id">) => USE_MOCK ? delay({ success: true }) : req("/api/hashtag-groups", { method: "POST", body: JSON.stringify(data) }),
  deleteHashtag: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/hashtag-groups/${id}`, { method: "DELETE" }),

  // Calendar / settings
  calendar: (month: string) => USE_MOCK ? delay({ success: true, year: +month.slice(0, 4), month: +month.slice(5, 7), days: {}, total_posts: 0 }) : req(`/api/calendar?month=${month}`),
  getSettings: (): Promise<Settings> => USE_MOCK ? delay(mock.mockSettings) : req("/api/settings"),
  saveSettings: (data: Partial<Settings>) => USE_MOCK ? delay({ success: true }) : req("/api/settings", { method: "POST", body: JSON.stringify(data) }),

  // AI
  generateCaption: (data: { media_path: string; tone: string; context?: string }): Promise<{ caption: string }> =>
    USE_MOCK ? delay({ caption: `[IA] Caption gerada com tom ${data.tone} 🚀 #instabot #ai` }) : req("/api/ai/caption", { method: "POST", body: JSON.stringify(data) }),

  // Notifications
  listNotifications: (limit = 50): Promise<Notification[]> => USE_MOCK ? delay(mock.mockNotifications.slice(0, limit)) : req(`/api/notifications?limit=${limit}`),
  clearNotifications: () => USE_MOCK ? delay({ success: true }) : req("/api/notifications/clear", { method: "POST" }),

  // Backups
  listBackups: (): Promise<Backup[]> => USE_MOCK ? delay(mock.mockBackups) : req("/api/backups"),
  createBackup: () => USE_MOCK ? delay({ success: true }) : req("/api/backups/create", { method: "POST" }),

  // Meta Ads
  metaStatus: () => USE_MOCK ? delay({ configured: true, has_specific_account: false }) : req("/api/meta-ads/status"),
  metaAccounts: (): Promise<MetaAccount[]> => USE_MOCK ? delay(mock.mockMetaAccounts) : req("/api/meta-ads/accounts"),
  metaKPI: (days = 7): Promise<MetaKPI> => USE_MOCK ? delay(mock.mockMetaKPI) : req(`/api/meta-ads/dashboard/kpis?days=${days}`),
  metaComparison: (days = 7): Promise<MetaComparison[]> => USE_MOCK ? delay(mock.mockMetaComparison) : req(`/api/meta-ads/dashboard/comparison?days=${days}`),
  metaTimeseries: (days = 7) => USE_MOCK ? delay(mock.mockMetaTimeseries) : req(`/api/meta-ads/dashboard/timeseries?days=${days}`),
  metaCampaigns: (accountId?: string): Promise<MetaCampaign[]> => USE_MOCK
    ? delay(accountId ? mock.mockCampaigns.filter((c) => c.ad_account_id === accountId) : mock.mockCampaigns)
    : req(`/api/meta-ads/campaigns${accountId ? `?account_id=${accountId}` : ""}`),
  metaAlerts: (): Promise<MetaAlert[]> => USE_MOCK ? delay(mock.mockMetaAlerts) : req("/api/meta-ads/alerts?unresolved=true"),
  metaResolveAlert: (id: number) => USE_MOCK ? delay({ success: true }) : req(`/api/meta-ads/alerts/${id}/resolve`, { method: "POST" }),
  metaCheckAlerts: () => USE_MOCK ? delay({ success: true, new_alerts: 0 }) : req("/api/meta-ads/alerts/check", { method: "POST" }),
  metaAutopause: () => USE_MOCK ? delay({ success: true, paused: 0 }) : req("/api/meta-ads/autopause/check", { method: "POST" }),
  metaWeeklyReport: () => USE_MOCK ? delay({
    summary: "Semana com queda de 12% em impressões, mas CPC caiu 8%. Recomendação: aumentar orçamento nas 2 campanhas de maior CTR.",
    highlights: ["CTR médio 1.21%", "Melhor conta: Wagner Constanteads", "26 campanhas pausadas — revisar"],
  }) : req("/api/meta-ads/report/weekly"),
};

export type Api = typeof api;
