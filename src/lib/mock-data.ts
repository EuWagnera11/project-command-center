import type {
  Post, Profile, Template, HashtagGroup, MetaAccount, MetaCampaign,
  MetaKPI, MetaComparison, MetaAlert, Notification, BotStatus, Settings, Backup,
} from "./types";

// -------- Profiles --------
export const mockProfiles: Profile[] = [
  { id: 1, name: "Wagner constanteads", instagram_username: "euwagnera", login_status: "logged_in", last_login_check: "2026-07-11T14:12:00Z" },
  { id: 2, name: "Alves Consultoria", instagram_username: "alvesconsultoriajuridica", login_status: "logged_in", last_login_check: "2026-07-11T13:40:00Z" },
  { id: 3, name: "Refine Cubo", instagram_username: "refine.cubo", login_status: "browser_login" },
];

const now = new Date();
const iso = (dOffset: number, h = 10, m = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + dOffset);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

// -------- Posts --------
export const mockPosts: Post[] = [
  { id: 34, profile_id: 1, media_path: "/uploads/post1.jpg", post_type: "photo", caption: "Segunda começando forte 🚀 Bora conquistar tudo essa semana!", scheduled_at: iso(0, 15, 0), status: "pending", profile_name: "Wagner constanteads", instagram_username: "euwagnera" },
  { id: 33, profile_id: 2, media_path: "/uploads/post2.jpg", post_type: "reel", caption: "Novo case: como reduzimos 40% do CAC de um cliente jurídico.", scheduled_at: iso(0, 18, 30), status: "pending", profile_name: "Alves Consultoria", instagram_username: "alvesconsultoriajuridica" },
  { id: 32, profile_id: 3, media_path: "/uploads/post3.jpg", post_type: "carousel", caption: "5 princípios de design que todo produto SaaS precisa seguir.", scheduled_at: iso(1, 10, 0), status: "pending", profile_name: "Refine Cubo", instagram_username: "refine.cubo" },
  { id: 31, profile_id: 1, media_path: "/uploads/post4.jpg", post_type: "story", caption: "Story rápido — bastidores do escritório", scheduled_at: iso(1, 20, 0), status: "pending", profile_name: "Wagner constanteads", instagram_username: "euwagnera" },
  { id: 30, profile_id: 2, media_path: "/uploads/post5.jpg", post_type: "photo", caption: "Direito digital em 2026 — o que mudou.", scheduled_at: iso(2, 9, 0), status: "pending", profile_name: "Alves Consultoria", instagram_username: "alvesconsultoriajuridica" },
  { id: 29, profile_id: 1, media_path: "/uploads/p6.jpg", post_type: "photo", caption: "Publicado ontem — bom engajamento.", scheduled_at: iso(-1, 10, 0), status: "published", profile_name: "Wagner constanteads", instagram_username: "euwagnera" },
  { id: 28, profile_id: 3, media_path: "/uploads/p7.jpg", post_type: "reel", caption: "Reel do processo criativo.", scheduled_at: iso(-1, 18, 0), status: "published", profile_name: "Refine Cubo", instagram_username: "refine.cubo" },
  { id: 27, profile_id: 2, media_path: "/uploads/p8.jpg", post_type: "photo", caption: "Falha na sessão — refazer login.", scheduled_at: iso(-2, 14, 0), status: "failed", profile_name: "Alves Consultoria", instagram_username: "alvesconsultoriajuridica" },
];

export const mockStats = {
  total: 27,
  published: 17,
  pending: 9,
  failed: 1,
};

// -------- Templates & Hashtags --------
export const mockTemplates: Template[] = [
  { id: 1, name: "Segunda Motivacional", tone: "engajamento", content: "🚀 Bora começar a semana! O que você vai conquistar hoje?" },
  { id: 2, name: "Case Jurídico", tone: "profissional", content: "📋 Novo case: como resolvemos {problema} para nosso cliente." },
  { id: 3, name: "Descontraído SaaS", tone: "descontraido", content: "Alguém aí também não vive sem {ferramenta}? 😂" },
];

export const mockHashtags: HashtagGroup[] = [
  { id: 1, name: "Marketing Digital", hashtags: "#marketingdigital #socialmedia #instagram #agencia #trafegopago" },
  { id: 2, name: "Direito Jurídico", hashtags: "#advocacia #direito #consultoria #juridico #direitodigital" },
  { id: 3, name: "Design & Produto", hashtags: "#uxdesign #productdesign #saas #ui #uidesign #figma" },
];

