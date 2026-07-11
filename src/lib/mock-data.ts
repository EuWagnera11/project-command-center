import type {
  Post, Profile, Template, HashtagGroup, MetaAccount, MetaCampaign,
  MetaKPI, MetaComparison, MetaAlert, Notification, BotStatus, Settings, Backup,
  SharedLink, Organization, AIAction, AdSetWithAds, MarketingSkill,
  EngagementHeatmapCell, TopPostRow, GrowthPoint, AutomationRule, PostApproval,
  CaptionABTest, InboxMessage, MediaLibraryItem, AuditLog, FreepikImage,
  CalendarV2Period, CalendarV2Response, CalendarV2Post, CalendarV2PeriodOption,
  CalendarV2Query, QuickScheduleInput,
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

const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const mockNotifications: Notification[] = [
  { timestamp: ago(12), level: "info", title: "Publicação concluída", message: "@euwagnera — post #29 publicado com sucesso" },
  { timestamp: ago(48), level: "warn", title: "Alerta Meta Ads", message: "Alto gasto detectado em CA 1 - LojaAds" },
  { timestamp: ago(60 * 5 + 10), level: "error", title: "Falha ao publicar", message: "@alvesconsultoriajuridica — sessão expirada" },
  { timestamp: ago(60 * 18), level: "info", title: "Novo agendamento", message: "3 posts agendados para amanhã" },
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

// -------- Fase avançada --------

export const mockHeatmap: EngagementHeatmapCell[] = Array.from({ length: 7 * 24 }, (_, i) => {
  const day = Math.floor(i / 24);
  const hour = i % 24;
  const peak = (hour >= 11 && hour <= 13) || (hour >= 18 && hour <= 21);
  const weekend = day === 0 || day === 6;
  const base = peak ? 60 : hour < 6 ? 5 : 25;
  return { day, hour, score: Math.min(100, Math.round(base + (weekend ? 15 : 0) + Math.random() * 25)) };
});

export const mockTopPosts: TopPostRow[] = [
  { post_id: 29, caption: "Publicado ontem — bom engajamento.", profile_name: "Wagner constanteads", post_type: "photo", likes: 342, comments: 28, reach: 4820, engagement_rate: 7.7, published_at: iso(-1, 10, 0) },
  { post_id: 28, caption: "Reel do processo criativo.", profile_name: "Refine Cubo", post_type: "reel", likes: 918, comments: 76, reach: 12400, engagement_rate: 8.0, published_at: iso(-1, 18, 0) },
  { post_id: 27, caption: "Direito digital em 2026 — o que mudou.", profile_name: "Alves Consultoria", post_type: "photo", likes: 220, comments: 41, reach: 3120, engagement_rate: 8.4, published_at: iso(-2, 14, 0) },
  { post_id: 26, caption: "Dica rápida sobre AIDA em Reels.", profile_name: "Wagner constanteads", post_type: "reel", likes: 611, comments: 52, reach: 8900, engagement_rate: 7.4, published_at: iso(-3, 12, 0) },
  { post_id: 25, caption: "5 princípios para landing pages.", profile_name: "Refine Cubo", post_type: "carousel", likes: 480, comments: 33, reach: 6410, engagement_rate: 8.0, published_at: iso(-4, 9, 0) },
];

export const mockGrowth: GrowthPoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(now); d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toISOString().slice(0, 10),
    followers: 3200 + i * 12 + Math.round(Math.sin(i / 3) * 8),
    reach: 6000 + Math.round(Math.cos(i / 2) * 900) + i * 30,
    engagement: +(4 + Math.sin(i / 4) * 1.2).toFixed(2),
  };
});

export const mockRules: AutomationRule[] = [
  { id: 1, name: "Pausar CTR baixo", description: "Pausar campanhas com CTR < 0.4% por 48h", scope: "campaign", scope_id: "*", metric: "ctr", operator: "<", threshold: 0.4, time_window: "48h", action: "pause_campaign", is_active: true, trigger_count: 12, last_triggered_at: iso(-1, 22, 10) },
  { id: 2, name: "Escalar top performers", description: "Aumentar budget em 25% se CTR > 2.5%", scope: "campaign", scope_id: "*", metric: "ctr", operator: ">", threshold: 2.5, time_window: "7d", action: "scale_budget", is_active: true, trigger_count: 4 },
  { id: 3, name: "Alerta de gasto alto", description: "Notificar se gasto > R$ 200 em 24h", scope: "account", scope_id: "act_2", metric: "spend", operator: ">", threshold: 200, time_window: "24h", action: "notify", is_active: true, trigger_count: 3, last_triggered_at: iso(0, 12, 30) },
  { id: 4, name: "Reduzir budget se CPC alto", description: "Reduzir budget 20% se CPC > R$ 5", scope: "campaign", scope_id: "*", metric: "cpc", operator: ">", threshold: 5, time_window: "24h", action: "reduce_budget", is_active: false, trigger_count: 0 },
];

