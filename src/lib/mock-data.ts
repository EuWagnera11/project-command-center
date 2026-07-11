import type {
  Post, Profile, Template, HashtagGroup, MetaAccount, MetaCampaign,
  MetaKPI, MetaComparison, MetaAlert, Notification, BotStatus, Settings, Backup,
  SharedLink, Organization, AIAction, AdSetWithAds, MarketingSkill,
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

export const mockStats = { total: 27, published: 17, pending: 9, failed: 1 };

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
  account_id: a.id, name: a.name, business_name: a.business_name,
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

export const mockNotifications: Notification[] = [
  { timestamp: iso(0, 13, 40), level: "info", title: "Publicação concluída", message: "@euwagnera — post #29 publicado com sucesso" },
  { timestamp: iso(0, 12, 30), level: "warn", title: "Alerta Meta Ads", message: "Alto gasto detectado em CA 1 - LojaAds" },
  { timestamp: iso(-1, 20, 15), level: "error", title: "Falha ao publicar", message: "@alvesconsultoriajuridica — sessão expirada" },
  { timestamp: iso(-1, 8, 0), level: "info", title: "Novo agendamento", message: "3 posts agendados para 11/07" },
];

export const mockBotStatus: BotStatus = {
  scheduler_running: true, profiles_count: 3, profiles_logged_in: 2, pending_posts: 9, next_post_at: iso(0, 15, 0),
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
  { filename: "instabot_2026-07-08_23-00.db", size: 2_212_308, created_at: iso(-3, 23, 0), created: "08/07 23:00" },
];

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

// -------- PARTE 10 --------
export const mockOrganizations: Organization[] = [
  { id: 1, name: "Constanteads (matriz)", slug: "constanteads", primary_color: "#321fdb", is_active: true, created_at: iso(-90), profiles_count: 3, meta_accounts_count: 5 },
  { id: 2, name: "Alves Consultoria", slug: "alves", primary_color: "#8b5cf6", is_active: true, created_at: iso(-45), profiles_count: 1, meta_accounts_count: 1 },
  { id: 3, name: "Refine Cubo", slug: "refine", primary_color: "#14b8a6", is_active: false, created_at: iso(-20), profiles_count: 1, meta_accounts_count: 0 },
];

const publicBase = typeof window !== "undefined" ? window.location.origin : "https://app.local";
export const mockSharedLinks: SharedLink[] = [
  { id: 1, token: "0oVSsl6W1mysi4AhgqzPjaEe", name: "Cliente ACME — Relatório Mensal", scope: "overview", view_count: 12, created_at: iso(-14), last_accessed: iso(-1, 10, 20), is_active: true, expires_at: iso(30), public_url: `${publicBase}/client/0oVSsl6W1mysi4AhgqzPjaEe` },
  { id: 2, token: "7pQxNb2ycDe8Rt5Mn4Ku9Lah", name: "Cliente XYZ — Conta LojaAds", scope: "meta_account", scope_id: "act_2", view_count: 47, created_at: iso(-30), last_accessed: iso(0, 8, 15), view_password: "1234", is_active: true, public_url: `${publicBase}/client/7pQxNb2ycDe8Rt5Mn4Ku9Lah` },
  { id: 3, token: "K3rL9pWmZa2FvHt7QsBd6Xnu", name: "VIP Trimestral", scope: "overview", view_count: 0, created_at: iso(-2), is_active: false, public_url: `${publicBase}/client/K3rL9pWmZa2FvHt7QsBd6Xnu` },
];

// -------- PARTE FINAL: IA + Marketing --------

export const mockAIActions: AIAction[] = [
  { id: 1001, campaign_id: "c2", campaign_name: "Remarketing Site — 7d", type: "pause_campaign", severity: "high", description: "CTR de 0.32% abaixo do threshold. Sugerido pausar e testar novo criativo.", status: "pending", created_at: iso(0, 11, 15) },
  { id: 1002, campaign_id: "c1", campaign_name: "Black Friday 2025 — Loja Wagner", type: "scale_budget", severity: "info", description: "CTR de 3.24% acima do ideal. Sugerido escalar budget em 25%.", status: "pending", created_at: iso(0, 10, 0) },
  { id: 1003, campaign_id: "c3", campaign_name: "Advantage+ Shopping", type: "refine_audience", severity: "info", description: "CPC de R$ 6,20 acima do esperado. Refinar público.", status: "approved", created_at: iso(-1, 15, 30), feedback: { rating: 4, comment: "Boa análise" } },
  { id: 1004, campaign_id: "c1", campaign_name: "Black Friday 2025 — Loja Wagner", type: "healthy", severity: "ok", description: "Performance saudável — nenhuma ação necessária.", status: "executed", created_at: iso(-2, 12, 0) },
  { id: 1005, campaign_id: "c2", campaign_name: "Remarketing Site — 7d", type: "new_creative", severity: "high", description: "Impressões caindo 40% em 3 dias. Renovar criativo.", status: "rejected", created_at: iso(-2, 9, 45), reason: "Já testamos essa hipótese semana passada" },
];

const adImg = (i: number) => `https://picsum.photos/seed/instabot-ad-${i}/280/280`;

export const mockAdSetsWithAds: Record<string, AdSetWithAds[]> = {
  c1: [
    { adset: { id: "as1", name: "Público quente 25-45", status: "ACTIVE", daily_budget: 3000, optimization_goal: "OFFSITE_CONVERSIONS" },
      ads: [
        { id: "ad1", name: "Criativo A - Video", title: "Black Friday é agora 🔥", body: "Descontos de até 70% em toda a loja. Corre!", image_url: adImg(1), status: "ACTIVE" },
        { id: "ad2", name: "Criativo B - Estática", title: "Última chance", body: "Frete grátis para pedidos acima de R$ 199.", image_url: adImg(2), status: "ACTIVE" },
      ] },
    { adset: { id: "as2", name: "Lookalike 1% Compradores", status: "PAUSED", daily_budget: 2000, optimization_goal: "LINK_CLICKS" },
      ads: [
        { id: "ad3", name: "Criativo C - Carrossel", title: "Nossos best-sellers", body: "Deslize e veja os mais vendidos da semana.", image_url: adImg(3), status: "PAUSED" },
      ] },
  ],
  c2: [
    { adset: { id: "as3", name: "Remarketing 7d - Site", status: "PAUSED", daily_budget: 1500, optimization_goal: "LINK_CLICKS" },
      ads: [
        { id: "ad4", name: "RMK - Sem preço", title: "Você esqueceu algo?", body: "Volte e finalize sua compra com um cupom exclusivo.", image_url: adImg(4), status: "PAUSED" },
      ] },
  ],
  c3: [
    { adset: { id: "as4", name: "Advantage+ Auto", status: "PAUSED", optimization_goal: "OFFSITE_CONVERSIONS" },
      ads: [
        { id: "ad5", name: "Dynamic Feed", title: "Recomendado para você", body: "Ofertas personalizadas selecionadas pela IA da Meta.", image_url: adImg(5), status: "PAUSED" },
        { id: "ad6", name: "Reels Vertical", title: "Descubra novidades", body: "Nova coleção de verão disponível agora.", image_url: adImg(6), status: "PAUSED" },
      ] },
  ],
};

export const mockSkills: MarketingSkill[] = [
  { slug: "meta-ads", title: "Meta Ads", description: "Métricas, objetivos e boas práticas de otimização." },
  { slug: "copywriting-frameworks", title: "Copywriting", description: "AIDA, PAS, BAB e hooks para Instagram." },
  { slug: "instagram-algorithm", title: "Algoritmo IG 2025", description: "Como o algoritmo do Instagram funciona hoje." },
  { slug: "traffic-funnels", title: "Funis de tráfego", description: "TOFU/MOFU/BOFU e remarketing." },
  { slug: "social-media-trends-2025", title: "Tendências 2025", description: "Reels, Threads, Shorts, TikTok." },
  { slug: "design-fundamentals", title: "Design Fundamentals", description: "Hierarquia visual, contraste, tipografia." },
  { slug: "analytics-kpis", title: "Analytics & KPIs", description: "Métricas por setor e attribution models." },
  { slug: "lead-generation", title: "Lead Generation", description: "Lead magnets, nutrição e scoring." },
  { slug: "creative-direction", title: "Creative Direction", description: "Briefs, tipos de criativos e testes A/B." },
  { slug: "email-marketing", title: "Email Marketing", description: "Deliverability, segmentação e automação." },
  { slug: "cro-conversion", title: "CRO", description: "Otimização de landing pages e testes A/B." },
  { slug: "pricing-strategy", title: "Pricing Strategy", description: "Freemium, tiers e value-based." },
  { slug: "content-strategy", title: "Content Strategy", description: "Pilares e calendário editorial 80/20." },
  { slug: "sales-automation", title: "Sales Automation", description: "Make, n8n, Zapier e workflows." },
  { slug: "brand-positioning", title: "Brand Positioning", description: "Brand statement e arquétipos." },
];
