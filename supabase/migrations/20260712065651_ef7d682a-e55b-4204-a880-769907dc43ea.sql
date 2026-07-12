
CREATE TABLE public.scheduled_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.meta_profiles(id) ON DELETE CASCADE,
  caption text NOT NULL,
  image_url text NOT NULL,
  platforms text[] NOT NULL DEFAULT ARRAY['instagram']::text[],
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  ig_media_id text,
  fb_post_id text,
  error text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_posts TO anon, authenticated;
GRANT ALL ON public.scheduled_posts TO service_role;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public manage scheduled_posts" ON public.scheduled_posts FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_scheduled_posts_updated BEFORE UPDATE ON public.scheduled_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_scheduled_posts_when ON public.scheduled_posts(scheduled_at, status);
