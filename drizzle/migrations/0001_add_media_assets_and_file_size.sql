ALTER TABLE public.knowledge_files ADD COLUMN size_bytes BIGINT NOT NULL DEFAULT 0;

CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'image',
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own media select" ON public.media_assets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own media insert" ON public.media_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own media update" ON public.media_assets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own media delete" ON public.media_assets FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX media_assets_user_created_idx ON public.media_assets (user_id, created_at DESC);

CREATE POLICY "own media objects select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own media objects insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own media objects delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media-assets' AND auth.uid()::text = (storage.foldername(name))[1]);