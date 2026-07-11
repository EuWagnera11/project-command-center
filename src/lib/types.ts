// Domain types for InstaBot frontend.
// Mirrors backend Flask API contracts (section 5 of the spec) + PARTE 10.

export type PostType = "photo" | "reel" | "carousel" | "story";
export type PostStatus = "pending" | "publishing" | "published" | "failed";
export type LoginStatus =
  | "logged_in"
  | "logged_out"
  | "failed"
  | "expired"
  | "browser_login"
  | "2fa_pending"
  | "checkpoint"
  | "unknown";
export type Tone = "descontraido" | "profissional" | "engajamento" | "informativo";

export interface Post {
  id: number;
  profile_id: number;
  media_path: string;
  post_type: PostType;
  caption: string;
  scheduled_at: string;
  status: PostStatus;
  scheduled_time?: string;
  profile_name?: string;
  instagram_username?: string;
}

export interface Profile {
  id: number;
  name: string;
  instagram_username: string;
  login_status: LoginStatus;
  last_login_check?: string;
}

export interface Template {
  id: number;
  name: string;
  content: string;
  tone: Tone;
}

export interface HashtagGroup {
  id: number;
  name: string;
  hashtags: string;
}

export interface MetaAccount {
  id: string;
  name: string;
  business_name: string;
  amount_spent: number;
  balance: number;
  currency: string;
  account_status: number;
  can_be_used_as_ad_account: boolean;
}

export interface MetaCampaign {
  id: string;
  ad_account_id: string;
  ad_account_name: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED" | "DELETED";
  objective: string;
  daily_budget?: number;
  lifetime_budget?: number;
}

export interface MetaKPI {
  total_accounts: number;
  total_lifetime_spend: number;
  total_balance: number;
  active_campaigns: number;
  paused_campaigns: number;
  period_spend: number;
  period_impressions: number;
  period_clicks: number;
  period_reach: number;
  avg_ctr: number;
  avg_cpc: number;
  accounts: MetaAccount[];
}

export interface MetaComparison {
  account_id: string;
  name: string;
  business_name: string;
  lifetime_spent: number;
  period_spend: number;
  period_impressions: number;
  period_clicks: number;
  avg_ctr: number;
}

export interface MetaAlert {
  id: number;
  account_id: string;
  campaign_id?: string;
  alert_type: "high_spend" | "low_ctr";
  message: string;
  spend_value: number;
  threshold: number;
  triggered_at: string;
  resolved: 0 | 1;
}

export interface Notification {
  timestamp: string;
  level: "info" | "warn" | "error";
  title: string;
  message: string;
  profile_id?: number;
  post_id?: number;
}

export interface BotStatus {
  scheduler_running: boolean;
  profiles_count: number;
  profiles_logged_in: number;
  pending_posts: number;
  next_post_at: string | null;
}

export interface Settings {
  media_folder: string;
  scheduler_timezone: string;
  min_post_delay: number;
  scheduler_running: boolean;
}

export interface Backup {
  filename: string;
  size: number;
  created_at: string;
  created: string;
}

// ---------- PARTE 10 ----------

export type SharedLinkScope = "overview" | "meta_account";

export interface SharedLink {
  id: number;
  token: string;
  name: string;
  scope: SharedLinkScope;
  scope_id?: string;
  expires_at?: string;
  view_password?: string;
  view_count: number;
  created_at: string;
  last_accessed?: string;
  is_active: boolean;
  public_url: string;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  primary_color?: string;
  is_active: boolean;
  created_at: string;
  profiles_count: number;
  meta_accounts_count: number;
}

export interface ClientDashboardData {
  organization: { name: string; primary_color: string; logo_url?: string };
  kpi: MetaKPI;
  campaigns: MetaCampaign[];
  timeseries: Array<{ date: string; label: string; spend: number; impressions: number; clicks: number; ctr: number }>;
  scope: SharedLinkScope;
  generated_at: string;
}

// ---------- PARTE FINAL: IA + Marketing ----------

export type AISeverity = "high" | "info" | "ok";
export type AIActionStatus = "pending" | "approved" | "rejected" | "executed";
export type AIActionType = "pause_campaign" | "scale_budget" | "new_creative" | "refine_audience" | "refine_targeting" | "healthy";

export interface AISuggestion {
  severity: AISeverity;
  title: string;
  body: string;
  action_type: AIActionType;
}

export interface AIAnalysis {
  campaign_id: string;
  campaign_name: string;
  metrics: { spend: number; impressions: number; clicks: number; ctr: number; cpc: number };
  suggestions: AISuggestion[];
  analyzed_at: string;
}

export interface AIActionFeedback {
  rating: number; // 1-5
  comment?: string;
}

export interface AIAction {
  id: number;
  campaign_id: string;
  campaign_name: string;
  type: AIActionType;
  severity: AISeverity;
  description: string;
  status: AIActionStatus;
  created_at: string;
  reason?: string;
  feedback?: AIActionFeedback;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: string;
}

export interface MediaInfo {
  post_id: number;
  url: string;
  type: "image" | "video";
  size: number;
}

export interface MetaAd {
  id: string;
  name: string;
  title: string;
  body: string;
  image_url: string;
  status: "ACTIVE" | "PAUSED";
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED";
  daily_budget?: number;
  optimization_goal: string;
}

export interface AdSetWithAds {
  adset: MetaAdSet;
  ads: MetaAd[];
}

export interface HistoryBundle {
  ai_actions: AIAction[];
  notifications: Notification[];
  posts: Post[];
}

export interface MarketingSkill {
  slug: string;
  title: string;
  description: string;
}