export const mockApprovals: PostApproval[] = mockPosts.filter(p => p.status === "pending").slice(0, 4).map((p, i) => ({
  id: 200 + i,
  post_id: p.id,
  post: p,
  status: (i === 0 ? "pending" : i === 1 ? "pending" : i === 2 ? "approved" : "rejected") as "pending" | "approved" | "rejected",
  requested_by: "IA",
  requested_at: iso(-1, 9, 0),
  approved_by: i === 2 ? "Wagner" : undefined,
  approved_at: i === 2 ? iso(-1, 10, 0) : undefined,
  rejection_reason: i === 3 ? "Criativo fora do briefing" : undefined,
}));

export const mockABTests: CaptionABTest[] = [
  { id: 1, post_id: 29, caption_a: "Publicado ontem — bom engajamento 🚀", caption_b: "Bora começar bem a semana! 💥", impressions_a: 4200, clicks_a: 68, impressions_b: 4180, clicks_b: 91, ctr_a: 1.62, ctr_b: 2.18, winner: "b", winner_decided_at: iso(-1, 18, 0), status: "decided", created_at: iso(-3) },
  { id: 2, post_id: 28, caption_a: "Reel do processo criativo", caption_b: "Deslize e veja como criamos isso 👇", impressions_a: 2100, clicks_a: 42, impressions_b: 2080, clicks_b: 39, ctr_a: 2.0, ctr_b: 1.87, status: "running", created_at: iso(-1) },
  { id: 3, post_id: 27, caption_a: "5 dicas para atrair clientes premium", caption_b: "Como fechei R$ 50k em 30 dias", impressions_a: 1800, clicks_a: 22, impressions_b: 1750, clicks_b: 51, ctr_a: 1.22, ctr_b: 2.91, winner: "b", winner_decided_at: iso(-2, 12, 0), status: "decided", created_at: iso(-5) },
];

export const mockInbox: InboxMessage[] = [
  { id: 1, profile_id: 1, profile_name: "Wagner", source: "dm", sender: "@ana.mkt", message_text: "Oi! Vocês fazem consultoria para agências pequenas?", ai_reply: "Olá Ana! Sim, atendemos agências de todos os tamanhos. Posso te enviar mais detalhes por aqui?", status: "pending", received_at: ago(15) },
  { id: 2, profile_id: 2, profile_name: "Alves", source: "comment", sender: "@joao.dev", message_text: "Amei o post sobre direito digital 🔥", ai_reply: "Muito obrigado pelo carinho, João! 🙌", status: "sent", received_at: ago(45) },
  { id: 3, profile_id: 1, profile_name: "Wagner", source: "dm", sender: "@maria.ceo", message_text: "Qual é o valor do serviço de gestão de tráfego?", status: "pending", received_at: ago(120) },
  { id: 4, profile_id: 3, profile_name: "Refine", source: "comment", sender: "@design.br", message_text: "Ferramenta usada nesse mockup?", ai_reply: "Usamos Figma + Framer Motion para as animações! 🎨", status: "archived", received_at: ago(360) },
];

export const mockMediaLibrary: MediaLibraryItem[] = Array.from({ length: 12 }, (_, i) => ({
  id: 300 + i,
  name: `media_${i + 1}.${i % 4 === 3 ? "mp4" : "jpg"}`,
  path: `/uploads/media_${i + 1}`,
  url: `https://picsum.photos/seed/instabot-media-${i}/400/400`,
  size: 150_000 + i * 22_000,
  tags: [["produto", "loja"], ["equipe", "bastidor"], ["reel", "video"], ["quote", "motivacional"]][i % 4],
  used: i % 3 !== 0,
  is_video: i % 4 === 3,
  uploaded_at: iso(-i - 1, 10 + i, 0),
}));

