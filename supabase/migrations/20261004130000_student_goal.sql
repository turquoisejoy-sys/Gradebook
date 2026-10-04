-- Student goal (free text, edited on the student hub).
-- Safe to re-run.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS goal text NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';
