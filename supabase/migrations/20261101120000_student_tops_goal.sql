-- Official TOPS goal (picked from a fixed list on the student hub).
-- Safe to re-run.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS tops_goal text NOT NULL DEFAULT '';

NOTIFY pgrst, 'reload schema';
