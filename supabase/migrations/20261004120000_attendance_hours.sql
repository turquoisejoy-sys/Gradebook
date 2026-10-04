-- Keep imported hours with each monthly attendance record so the percentage can be
-- recalculated when a student's enrollment date changes.
-- Safe to re-run.

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS hours_attended double precision,
  ADD COLUMN IF NOT EXISTS scheduled_hours double precision,
  ADD COLUMN IF NOT EXISTS daily_hours jsonb;

NOTIFY pgrst, 'reload schema';
