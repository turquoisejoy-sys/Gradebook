-- Saved ISST sub-groups per class (student ids per group for Speaking and Writing).
-- Safe to re-run.

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS isst_groups jsonb;

NOTIFY pgrst, 'reload schema';