export const mockAuditLogs: AuditLog[] = [
  { id: 1, actor: "Wagner", action: "post.publish", target_type: "post", target_id: "29", ip: "192.168.0.10", created_at: ago(30) },
  { id: 2, actor: "IA", action: "campaign.pause", target_type: "campaign", target_id: "c2", meta: { reason: "CTR < 0.4%" }, created_at: ago(120) },
  { id: 3, actor: "Wagner", action: "settings.update", target_type: "settings", target_id: "media_folder", ip: "192.168.0.10", created_at: ago(240) },
  { id: 4, actor: "IA", action: "rule.trigger", target_type: "rule", target_id: "1", meta: { campaign: "c2" }, created_at: ago(300) },
  { id: 5, actor: "Wagner", action: "shared_link.create", target_type: "shared_link", target_id: "1", ip: "192.168.0.10", created_at: ago(600) },
  { id: 6, actor: "Wagner", action: "profile.login_browser", target_type: "profile", target_id: "3", ip: "192.168.0.10", created_at: ago(900) },
  { id: 7, actor: "IA", action: "action.approve", target_type: "campaign", target_id: "c3", meta: { action_id: 1003 }, created_at: ago(1200) },
];

export const mockFreepik: FreepikImage[] = Array.from({ length: 12 }, (_, i) => ({
  id: `fp_${i}`,
  title: ["Business team", "Marketing chart", "Instagram phone", "Ecommerce shop", "Data dashboard", "AI concept", "Coworking", "Growth arrow", "Social icons", "Content creator", "Brand identity", "Digital ads"][i],
  thumbnail_url: `https://picsum.photos/seed/freepik-${i}/280/280`,
  image_url: `https://picsum.photos/seed/freepik-${i}/1024/1024`,
  source: (i < 6 ? "freepik" : i < 10 ? "freepik-ai" : "fallback-picsum") as "freepik" | "freepik-ai" | "fallback-picsum",
}));


// ---------- Canva + IdP ----------
import type {
  CanvaDesign, CanvaIntentLog, CanvaAppStatus,
  OAuthClient, OAuthUser, OAuthToken, IdPStatus,
} from "./types";

const canvaTypes: CanvaDesign["type"][] = ["poster", "social", "video", "doc"];
export const mockCanvaDesigns: CanvaDesign[] = Array.from({ length: 9 }, (_, i) => ({
  id: `DAF${(1000 + i).toString(36).toUpperCase()}`,
  name: [
    "Promo Black Friday", "Feed Semanal — Loja X", "Reel motivacional",
    "Story lançamento", "Post carrossel dicas", "Banner campanha",
    "Post produto novo", "Story enquete", "Feed institucional",
  ][i],
  thumbnail_url: `https://picsum.photos/seed/canva-${i}/400/500`,
  type: canvaTypes[i % 4],
  status: i % 3 === 0 ? "published" : "draft",
  updated_at: ago(60 * (i + 1)),
}));

export const mockCanvaIntents: CanvaIntentLog[] = [
  { id: 1, intent: "publish", design_id: mockCanvaDesigns[0].id, design_name: mockCanvaDesigns[0].name, operation: "publish", status: "ok", created_at: ago(120) },
  { id: 2, intent: "design", design_id: mockCanvaDesigns[1].id, design_name: mockCanvaDesigns[1].name, operation: "edit", status: "ok", created_at: ago(400) },
  { id: 3, intent: "data", design_id: mockCanvaDesigns[2].id, design_name: mockCanvaDesigns[2].name, operation: "read", status: "ok", created_at: ago(900) },
  { id: 4, intent: "publish", design_id: mockCanvaDesigns[3].id, design_name: mockCanvaDesigns[3].name, operation: "publish", status: "error", created_at: ago(1500) },
];

export const mockCanvaStatus: CanvaAppStatus = {
  app_id: "AAHAAH8NpAk",
  connected: true,
  scopes: ["design:read", "design:write", "asset:read", "publish:write"],
  webhook_url: "http://localhost:5000/canva-webhook",
  last_sync: ago(60),
  designs_count: mockCanvaDesigns.length,
};

