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

// ---------- Fase avançada ----------

export interface EngagementHeatmapCell { day: number; hour: number; score: number; }

export interface TopPostRow {
  post_id: number; caption: string; profile_name: string; post_type: PostType;
  likes: number; comments: number; reach: number; engagement_rate: number; published_at: string;
}

export interface GrowthPoint { date: string; followers: number; reach: number; engagement: number; }

export type AutomationMetric = "ctr" | "cpc" | "spend" | "engagement";
export type AutomationOperator = "<" | ">" | "==" | "<=" | ">=";
export type AutomationWindow = "24h" | "48h" | "7d";
export type AutomationActionKind = "pause_campaign" | "resume_campaign" | "notify" | "scale_budget" | "reduce_budget";

export interface AutomationRule {
  id: number; name: string; description: string;
  scope: "campaign" | "post" | "account"; scope_id: string;
  metric: AutomationMetric; operator: AutomationOperator; threshold: number;
  time_window: AutomationWindow; action: AutomationActionKind;
  is_active: boolean; trigger_count: number; last_triggered_at?: string;
}

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface PostApproval {
  id: number; post_id: number; post: Post; status: ApprovalStatus;
  requested_by: string; requested_at: string;
  approved_by?: string; approved_at?: string; rejection_reason?: string;
}

export interface CaptionABTest {
  id: number; post_id: number; caption_a: string; caption_b: string;
  impressions_a: number; clicks_a: number; impressions_b: number; clicks_b: number;
  ctr_a: number; ctr_b: number; winner?: "a" | "b"; winner_decided_at?: string;
  status: "running" | "decided"; created_at: string;
}

export interface InboxMessage {
  id: number; profile_id: number; profile_name: string;
  source: "dm" | "comment"; sender: string; message_text: string;
  ai_reply?: string; status: "pending" | "sent" | "archived"; received_at: string;
}

export interface MediaLibraryItem {
  id: number; name: string; path: string; url: string; size: number;
  tags: string[]; used: boolean; is_video: boolean; uploaded_at: string;
}

export interface AuditLog {
  id: number; actor: string; action: string;
  target_type: "post" | "campaign" | "profile" | "settings" | "rule" | "shared_link";
  target_id: string; meta?: Record<string, string | number | boolean>;
  ip?: string; created_at: string;
}

export interface FreepikImage {
  id: string; title: string; thumbnail_url: string; image_url: string;
  source: "freepik" | "freepik-ai" | "fallback-picsum";
}
