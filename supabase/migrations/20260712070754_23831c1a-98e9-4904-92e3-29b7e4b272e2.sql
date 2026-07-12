CREATE TABLE public.meta_ai_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  ad_account_id TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'none',
  action_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  feedback_rating INT,
  feedback_comment TEXT,
  execution_result TEXT,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_ai_actions TO anon, authenticated;
GRANT ALL ON public.meta_ai_actions TO service_role;

ALTER TABLE public.meta_ai_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public manage meta_ai_actions" ON public.meta_ai_actions
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_meta_ai_actions_updated_at
  BEFORE UPDATE ON public.meta_ai_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_meta_ai_actions_status ON public.meta_ai_actions(status);
CREATE INDEX idx_meta_ai_actions_campaign ON public.meta_ai_actions(campaign_id);