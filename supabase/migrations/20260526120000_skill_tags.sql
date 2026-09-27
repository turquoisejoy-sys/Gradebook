-- Skill tags for ISST groups (shared library) + student.tag_ids
-- Run in Supabase SQL Editor if you want tags to sync to the cloud.
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS public.skill_tags (
  id text PRIMARY KEY,
  label text NOT NULL,
  created_at text NOT NULL,
  updated_at text NOT NULL
);

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS tag_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.skill_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gradebook_skill_tags_anon_all" ON public.skill_tags;
CREATE POLICY "gradebook_skill_tags_anon_all"
  ON public.skill_tags
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
