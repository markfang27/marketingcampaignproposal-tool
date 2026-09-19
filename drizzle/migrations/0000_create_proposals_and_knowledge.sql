CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT '',
  brief JSONB NOT NULL,
  strategy JSONB,
  content JSONB,
  plan JSONB,
  competitors JSONB,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  translation JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own proposals select" ON public.proposals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own proposals insert" ON public.proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own proposals update" ON public.proposals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own proposals delete" ON public.proposals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX proposals_user_created_idx ON public.proposals (user_id, created_at DESC);

CREATE TABLE public.knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '行业资料',
  summary TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.knowledge_files TO authenticated;
GRANT ALL ON public.knowledge_files TO service_role;
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own knowledge select" ON public.knowledge_files FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own knowledge insert" ON public.knowledge_files FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own knowledge delete" ON public.knowledge_files FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX knowledge_files_user_created_idx ON public.knowledge_files (user_id, created_at DESC);