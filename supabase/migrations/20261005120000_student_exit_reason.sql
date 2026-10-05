-- Why a student left a class when it isn't a drop ('transferred_out' = moved to another teacher/class).
-- Safe to re-run.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS exit_reason text;

NOTIFY pgrst, 'reload schema';
