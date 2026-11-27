-- Time OS bucket consolidation ('Academics' -> 'Learning', 'Admin' -> 'Deep Work')
-- Introduce 'Gaming' and 'Chore', and add synced time_bucket_colors to user_settings.

DO $$
DECLARE
  v_constraint_name text;
BEGIN
  -- 1. Drop existing bucket CHECK constraint on public.time_logs before remapping
  SELECT conname
  INTO v_constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.time_logs'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%bucket%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.time_logs DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END $$;

-- 2. Remap historical bucket values
UPDATE public.time_logs
SET bucket = 'Learning', updated_at = now()
WHERE bucket = 'Academics';

UPDATE public.time_logs
SET bucket = 'Deep Work', updated_at = now()
WHERE bucket = 'Admin';

-- 3. Enforce canonical 5-bucket constraint
ALTER TABLE public.time_logs
  DROP CONSTRAINT IF EXISTS time_logs_bucket_check;

ALTER TABLE public.time_logs
  ADD CONSTRAINT time_logs_bucket_check
  CHECK (bucket IN ('Deep Work', 'Learning', 'Fitness', 'Gaming', 'Chore'));

-- 4. Add cross-platform bucket color map on public.user_settings
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS time_bucket_colors jsonb NOT NULL DEFAULT '{}'::jsonb;