export const mockOAuthClients: OAuthClient[] = [
  {
    id: 1, client_id: "instabot-canva-app",
    client_secret: "sk_live_" + "•".repeat(56),
    name: "Canva Apps SDK",
    redirect_uris: ["https://www.canva.com/apps/oauth/authorized"],
    scopes: ["openid", "profile", "email", "design:read"],
    is_active: true, created_at: ago(60 * 60 * 24 * 30),
  },
  {
    id: 2, client_id: "zapier-integration",
    client_secret: "sk_live_" + "•".repeat(56),
    name: "Zapier",
    redirect_uris: ["https://zapier.com/dashboard/auth/oauth/return/App123456CLIAPI/"],
    scopes: ["openid", "profile", "posts:read", "posts:write"],
    is_active: true, created_at: ago(60 * 60 * 24 * 10),
  },
  {
    id: 3, client_id: "cli-tool-dev",
    client_secret: "sk_test_" + "•".repeat(56),
    name: "CLI Tool (dev)",
    redirect_uris: ["http://localhost:8765/callback"],
    scopes: ["openid", "posts:read"],
    is_active: false, created_at: ago(60 * 60 * 24 * 3),
  },
];

export const mockOAuthUsers: OAuthUser[] = [
  { username: "wagner", display_name: "Wagner Constante", is_admin: true, created_at: ago(60 * 60 * 24 * 60) },
  { username: "demo", display_name: "Demo User", is_admin: false, created_at: ago(60 * 60 * 24 * 15) },
];

export const mockOAuthTokens: OAuthToken[] = [
  { id: 1, client_id: "instabot-canva-app", username: "wagner", scopes: ["openid", "design:read"], issued_at: ago(300), expires_at: iso(0, 1, 0), revoked: false },
  { id: 2, client_id: "zapier-integration", username: "wagner", scopes: ["posts:read", "posts:write"], issued_at: ago(60 * 60 * 3), expires_at: iso(0, 0, 30), revoked: false },
  { id: 3, client_id: "cli-tool-dev", username: "demo", scopes: ["posts:read"], issued_at: ago(60 * 60 * 24 * 5), expires_at: iso(-4, 0, 0), revoked: true },
];

export const mockIdPStatus: IdPStatus = {
  enabled: true,
  issuer: "http://localhost:5000",
  jwks_url: "http://localhost:5000/.well-known/jwks.json",
  authorize_url: "http://localhost:5000/oauth/authorize",
  token_url: "http://localhost:5000/oauth/token",
  active_tokens: mockOAuthTokens.filter((t) => !t.revoked).length,
  clients_count: mockOAuthClients.length,
  users_count: mockOAuthUsers.length,
};

// ---------- Rodada final ----------
import type {
  AITemplate, DeepAnalysisResult, TranscriptionResult, GoogleIntegrationStatus,
  IntegrationCard, ExportJob, RoleMember, RoleDefinition, MediaTool, VideoEditorTool,
} from "./types";

