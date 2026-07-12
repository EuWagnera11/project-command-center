
CREATE TABLE public.meta_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  ig_business_id TEXT NOT NULL UNIQUE,
  ig_username TEXT NOT NULL,
  ig_name TEXT,
  profile_picture_url TEXT,
  followers_count INTEGER,
  follows_count INTEGER,
  media_count INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.meta_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_profiles TO authenticated;
GRANT ALL ON public.meta_profiles TO service_role;

ALTER TABLE public.meta_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read meta_profiles" ON public.meta_profiles
  FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_meta_profiles_updated_at
  BEFORE UPDATE ON public.meta_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
