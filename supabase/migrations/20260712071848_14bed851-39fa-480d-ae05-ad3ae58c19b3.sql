
CREATE TABLE public.kanban_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  briefing text NOT NULL,
  reference_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  profile_id uuid REFERENCES public.meta_profiles(id) ON DELETE SET NULL,
  platforms text[] NOT NULL DEFAULT ARRAY['instagram']::text[],
  goal text NOT NULL DEFAULT 'post',
  status text NOT NULL DEFAULT 'briefing',
  ai_analysis jsonb,
  generated_copy text,
  generated_image_url text,
  scheduled_at timestamptz,
  scheduled_post_id uuid REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
  campaign_id text,
  error text,
  ai_log jsonb NOT NULL DEFAULT '[]'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kanban_briefs TO authenticated, anon;
GRANT ALL ON public.kanban_briefs TO service_role;

ALTER TABLE public.kanban_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public manage kanban_briefs" ON public.kanban_briefs
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_kanban_briefs_updated_at
  BEFORE UPDATE ON public.kanban_briefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_kanban_briefs_status ON public.kanban_briefs(status, position);