export const mockAITemplates: AITemplate[] = [
  { id: 1, slug: "caption-venda", title: "Caption de Venda Direta", description: "Copy focada em conversão com CTA claro.", category: "caption", prompt: "Escreva uma caption vendedora para {produto}...", uses: 128 },
  { id: 2, slug: "caption-storytelling", title: "Storytelling", description: "Narrativa emocional em 3 atos.", category: "caption", prompt: "Conte uma história sobre {tema}...", uses: 92 },
  { id: 3, slug: "hashtag-nicho", title: "Hashtags de Nicho", description: "30 hashtags mescladas por volume.", category: "hashtag", prompt: "Gere 30 hashtags para {nicho}...", uses: 210 },
  { id: 4, slug: "hashtag-local", title: "Hashtags Locais", description: "Foco geo (cidade/bairro).", category: "hashtag", prompt: "Gere hashtags locais em {cidade}...", uses: 74 },
  { id: 5, slug: "campanha-lancamento", title: "Campanha de Lançamento", description: "Estrutura 7 dias pré-launch.", category: "campaign", prompt: "Monte um cronograma de 7 dias...", uses: 41 },
  { id: 6, slug: "campanha-blackfriday", title: "Black Friday", description: "Cronograma promocional agressivo.", category: "campaign", prompt: "Plano BF para {loja}...", uses: 58 },
  { id: 7, slug: "analise-concorrente", title: "Análise de Concorrente", description: "Benchmark de 3 perfis.", category: "analysis", prompt: "Analise @{perfil} vs concorrentes...", uses: 33 },
  { id: 8, slug: "analise-engajamento", title: "Diagnóstico de Engajamento", description: "Identifica quedas e picos.", category: "analysis", prompt: "Analise os últimos 30 posts...", uses: 67 },
  { id: 9, slug: "reply-comentario", title: "Resposta a Comentário", description: "Tom humano e empático.", category: "reply", prompt: "Responda ao comentário: {texto}...", uses: 152 },
  { id: 10, slug: "reply-dm", title: "Resposta de DM", description: "Foco em qualificar lead.", category: "reply", prompt: "Responda a DM: {texto}...", uses: 118 },
  { id: 11, slug: "caption-reels", title: "Caption para Reels", description: "Curta, com hook forte.", category: "caption", prompt: "Reels sobre {tema}...", uses: 189 },
  { id: 12, slug: "caption-carousel", title: "Caption Carrossel", description: "Estrutura educativa.", category: "caption", prompt: "Carrossel de {n} slides sobre {tema}...", uses: 104 },
  { id: 13, slug: "hashtag-trending", title: "Hashtags Trending", description: "Baseadas em tendências semanais.", category: "hashtag", prompt: "Trending hashtags de {semana}...", uses: 88 },
  { id: 14, slug: "campanha-remarketing", title: "Remarketing Meta", description: "Público quente 30d.", category: "campaign", prompt: "Estratégia de remarketing 30d...", uses: 22 },
  { id: 15, slug: "campanha-testeab", title: "Estrutura de Teste A/B", description: "3 criativos, 2 públicos.", category: "campaign", prompt: "Setup A/B com {orcamento}...", uses: 19 },
  { id: 16, slug: "analise-post", title: "Análise de Post Específico", description: "Por que performou/afundou.", category: "analysis", prompt: "Analise post ID {id}...", uses: 45 },
  { id: 17, slug: "analise-hashtag", title: "Análise de Hashtag", description: "Volume, saturação, alcance.", category: "analysis", prompt: "Analise a hashtag #{tag}...", uses: 27 },
  { id: 18, slug: "reply-critica", title: "Resposta a Crítica", description: "Reversão de sentimento.", category: "reply", prompt: "Responda crítica negativa: {texto}...", uses: 61 },
  { id: 19, slug: "caption-humor", title: "Caption com Humor", description: "Tom leve, memável.", category: "caption", prompt: "Caption engraçada sobre {tema}...", uses: 76 },
  { id: 20, slug: "caption-autoridade", title: "Caption de Autoridade", description: "Educacional, técnico.", category: "caption", prompt: "Post de autoridade sobre {tema}...", uses: 55 },
  { id: 21, slug: "hashtag-branded", title: "Hashtags Branded", description: "Mix marca + campanha.", category: "hashtag", prompt: "Hashtags para marca {nome}...", uses: 38 },
  { id: 22, slug: "campanha-influencer", title: "Briefing Influencer", description: "Copy para parceria paga.", category: "campaign", prompt: "Briefing para @{perfil}...", uses: 14 },
];

export const mockDeepAnalysis: DeepAnalysisResult = {
  summary: "Perfil em crescimento saudável (+8,2% seguidores/mês). Engajamento acima da média do nicho (4,7% vs 2,3%). Concentração excessiva em posts educativos — falta variedade de formato.",
  strengths: ["Consistência de postagem (5/semana)", "Reels com hook forte (retenção 68%)", "Uso inteligente de carrossel"],
  weaknesses: ["Baixa frequência de Stories (2/dia)", "Ausência de UGC/repost", "Hashtags saturadas em 40% dos posts"],
  opportunities: ["Explorar tendência de #trend2026", "Colaborações com @concorrente_afim", "Lives semanais às terças 19h"],
  recommendations: ["Testar 3 novos formatos de Reels nas próximas 2 semanas", "Reduzir hashtags saturadas para <20%", "Programar 6 stories/dia com CTA"],
};

export const mockTranscription: TranscriptionResult = {
  text: "Olá pessoal, hoje eu vou mostrar como criar campanhas altamente segmentadas usando IA. O primeiro passo é entender seu público-alvo...",
  language: "pt-BR",
  duration_sec: 42,
};

export const mockGoogleStatus: GoogleIntegrationStatus = {
  connected: true, email: "wagner@instabot.local", sheets: 4, last_sync: ago(1),
};

