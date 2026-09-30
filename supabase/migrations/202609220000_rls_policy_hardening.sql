-- Migration: 202609220000_rls_policy_hardening.sql
-- Description: Hardens Row Level Security (RLS) policies for the 6 Winter Arc tables
-- applied initially in 202609120000_winter_arc_remediation.sql.
-- Enforces explicit 'TO authenticated', scalar subquery caching '((select auth.uid()) = user_id)',
-- and explicit 'WITH CHECK ((select auth.uid()) = user_id)' constraints.

-- 1. life_seasons
ALTER TABLE public.life_seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own life seasons" ON public.life_seasons;
CREATE POLICY "Users can manage their own life seasons"
  ON public.life_seasons
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 2. user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own achievements" ON public.user_achievements;
CREATE POLICY "Users can manage their own achievements"
  ON public.user_achievements
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 3. pulse_logs
ALTER TABLE public.pulse_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own pulse logs" ON public.pulse_logs;
CREATE POLICY "Users can manage their own pulse logs"
  ON public.pulse_logs
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 4. knowledge_resources
ALTER TABLE public.knowledge_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own knowledge resources" ON public.knowledge_resources;
CREATE POLICY "Users can manage their own knowledge resources"
  ON public.knowledge_resources
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 5. experiments
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own experiments" ON public.experiments;
CREATE POLICY "Users can manage their own experiments"
  ON public.experiments
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- 6. user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings"
  ON public.user_settings
  FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