// -------- Meta Ads --------
export const mockMetaAccounts: MetaAccount[] = [
  { id: "act_1", name: "Wagner Constanteads", business_name: "Wagner Melgarejo", amount_spent: 37954, balance: 0, currency: "BRL", account_status: 1, can_be_used_as_ad_account: true },
  { id: "act_2", name: "CA 1 - LojaAds", business_name: "Henrique Diniz", amount_spent: 339147, balance: 92, currency: "BRL", account_status: 1, can_be_used_as_ad_account: true },
  { id: "act_3", name: "Refine Cubo", business_name: "X1", amount_spent: 0, balance: 0, currency: "BRL", account_status: 1, can_be_used_as_ad_account: true },
  { id: "act_4", name: "CA - 001 LOJA ADS", business_name: "HR Assessoria", amount_spent: 469671, balance: 0, currency: "BRL", account_status: 1, can_be_used_as_ad_account: true },
  { id: "act_5", name: "BM 01", business_name: "Wagner Melgarejo", amount_spent: 152162, balance: 0, currency: "BRL", account_status: 1, can_be_used_as_ad_account: true },
];

export const mockMetaKPI: MetaKPI = {
  total_accounts: 5,
  total_lifetime_spend: 998934,
  total_balance: 92,
  active_campaigns: 0,
  paused_campaigns: 26,
  period_spend: 505.3,
  period_impressions: 14962,
  period_clicks: 181,
  period_reach: 11230,
  avg_ctr: 1.21,
  avg_cpc: 2.79,
  accounts: mockMetaAccounts,
};

export const mockMetaComparison: MetaComparison[] = mockMetaAccounts.map((a, i) => ({
  account_id: a.id,
  name: a.name,
  business_name: a.business_name,
  lifetime_spent: a.amount_spent,
  period_spend: [120, 180, 0, 155, 50][i] ?? 0,
  period_impressions: [3200, 5400, 0, 4900, 1462][i] ?? 0,
  period_clicks: [42, 68, 0, 51, 20][i] ?? 0,
  avg_ctr: [1.31, 1.26, 0, 1.04, 1.37][i] ?? 0,
}));

export const mockMetaAlerts: MetaAlert[] = [
  { id: 1, account_id: "act_2", alert_type: "high_spend", message: "Conta CA 1 - LojaAds ultrapassou R$ 150 na última hora", spend_value: 168.5, threshold: 150, triggered_at: iso(0, 12, 30), resolved: 0 },
  { id: 2, account_id: "act_4", alert_type: "low_ctr", message: "CTR abaixo de 0.5% em CA - 001 LOJA ADS", spend_value: 0.42, threshold: 0.5, triggered_at: iso(0, 9, 15), resolved: 0 },
];

export const mockCampaigns: MetaCampaign[] = [
  { id: "c1", ad_account_id: "act_1", ad_account_name: "Wagner Constanteads", name: "Black Friday 2025 — Loja Wagner", status: "PAUSED", objective: "OUTCOME_SALES", daily_budget: 5000 },
  { id: "c2", ad_account_id: "act_2", ad_account_name: "CA 1 - LojaAds", name: "Remarketing Site — 7d", status: "PAUSED", objective: "OUTCOME_TRAFFIC", daily_budget: 3000 },
  { id: "c3", ad_account_id: "act_4", ad_account_name: "CA - 001 LOJA ADS", name: "Advantage+ Shopping", status: "PAUSED", objective: "OUTCOME_SALES", lifetime_budget: 100000 },
];

// -------- Notifications --------
export const mockNotifications: Notification[] = [
  { timestamp: iso(0, 13, 40), level: "info", title: "Publicação concluída", message: "@euwagnera — post #29 publicado com sucesso" },
  { timestamp: iso(0, 12, 30), level: "warn", title: "Alerta Meta Ads", message: "Alto gasto detectado em CA 1 - LojaAds" },
  { timestamp: iso(-1, 20, 15), level: "error", title: "Falha ao publicar", message: "@alvesconsultoriajuridica — sessão expirada" },
  { timestamp: iso(-1, 8, 0), level: "info", title: "Novo agendamento", message: "3 posts agendados para 11/07" },
];

// -------- Bot / Settings --------
export const mockBotStatus: BotStatus = {
  scheduler_running: true,
  profiles_count: 3,
  profiles_logged_in: 2,
  pending_posts: 9,
  next_post_at: iso(0, 15, 0),
};

export const mockSettings: Settings = {
  media_folder: "C:\\Users\\Wagner\\Instagram\\posts",
  scheduler_timezone: "America/Sao_Paulo",
  min_post_delay: 300,
  scheduler_running: true,
};

export const mockBackups: Backup[] = [
  { filename: "instabot_2026-07-10_23-00.db", size: 2_450_120, created_at: iso(-1, 23, 0), created: "10/07 23:00" },
  { filename: "instabot_2026-07-09_23-00.db", size: 2_331_884, created_at: iso(-2, 23, 0), created: "09/07 23:00" },
];

// 7-day time series for the meta dashboard
export const mockMetaTimeseries = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(now);
  d.setDate(d.getDate() - (6 - i));
  return {
    date: d.toISOString().slice(0, 10),
    label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    spend: [55, 72, 68, 91, 84, 65, 70][i],
    impressions: [1800, 2400, 2100, 2900, 2500, 1800, 1462][i],
    clicks: [22, 30, 26, 34, 28, 20, 21][i],
    ctr: [1.22, 1.25, 1.24, 1.17, 1.12, 1.11, 1.44][i],
  };
});