export const mockIntegrationCards: IntegrationCard[] = [
  { id: "instagram", name: "Instagram", category: "instagram", status: "connected", description: "3 contas conectadas via browser login", last_activity: ago(1) },
  { id: "meta-ads", name: "Meta Ads", category: "meta", status: "connected", description: "5 contas ativas em 3 BMs", last_activity: ago(1) },
  { id: "canva", name: "Canva", category: "canva", status: "connected", description: "12 designs sincronizados", last_activity: ago(60) },
  { id: "canva-app", name: "Canva Apps SDK", category: "canva", status: "connected", description: "App ID AAHAAH8NpAk publicado", last_activity: ago(120) },
  { id: "google", name: "Google Sheets", category: "google", status: "connected", description: "4 planilhas sincronizando", last_activity: ago(1) },
  { id: "freepik", name: "Freepik", category: "freepik", status: "connected", description: "API key ativa", last_activity: ago(180) },
  { id: "idp", name: "IdP OAuth2", category: "idp", status: "connected", description: "2 clients ativos, 1 usuário logado", last_activity: ago(1) },
];

export const mockExports: ExportJob[] = [
  { id: 1, name: "Posts_Novembro_2026", kind: "posts", format: "csv", size_kb: 128, created_at: ago(120), url: "#" },
  { id: 2, name: "Relatorio_Meta_Semanal", kind: "meta", format: "pdf", size_kb: 892, created_at: ago(1), url: "#" },
  { id: 3, name: "Historico_Completo", kind: "history", format: "xlsx", size_kb: 456, created_at: ago(3), url: "#" },
  { id: 4, name: "Audit_Log_30d", kind: "audit", format: "csv", size_kb: 214, created_at: ago(5), url: "#" },
  { id: 5, name: "Posts_Outubro_2026", kind: "posts", format: "csv", size_kb: 156, created_at: ago(12), url: "#" },
];

export const mockRoleDefinitions: RoleDefinition[] = [
  { name: "owner", label: "Owner", permissions: ["Tudo", "Faturamento", "Deletar workspace", "Gerenciar roles"] },
  { name: "admin", label: "Admin", permissions: ["Gerenciar posts", "Gerenciar contas IG", "Gerenciar regras", "Convidar membros"] },
  { name: "editor", label: "Editor", permissions: ["Criar/editar posts", "Aprovar rascunhos", "Usar IA"] },
  { name: "viewer", label: "Viewer", permissions: ["Visualizar dashboards", "Exportar relatórios"] },
];

export const mockRoleMembers: RoleMember[] = [
  { id: 1, name: "Wagner Andrade", email: "wagner@instabot.local", role: "owner", last_seen: ago(0), avatar_seed: "wagner" },
  { id: 2, name: "Marina Silva", email: "marina@agencia.com", role: "admin", last_seen: ago(60), avatar_seed: "marina" },
  { id: 3, name: "Rafael Souza", email: "rafael@agencia.com", role: "editor", last_seen: ago(180), avatar_seed: "rafael" },
  { id: 4, name: "Cliente Loja X", email: "contato@lojax.com", role: "viewer", last_seen: ago(2), avatar_seed: "lojax" },
  { id: 5, name: "Cliente Café Y", email: "gerencia@cafey.com", role: "viewer", last_seen: ago(7), avatar_seed: "cafey" },
];

export const mockMediaTools: MediaTool[] = [
  { id: "smart-compress", label: "Compressão Inteligente", description: "Reduz tamanho preservando qualidade visual", icon: "compress" },
  { id: "watermark", label: "Marca d'água", description: "Aplica logo/texto com posicionamento", icon: "watermark" },
  { id: "remove-bg", label: "Remover Fundo", description: "Isola sujeito principal via IA", icon: "removebg" },
  { id: "crop-aspect", label: "Crop por Aspect Ratio", description: "1:1, 4:5, 9:16 automaticamente", icon: "crop" },
  { id: "convert", label: "Conversão de Formato", description: "PNG/JPG/WebP/HEIC → destino", icon: "convert" },
  { id: "extract-audio", label: "Extrair Áudio", description: "MP3 de qualquer vídeo", icon: "audio" },
];

export const mockVideoEditorTools: VideoEditorTool[] = [
  { id: "analyze", label: "Analisar Vídeo", description: "Cenas, cortes sugeridos, qualidade de áudio" },
  { id: "cut-silences", label: "Cortar Silêncios", description: "Remove pausas automaticamente" },
  { id: "detect-cuts", label: "Detectar Cortes", description: "Marcadores de mudança de cena" },
  { id: "run-pipeline", label: "Pipeline Completa", description: "Analisa + corta + normaliza áudio" },
  { id: "premiere-export", label: "Instruções Premiere", description: "Exporta XML/EDL para Adobe Premiere" },
];
