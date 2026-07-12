CREATE TABLE public.client_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE REFERENCES public.meta_profiles(id) ON DELETE CASCADE,
  business_description text NOT NULL DEFAULT '',
  tone_of_voice text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'pt-BR',
  target_audience text NOT NULL DEFAULT '',
  goals text[] NOT NULL DEFAULT '{}',
  content_pillars text[] NOT NULL DEFAULT '{}',
  offerings text NOT NULL DEFAULT '',
  hashtags_base text[] NOT NULL DEFAULT '{}',
  brand_keywords text[] NOT NULL DEFAULT '{}',
  do_not_use text NOT NULL DEFAULT '',
  posting_frequency text NOT NULL DEFAULT '',
  extra_context text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_agents TO anon, authenticated;
GRANT ALL ON public.client_agents TO service_role;

ALTER TABLE public.client_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public manage client_agents" ON public.client_agents
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER trg_client_agents_updated
  BEFORE UPDATE ON public.client_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();