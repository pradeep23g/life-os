-- Migration: 202610010000_arc_engine_lifecycle_schema.sql
-- Description: Evolve public.life_seasons into the canonical Arc Engine lifecycle campaign table (ADR-030).
-- Adds status state machine, original config freezing, amendment auditing, manual milestone progress,
-- retrospective capture, early completion timestamps, and single-active partial unique index.

-- 1. Add Lifecycle & Audit Columns
ALTER TABLE public.life_seasons
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS original_config jsonb,
  ADD COLUMN IF NOT EXISTS amendments jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS milestone_progress jsonb DEFAULT '{}'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS retrospective jsonb,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS planned_end_date date;

-- 2. Status Check Constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_life_seasons_status'
  ) THEN
    ALTER TABLE public.life_seasons
      ADD CONSTRAINT chk_life_seasons_status
      CHECK (status IN ('draft', 'active', 'completed', 'archived'));
  END IF;
END $$;

-- 3. Enforce Single Active Arc per User
CREATE UNIQUE INDEX IF NOT EXISTS idx_life_seasons_single_active
  ON public.life_seasons (user_id)
  WHERE status = 'active';

-- 4. Fast Index for Status and Date Filtering
CREATE INDEX IF NOT EXISTS idx_life_seasons_user_status_dates
  ON public.life_seasons (user_id, status, start_date DESC);

-- 5. Data Migration / Backfill for Existing Seasons
-- Populates original_config from existing vows JSONB and sets active/completed/draft status safely.
UPDATE public.life_seasons
SET
  original_config = jsonb_build_object(
    'title', name,
    'startDate', start_date,
    'endDate', end_date,
    'vow', COALESCE(vows->'vow', '{"headline": "Silence and Execution", "body": "No announcements. Cold focus in the dark."}'::jsonb),
    'principles', COALESCE(vows->'principles', '[]'::jsonb),
    'phases', COALESCE(vows->'phases', '[]'::jsonb),
    'accentColor', '#22d3ee',
    'icon', 'snowflake'
  ),
  planned_end_date = COALESCE(planned_end_date, end_date),
  status = CASE
    WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'active'
    WHEN CURRENT_DATE > end_date THEN 'completed'
    ELSE 'draft'
  END
WHERE original_config IS NULL;
