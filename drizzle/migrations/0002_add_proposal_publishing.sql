ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS share_slug TEXT,
  ADD COLUMN IF NOT EXISTS published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS proposals_share_slug_key
  ON public.proposals (share_slug)
  WHERE share_slug IS NOT NULL;

GRANT SELECT ON public.proposals TO anon;

DROP POLICY IF EXISTS "Published proposals are readable by anyone" ON public.proposals;
CREATE POLICY "Published proposals are readable by anyone"
  ON public.proposals
  FOR SELECT
  TO anon, authenticated
  USING (published = true AND share_slug IS NOT NULL);