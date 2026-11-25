-- Migration: 202611250000_track2_rls_index_view_optimization.sql
-- Description: Track 2 SQL & Supabase Performance Optimization
-- 1. Rewrites all remaining 99 RLS policies across 26 tables to use InitPlan scalar
--    subquery caching ((select auth.uid()) = user_id) and explicit TO authenticated
--    role scoping (eliminating legacy {public} scoping on Mind OS tables).
-- 2. Adds missing un-predicated tenant (user_id) B-tree indexes on exercise_logs,
--    experiments, knowledge_resources, and pulse_logs, plus a partial chronological
--    index on learning_session_logs for bounded longitudinal window scans.
-- 3. Optimizes longitudinal SQL views (data_lab_daily_activity_90d,
--    current_day_snapshot_history_14d, current_day_snapshot,
--    data_lab_event_coverage_30d, data_lab_module_consistency_30d,
--    data_lab_weekly_system_score_12w) with (select auth.uid()) InitPlan caching,
--    IST window range predicates, and single-pass aggregation while preserving
--    security_invoker = true and exact column contracts.

BEGIN;

-- ============================================================================
-- SECTION 1: Missing Tenant (user_id) & Longitudinal Window B-Tree Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_id
  ON public.exercise_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_experiments_user_id
  ON public.experiments (user_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_resources_user_id
  ON public.knowledge_resources (user_id);

CREATE INDEX IF NOT EXISTS idx_pulse_logs_user_timestamp
  ON public.pulse_logs (user_id, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_learning_session_logs_user_logged_at_active
  ON public.learning_session_logs (user_id, logged_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- SECTION 2: RLS InitPlan Optimization & Explicit TO authenticated Scoping
-- ============================================================================

-- 1. habits (previously {public} + bare auth.uid())
DROP POLICY IF EXISTS "Users can select own habits" ON public.habits;
CREATE POLICY "Users can select own habits"
  ON public.habits FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
CREATE POLICY "Users can insert own habits"
  ON public.habits FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete own habits"
  ON public.habits FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 2. habit_logs (previously {public} + bare auth.uid())
DROP POLICY IF EXISTS "Users can select own habit logs" ON public.habit_logs;
CREATE POLICY "Users can select own habit logs"
  ON public.habit_logs FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own habit logs" ON public.habit_logs;
CREATE POLICY "Users can insert own habit logs"
  ON public.habit_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own habit logs" ON public.habit_logs;
CREATE POLICY "Users can update own habit logs"
  ON public.habit_logs FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own habit logs" ON public.habit_logs;
CREATE POLICY "Users can delete own habit logs"
  ON public.habit_logs FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 3. habit_streak_breaks (previously {public} + bare auth.uid())
DROP POLICY IF EXISTS "Users can select own habit streak breaks" ON public.habit_streak_breaks;
CREATE POLICY "Users can select own habit streak breaks"
  ON public.habit_streak_breaks FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own habit streak breaks" ON public.habit_streak_breaks;
CREATE POLICY "Users can insert own habit streak breaks"
  ON public.habit_streak_breaks FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own habit streak breaks" ON public.habit_streak_breaks;
CREATE POLICY "Users can update own habit streak breaks"
  ON public.habit_streak_breaks FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own habit streak breaks" ON public.habit_streak_breaks;
CREATE POLICY "Users can delete own habit streak breaks"
  ON public.habit_streak_breaks FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 4. habit_streak_heals (previously {public} + bare auth.uid())
DROP POLICY IF EXISTS "Users can select own habit streak heals" ON public.habit_streak_heals;
CREATE POLICY "Users can select own habit streak heals"
  ON public.habit_streak_heals FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own habit streak heals" ON public.habit_streak_heals;
CREATE POLICY "Users can insert own habit streak heals"
  ON public.habit_streak_heals FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own habit streak heals" ON public.habit_streak_heals;
CREATE POLICY "Users can update own habit streak heals"
  ON public.habit_streak_heals FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own habit streak heals" ON public.habit_streak_heals;
CREATE POLICY "Users can delete own habit streak heals"
  ON public.habit_streak_heals FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 5. journal_entries (UPDATE/DELETE previously {public} + all 4 bare auth.uid())
DROP POLICY IF EXISTS "Users can select their own entries" ON public.journal_entries;
CREATE POLICY "Users can select their own entries"
  ON public.journal_entries FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own entries" ON public.journal_entries;
CREATE POLICY "Users can insert their own entries"
  ON public.journal_entries FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;
CREATE POLICY "Users can update own journal entries"
  ON public.journal_entries FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.journal_entries;
CREATE POLICY "Users can delete own journal entries"
  ON public.journal_entries FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 6. tasks
DROP POLICY IF EXISTS "Users can select own tasks" ON public.tasks;
CREATE POLICY "Users can select own tasks"
  ON public.tasks FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 7. goals
DROP POLICY IF EXISTS "Users can select own goals" ON public.goals;
CREATE POLICY "Users can select own goals"
  ON public.goals FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 8. weekly_plans
DROP POLICY IF EXISTS "Users can select own weekly plans" ON public.weekly_plans;
CREATE POLICY "Users can select own weekly plans"
  ON public.weekly_plans FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own weekly plans" ON public.weekly_plans;
CREATE POLICY "Users can insert own weekly plans"
  ON public.weekly_plans FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own weekly plans" ON public.weekly_plans;
CREATE POLICY "Users can update own weekly plans"
  ON public.weekly_plans FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own weekly plans" ON public.weekly_plans;
CREATE POLICY "Users can delete own weekly plans"
  ON public.weekly_plans FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 9. weekly_plan_items
DROP POLICY IF EXISTS "Users can select own weekly plan items" ON public.weekly_plan_items;
CREATE POLICY "Users can select own weekly plan items"
  ON public.weekly_plan_items FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own weekly plan items" ON public.weekly_plan_items;
CREATE POLICY "Users can insert own weekly plan items"
  ON public.weekly_plan_items FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own weekly plan items" ON public.weekly_plan_items;
CREATE POLICY "Users can update own weekly plan items"
  ON public.weekly_plan_items FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own weekly plan items" ON public.weekly_plan_items;
CREATE POLICY "Users can delete own weekly plan items"
  ON public.weekly_plan_items FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 10. weekly_reviews
DROP POLICY IF EXISTS "Users can select own weekly reviews" ON public.weekly_reviews;
CREATE POLICY "Users can select own weekly reviews"
  ON public.weekly_reviews FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own weekly reviews" ON public.weekly_reviews;
CREATE POLICY "Users can insert own weekly reviews"
  ON public.weekly_reviews FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own weekly reviews" ON public.weekly_reviews;
CREATE POLICY "Users can update own weekly reviews"
  ON public.weekly_reviews FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own weekly reviews" ON public.weekly_reviews;
CREATE POLICY "Users can delete own weekly reviews"
  ON public.weekly_reviews FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 11. learning_roadmaps
DROP POLICY IF EXISTS "Users can select own learning roadmaps" ON public.learning_roadmaps;
CREATE POLICY "Users can select own learning roadmaps"
  ON public.learning_roadmaps FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own learning roadmaps" ON public.learning_roadmaps;
CREATE POLICY "Users can insert own learning roadmaps"
  ON public.learning_roadmaps FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own learning roadmaps" ON public.learning_roadmaps;
CREATE POLICY "Users can update own learning roadmaps"
  ON public.learning_roadmaps FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own learning roadmaps" ON public.learning_roadmaps;
CREATE POLICY "Users can delete own learning roadmaps"
  ON public.learning_roadmaps FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 12. learning_stages
DROP POLICY IF EXISTS "Users can select own learning stages" ON public.learning_stages;
CREATE POLICY "Users can select own learning stages"
  ON public.learning_stages FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own learning stages" ON public.learning_stages;
CREATE POLICY "Users can insert own learning stages"
  ON public.learning_stages FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own learning stages" ON public.learning_stages;
CREATE POLICY "Users can update own learning stages"
  ON public.learning_stages FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own learning stages" ON public.learning_stages;
CREATE POLICY "Users can delete own learning stages"
  ON public.learning_stages FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 13. learning_sessions
DROP POLICY IF EXISTS "Users can select own learning sessions" ON public.learning_sessions;
CREATE POLICY "Users can select own learning sessions"
  ON public.learning_sessions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own learning sessions" ON public.learning_sessions;
CREATE POLICY "Users can insert own learning sessions"
  ON public.learning_sessions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own learning sessions" ON public.learning_sessions;
CREATE POLICY "Users can update own learning sessions"
  ON public.learning_sessions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own learning sessions" ON public.learning_sessions;
CREATE POLICY "Users can delete own learning sessions"
  ON public.learning_sessions FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 14. learning_session_logs
DROP POLICY IF EXISTS "Users can select own learning session logs" ON public.learning_session_logs;
CREATE POLICY "Users can select own learning session logs"
  ON public.learning_session_logs FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own learning session logs" ON public.learning_session_logs;
CREATE POLICY "Users can insert own learning session logs"
  ON public.learning_session_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own learning session logs" ON public.learning_session_logs;
CREATE POLICY "Users can update own learning session logs"
  ON public.learning_session_logs FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own learning session logs" ON public.learning_session_logs;
CREATE POLICY "Users can delete own learning session logs"
  ON public.learning_session_logs FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 15. learning_milestones
DROP POLICY IF EXISTS "Users can select own learning milestones" ON public.learning_milestones;
CREATE POLICY "Users can select own learning milestones"
  ON public.learning_milestones FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own learning milestones" ON public.learning_milestones;
CREATE POLICY "Users can insert own learning milestones"
  ON public.learning_milestones FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own learning milestones" ON public.learning_milestones;
CREATE POLICY "Users can update own learning milestones"
  ON public.learning_milestones FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own learning milestones" ON public.learning_milestones;
CREATE POLICY "Users can delete own learning milestones"
  ON public.learning_milestones FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 16. learning_projects
DROP POLICY IF EXISTS "Users can select own learning projects" ON public.learning_projects;
CREATE POLICY "Users can select own learning projects"
  ON public.learning_projects FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own learning projects" ON public.learning_projects;
CREATE POLICY "Users can insert own learning projects"
  ON public.learning_projects FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own learning projects" ON public.learning_projects;
CREATE POLICY "Users can update own learning projects"
  ON public.learning_projects FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own learning projects" ON public.learning_projects;
CREATE POLICY "Users can delete own learning projects"
  ON public.learning_projects FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 17. learning_reflections
DROP POLICY IF EXISTS "Users can select own learning reflections" ON public.learning_reflections;
CREATE POLICY "Users can select own learning reflections"
  ON public.learning_reflections FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own learning reflections" ON public.learning_reflections;
CREATE POLICY "Users can insert own learning reflections"
  ON public.learning_reflections FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own learning reflections" ON public.learning_reflections;
CREATE POLICY "Users can update own learning reflections"
  ON public.learning_reflections FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own learning reflections" ON public.learning_reflections;
CREATE POLICY "Users can delete own learning reflections"
  ON public.learning_reflections FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 18. fitness_exercises
DROP POLICY IF EXISTS "Users can select own fitness exercises" ON public.fitness_exercises;
CREATE POLICY "Users can select own fitness exercises"
  ON public.fitness_exercises FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own fitness exercises" ON public.fitness_exercises;
CREATE POLICY "Users can insert own fitness exercises"
  ON public.fitness_exercises FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own fitness exercises" ON public.fitness_exercises;
CREATE POLICY "Users can update own fitness exercises"
  ON public.fitness_exercises FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own fitness exercises" ON public.fitness_exercises;
CREATE POLICY "Users can delete own fitness exercises"
  ON public.fitness_exercises FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 19. workouts
DROP POLICY IF EXISTS "Users can select own workouts" ON public.workouts;
CREATE POLICY "Users can select own workouts"
  ON public.workouts FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own workouts" ON public.workouts;
CREATE POLICY "Users can insert own workouts"
  ON public.workouts FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own workouts" ON public.workouts;
CREATE POLICY "Users can update own workouts"
  ON public.workouts FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own workouts" ON public.workouts;
CREATE POLICY "Users can delete own workouts"
  ON public.workouts FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 20. exercise_logs
DROP POLICY IF EXISTS "Users can select own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can select own exercise logs"
  ON public.exercise_logs FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can insert own exercise logs"
  ON public.exercise_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can update own exercise logs"
  ON public.exercise_logs FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can delete own exercise logs"
  ON public.exercise_logs FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 21. time_logs
DROP POLICY IF EXISTS "Users can select own time logs" ON public.time_logs;
CREATE POLICY "Users can select own time logs"
  ON public.time_logs FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own time logs" ON public.time_logs;
CREATE POLICY "Users can insert own time logs"
  ON public.time_logs FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own time logs" ON public.time_logs;
CREATE POLICY "Users can update own time logs"
  ON public.time_logs FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own time logs" ON public.time_logs;
CREATE POLICY "Users can delete own time logs"
  ON public.time_logs FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 22. transactions
DROP POLICY IF EXISTS "Users can select own transactions" ON public.transactions;
CREATE POLICY "Users can select own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;
CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own transactions" ON public.transactions;
CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own transactions" ON public.transactions;
CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 23. events
DROP POLICY IF EXISTS "Users can select own events" ON public.events;
CREATE POLICY "Users can select own events"
  ON public.events FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
CREATE POLICY "Users can insert own events"
  ON public.events FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own events" ON public.events;
CREATE POLICY "Users can update own events"
  ON public.events FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own events" ON public.events;
CREATE POLICY "Users can delete own events"
  ON public.events FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 24. system_event_queue
DROP POLICY IF EXISTS "system_event_queue_select_own" ON public.system_event_queue;
CREATE POLICY "system_event_queue_select_own"
  ON public.system_event_queue FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "system_event_queue_insert_own" ON public.system_event_queue;
CREATE POLICY "system_event_queue_insert_own"
  ON public.system_event_queue FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "system_event_queue_delete_own" ON public.system_event_queue;
CREATE POLICY "system_event_queue_delete_own"
  ON public.system_event_queue FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 25. system_metrics
DROP POLICY IF EXISTS "system_metrics_select_own" ON public.system_metrics;
CREATE POLICY "system_metrics_select_own"
  ON public.system_metrics FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "system_metrics_insert_own" ON public.system_metrics;
CREATE POLICY "system_metrics_insert_own"
  ON public.system_metrics FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "system_metrics_update_own" ON public.system_metrics;
CREATE POLICY "system_metrics_update_own"
  ON public.system_metrics FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 26. progress_hub_archive
DROP POLICY IF EXISTS "Users can select own archive" ON public.progress_hub_archive;
CREATE POLICY "Users can select own archive"
  ON public.progress_hub_archive FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- SECTION 3: Bounded Range-Scan & Single-Pass Longitudinal SQL Views
-- ============================================================================

-- 3.1 current_day_snapshot (preserve security_invoker = true + exact columns)
CREATE OR REPLACE VIEW public.current_day_snapshot
WITH (security_invoker = true) AS
WITH user_scope AS (
  SELECT (SELECT auth.uid()) AS user_id, (now() AT TIME ZONE 'Asia/Kolkata')::date AS today
),
tasks AS (
  SELECT us.user_id, count(*) AS pending_tasks,
    min(title) FILTER (
      WHERE created_at = (
        SELECT min(created_at) FROM public.tasks WHERE is_completed = false AND user_id = us.user_id
      )
    ) AS oldest_pending_task
  FROM public.tasks, user_scope us
  WHERE is_completed = false AND public.tasks.user_id = us.user_id
  GROUP BY us.user_id
),
habits AS (
  SELECT us.user_id, count(*) AS total_active,
    min(title) FILTER (
      WHERE created_at = (
        SELECT max(created_at) FROM public.habits WHERE deleted_at IS NULL AND user_id = us.user_id
      )
    ) AS newest_habit
  FROM public.habits, user_scope us
  WHERE deleted_at IS NULL AND public.habits.user_id = us.user_id
  GROUP BY us.user_id
),
habit_logs_today AS (
  SELECT hl.user_id, count(DISTINCT hl.habit_id) AS completed_today
  FROM public.habit_logs hl
  JOIN public.habits h ON h.id = hl.habit_id
  JOIN user_scope us ON hl.user_id = us.user_id AND hl.log_date = us.today
  WHERE hl.value >= h.target_value
  GROUP BY hl.user_id
),
journal AS (
  SELECT us.user_id, count(*) > 0 AS logged_today
  FROM public.journal_entries, user_scope us
  WHERE deleted_at IS NULL
    AND public.journal_entries.user_id = us.user_id
    AND public.journal_entries.created_at >= (us.today::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND public.journal_entries.created_at < ((us.today + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
  GROUP BY us.user_id
),
workouts AS (
  SELECT us.user_id, count(*) AS days_this_week
  FROM public.workouts, user_scope us
  WHERE deleted_at IS NULL
    AND end_time IS NOT NULL
    AND public.workouts.user_id = us.user_id
    AND workout_date >= date_trunc('week', us.today::timestamp)::date
  GROUP BY us.user_id
),
time_logs AS (
  SELECT us.user_id, coalesce(sum(duration_minutes), 0) AS deep_work_minutes
  FROM public.time_logs, user_scope us
  WHERE end_time IS NOT NULL
    AND public.time_logs.user_id = us.user_id
    AND public.time_logs.start_time >= (us.today::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND public.time_logs.start_time < ((us.today + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND bucket IN ('Deep Work', 'Learning')
  GROUP BY us.user_id
),
learning_stats AS (
  SELECT user_id,
    (SELECT count(*) FROM public.learning_roadmaps WHERE status = 'active' AND deleted_at IS NULL AND user_id = us.user_id) AS active_roadmaps,
    (SELECT count(*) FROM public.learning_session_logs WHERE logged_at >= ((us.today - 6)::timestamp AT TIME ZONE 'Asia/Kolkata') AND deleted_at IS NULL AND user_id = us.user_id) AS sessions_logged_7d
  FROM user_scope us
),
finance_stats AS (
  SELECT us.user_id,
    count(*) FILTER (
      WHERE type = 'expense'
        AND is_need = false
        AND "timestamp" >= (now() AT TIME ZONE 'Asia/Kolkata') - interval '7 day'
    ) AS recent_want_expenses_count
  FROM public.transactions, user_scope us
  WHERE public.transactions.user_id = us.user_id
    AND public.transactions."timestamp" >= ((now() AT TIME ZONE 'Asia/Kolkata') - interval '7 day')
  GROUP BY us.user_id
)
SELECT
  us.user_id,
  us.today AS snapshot_date,
  coalesce(t.pending_tasks, 0)::integer AS pending_tasks_count,
  coalesce(h.total_active, 0)::integer AS total_active_habits,
  coalesce(hlt.completed_today, 0)::integer AS habits_completed_today,
  coalesce(j.logged_today, false) AS journal_logged_today,
  coalesce(w.days_this_week, 0)::integer AS workout_days_this_week,
  coalesce(tl.deep_work_minutes, 0)::integer AS deep_work_minutes_today,
  coalesce(ls.sessions_logged_7d, 0)::integer AS learning_sessions_logged_7d,
  coalesce(ls.active_roadmaps, 0)::integer AS active_roadmaps_count,
  t.oldest_pending_task AS oldest_pending_task_title,
  h.newest_habit AS newest_active_habit_title,
  NULL::numeric AS budget_utilization_percentage,
  coalesce(fs.recent_want_expenses_count, 0)::integer AS recent_want_expenses_count
FROM user_scope us
LEFT JOIN tasks t ON t.user_id = us.user_id
LEFT JOIN habits h ON h.user_id = us.user_id
LEFT JOIN habit_logs_today hlt ON hlt.user_id = us.user_id
LEFT JOIN journal j ON j.user_id = us.user_id
LEFT JOIN workouts w ON w.user_id = us.user_id
LEFT JOIN time_logs tl ON tl.user_id = us.user_id
LEFT JOIN learning_stats ls ON ls.user_id = us.user_id
LEFT JOIN finance_stats fs ON fs.user_id = us.user_id;

GRANT SELECT ON public.current_day_snapshot TO authenticated;

-- 3.2 current_day_snapshot_history_14d (14-day bounded index range scans)
CREATE OR REPLACE VIEW public.current_day_snapshot_history_14d
WITH (security_invoker = true) AS
WITH scope AS (
  SELECT
    (SELECT auth.uid()) AS user_id,
    ((now() AT TIME ZONE 'Asia/Kolkata')::date) AS snapshot_date,
    (((now() AT TIME ZONE 'Asia/Kolkata')::date) - 13) AS start_date
),
days AS (
  SELECT scope.user_id, generated_day::date AS snapshot_date
  FROM scope
  CROSS JOIN generate_series(scope.start_date, scope.snapshot_date, interval '1 day') AS generated_day
  WHERE scope.user_id IS NOT NULL
),
task_events AS (
  SELECT event_item.user_id, event_item.event_date_ist::date AS snapshot_date, count(DISTINCT event_item.entity_id)::integer AS tasks_completed_count
  FROM public.events event_item
  WHERE event_item.user_id = (SELECT auth.uid())
    AND event_item.domain = 'productivity-hub'
    AND event_item.event_type IN ('task_status_updated', 'productivity.task.status_changed')
    AND coalesce(event_item.payload ->> 'status', '') = 'Done'
    AND event_item.event_date_ist >= ((now() AT TIME ZONE 'Asia/Kolkata')::date - 13)
    AND event_item.event_date_ist <= ((now() AT TIME ZONE 'Asia/Kolkata')::date)
  GROUP BY event_item.user_id, event_item.event_date_ist::date
),
habit_day_completion AS (
  SELECT habit_log.user_id, habit_log.log_date AS snapshot_date, count(DISTINCT habit_item.id)::integer AS habits_completed_count
  FROM public.habit_logs habit_log
  JOIN public.habits habit_item ON habit_item.id = habit_log.habit_id
  WHERE habit_log.user_id = (SELECT auth.uid())
    AND habit_log.log_date >= ((now() AT TIME ZONE 'Asia/Kolkata')::date - 13)
    AND habit_log.log_date <= ((now() AT TIME ZONE 'Asia/Kolkata')::date)
    AND (habit_item.deleted_at IS NULL OR (habit_item.deleted_at AT TIME ZONE 'Asia/Kolkata')::date > habit_log.log_date)
    AND habit_log.value >= habit_item.target_value
  GROUP BY habit_log.user_id, habit_log.log_date
),
habit_totals AS (
  SELECT day_item.user_id, day_item.snapshot_date, count(habit_item.id)::integer AS total_active_habits
  FROM days day_item
  LEFT JOIN public.habits habit_item ON habit_item.user_id = day_item.user_id
   AND (habit_item.created_at AT TIME ZONE 'Asia/Kolkata')::date <= day_item.snapshot_date
   AND (habit_item.deleted_at IS NULL OR (habit_item.deleted_at AT TIME ZONE 'Asia/Kolkata')::date > day_item.snapshot_date)
  GROUP BY day_item.user_id, day_item.snapshot_date
),
journal_days AS (
  SELECT journal_item.user_id, (journal_item.created_at AT TIME ZONE 'Asia/Kolkata')::date AS snapshot_date, true AS journal_logged
  FROM public.journal_entries journal_item
  WHERE journal_item.user_id = (SELECT auth.uid())
    AND journal_item.deleted_at IS NULL
    AND journal_item.created_at >= (((now() AT TIME ZONE 'Asia/Kolkata')::date - 13)::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND journal_item.created_at < (((now() AT TIME ZONE 'Asia/Kolkata')::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
  GROUP BY journal_item.user_id, (journal_item.created_at AT TIME ZONE 'Asia/Kolkata')::date
),
workout_days AS (
  SELECT workout_item.user_id, workout_item.workout_date AS snapshot_date, true AS workout_logged
  FROM public.workouts workout_item
  WHERE workout_item.user_id = (SELECT auth.uid())
    AND workout_item.deleted_at IS NULL
    AND workout_item.workout_date >= ((now() AT TIME ZONE 'Asia/Kolkata')::date - 13)
    AND workout_item.workout_date <= ((now() AT TIME ZONE 'Asia/Kolkata')::date)
  GROUP BY workout_item.user_id, workout_item.workout_date
)
SELECT day_item.user_id, day_item.snapshot_date,
  coalesce(task_events.tasks_completed_count, 0)::integer AS tasks_completed_count,
  coalesce(habit_day_completion.habits_completed_count, 0)::integer AS habits_completed_count,
  coalesce(habit_totals.total_active_habits, 0)::integer AS total_active_habits,
  coalesce(journal_days.journal_logged, false) AS journal_logged,
  coalesce(workout_days.workout_logged, false) AS workout_logged
FROM days day_item
LEFT JOIN task_events ON task_events.user_id = day_item.user_id AND task_events.snapshot_date = day_item.snapshot_date
LEFT JOIN habit_day_completion ON habit_day_completion.user_id = day_item.user_id AND habit_day_completion.snapshot_date = day_item.snapshot_date
LEFT JOIN habit_totals ON habit_totals.user_id = day_item.user_id AND habit_totals.snapshot_date = day_item.snapshot_date
LEFT JOIN journal_days ON journal_days.user_id = day_item.user_id AND journal_days.snapshot_date = day_item.snapshot_date
LEFT JOIN workout_days ON workout_days.user_id = day_item.user_id AND workout_days.snapshot_date = day_item.snapshot_date
ORDER BY day_item.snapshot_date ASC;

GRANT SELECT ON public.current_day_snapshot_history_14d TO authenticated;

-- 3.3 data_lab_daily_activity_90d (90-day bounded index range scans + single events scan)
CREATE OR REPLACE VIEW public.data_lab_daily_activity_90d
WITH (security_invoker = true) AS
WITH scope AS (
  SELECT
    (SELECT auth.uid()) AS user_id,
    ((now() AT TIME ZONE 'Asia/Kolkata')::date) AS today,
    (((now() AT TIME ZONE 'Asia/Kolkata')::date) - 89) AS start_date
),
days AS (
  SELECT scope.user_id, generated_day::date AS activity_date
  FROM scope
  CROSS JOIN generate_series(scope.start_date, scope.today, interval '1 day') AS generated_day
  WHERE scope.user_id IS NOT NULL
),
habit_totals AS (
  SELECT day_item.user_id, day_item.activity_date, count(habit_item.id)::integer AS active_habits
  FROM days day_item
  LEFT JOIN public.habits habit_item ON habit_item.user_id = day_item.user_id
   AND (habit_item.created_at AT TIME ZONE 'Asia/Kolkata')::date <= day_item.activity_date
   AND (habit_item.deleted_at IS NULL OR (habit_item.deleted_at AT TIME ZONE 'Asia/Kolkata')::date > day_item.activity_date)
  GROUP BY day_item.user_id, day_item.activity_date
),
habit_completed AS (
  SELECT habit_log.user_id, habit_log.log_date AS activity_date, count(DISTINCT habit_log.habit_id)::integer AS habits_completed
  FROM public.habit_logs habit_log
  JOIN public.habits habit_item ON habit_item.id = habit_log.habit_id
  WHERE habit_log.user_id = (SELECT auth.uid())
    AND habit_log.log_date >= ((now() AT TIME ZONE 'Asia/Kolkata')::date - 89)
    AND habit_log.log_date <= ((now() AT TIME ZONE 'Asia/Kolkata')::date)
    AND habit_log.value >= habit_item.target_value
  GROUP BY habit_log.user_id, habit_log.log_date
),
journal_daily AS (
  SELECT journal_item.user_id, (journal_item.created_at AT TIME ZONE 'Asia/Kolkata')::date AS activity_date,
    count(*)::integer AS journal_entries, avg(journal_item.mood)::numeric(5,2) AS avg_mood
  FROM public.journal_entries journal_item
  WHERE journal_item.user_id = (SELECT auth.uid())
    AND journal_item.deleted_at IS NULL
    AND journal_item.created_at >= (((now() AT TIME ZONE 'Asia/Kolkata')::date - 89)::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND journal_item.created_at < (((now() AT TIME ZONE 'Asia/Kolkata')::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
  GROUP BY journal_item.user_id, (journal_item.created_at AT TIME ZONE 'Asia/Kolkata')::date
),
events_90d_daily AS (
  SELECT
    event_item.user_id,
    event_item.event_date_ist::date AS activity_date,
    count(*) FILTER (
      WHERE event_item.domain = 'productivity-hub'
        AND event_item.event_type IN ('task_created', 'productivity.task.created')
    )::integer AS tasks_created,
    count(*) FILTER (
      WHERE event_item.domain = 'productivity-hub'
        AND event_item.event_type IN ('task_status_updated', 'productivity.task.status_changed')
        AND coalesce(event_item.payload ->> 'status', '') = 'Done'
    )::integer AS tasks_completed,
    count(*)::integer AS events_logged,
    count(DISTINCT event_item.domain)::integer AS active_domains
  FROM public.events event_item
  WHERE event_item.user_id = (SELECT auth.uid())
    AND event_item.event_date_ist >= ((now() AT TIME ZONE 'Asia/Kolkata')::date - 89)
    AND event_item.event_date_ist <= ((now() AT TIME ZONE 'Asia/Kolkata')::date)
  GROUP BY event_item.user_id, event_item.event_date_ist::date
),
time_daily AS (
  SELECT time_log.user_id, (time_log.start_time AT TIME ZONE 'Asia/Kolkata')::date AS activity_date,
    coalesce(sum(time_log.duration_minutes), 0)::integer AS total_focus_minutes,
    coalesce(sum(time_log.duration_minutes) FILTER (WHERE time_log.bucket IN ('Deep Work', 'Learning')), 0)::integer AS deep_work_minutes,
    count(*)::integer AS focus_sessions
  FROM public.time_logs time_log
  WHERE time_log.user_id = (SELECT auth.uid())
    AND time_log.end_time IS NOT NULL
    AND time_log.start_time >= (((now() AT TIME ZONE 'Asia/Kolkata')::date - 89)::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND time_log.start_time < (((now() AT TIME ZONE 'Asia/Kolkata')::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
  GROUP BY time_log.user_id, (time_log.start_time AT TIME ZONE 'Asia/Kolkata')::date
),
fitness_daily AS (
  SELECT workout_item.user_id, workout_item.workout_date AS activity_date,
    count(*)::integer AS workouts_logged, coalesce(sum(workout_item.duration_minutes), 0)::integer AS workout_minutes
  FROM public.workouts workout_item
  WHERE workout_item.user_id = (SELECT auth.uid())
    AND workout_item.deleted_at IS NULL
    AND workout_item.end_time IS NOT NULL
    AND workout_item.workout_date >= ((now() AT TIME ZONE 'Asia/Kolkata')::date - 89)
    AND workout_item.workout_date <= ((now() AT TIME ZONE 'Asia/Kolkata')::date)
  GROUP BY workout_item.user_id, workout_item.workout_date
),
finance_daily AS (
  SELECT transaction_item.user_id, (transaction_item."timestamp" AT TIME ZONE 'Asia/Kolkata')::date AS activity_date,
    coalesce(sum(transaction_item.amount) FILTER (WHERE transaction_item.type = 'expense'), 0)::numeric(12,2) AS total_spent,
    coalesce(sum(transaction_item.amount) FILTER (WHERE transaction_item.type = 'expense' AND transaction_item.is_need = true), 0)::numeric(12,2) AS need_spent,
    coalesce(sum(transaction_item.amount) FILTER (WHERE transaction_item.type = 'expense' AND transaction_item.is_need = false), 0)::numeric(12,2) AS want_spent,
    count(*)::integer AS finance_entries
  FROM public.transactions transaction_item
  WHERE transaction_item.user_id = (SELECT auth.uid())
    AND transaction_item."timestamp" >= (((now() AT TIME ZONE 'Asia/Kolkata')::date - 89)::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND transaction_item."timestamp" < (((now() AT TIME ZONE 'Asia/Kolkata')::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
  GROUP BY transaction_item.user_id, (transaction_item."timestamp" AT TIME ZONE 'Asia/Kolkata')::date
),
learning_daily AS (
  SELECT lsl.user_id, (lsl.logged_at AT TIME ZONE 'Asia/Kolkata')::date AS activity_date,
    count(*)::integer AS learning_sessions_logged
  FROM public.learning_session_logs lsl
  WHERE lsl.user_id = (SELECT auth.uid())
    AND lsl.deleted_at IS NULL
    AND lsl.logged_at >= (((now() AT TIME ZONE 'Asia/Kolkata')::date - 89)::timestamp AT TIME ZONE 'Asia/Kolkata')
    AND lsl.logged_at < (((now() AT TIME ZONE 'Asia/Kolkata')::date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata')
  GROUP BY lsl.user_id, (lsl.logged_at AT TIME ZONE 'Asia/Kolkata')::date
)
SELECT day_item.user_id, day_item.activity_date,
  coalesce(habit_totals.active_habits, 0)::integer AS active_habits,
  coalesce(habit_completed.habits_completed, 0)::integer AS habits_completed,
  CASE WHEN coalesce(habit_totals.active_habits, 0) = 0 THEN 0
  ELSE round((coalesce(habit_completed.habits_completed, 0)::numeric / habit_totals.active_habits::numeric) * 100) END::integer AS habit_completion_percent,
  coalesce(journal_daily.journal_entries, 0)::integer AS journal_entries,
  coalesce(journal_daily.avg_mood, 0)::numeric(5,2) AS avg_mood,
  coalesce(events_90d_daily.tasks_created, 0)::integer AS tasks_created,
  coalesce(events_90d_daily.tasks_completed, 0)::integer AS tasks_completed,
  coalesce(time_daily.total_focus_minutes, 0)::integer AS total_focus_minutes,
  coalesce(time_daily.deep_work_minutes, 0)::integer AS deep_work_minutes,
  coalesce(time_daily.focus_sessions, 0)::integer AS focus_sessions,
  coalesce(fitness_daily.workouts_logged, 0)::integer AS workouts_logged,
  coalesce(fitness_daily.workout_minutes, 0)::integer AS workout_minutes,
  coalesce(finance_daily.total_spent, 0)::numeric(12,2) AS total_spent,
  coalesce(finance_daily.need_spent, 0)::numeric(12,2) AS need_spent,
  coalesce(finance_daily.want_spent, 0)::numeric(12,2) AS want_spent,
  coalesce(finance_daily.finance_entries, 0)::integer AS finance_entries,
  coalesce(learning_daily.learning_sessions_logged, 0)::integer AS learning_sessions_logged,
  coalesce(events_90d_daily.events_logged, 0)::integer AS events_logged,
  coalesce(events_90d_daily.active_domains, 0)::integer AS active_domains,
  (
    CASE WHEN coalesce(habit_completed.habits_completed, 0) > 0 THEN 1 ELSE 0 END +
    CASE WHEN coalesce(journal_daily.journal_entries, 0) > 0 THEN 1 ELSE 0 END +
    CASE WHEN coalesce(events_90d_daily.tasks_completed, 0) > 0 THEN 1 ELSE 0 END +
    CASE WHEN coalesce(time_daily.deep_work_minutes, 0) > 0 THEN 1 ELSE 0 END +
    CASE WHEN coalesce(fitness_daily.workouts_logged, 0) > 0 THEN 1 ELSE 0 END +
    CASE WHEN coalesce(finance_daily.finance_entries, 0) > 0 THEN 1 ELSE 0 END +
    CASE WHEN coalesce(learning_daily.learning_sessions_logged, 0) > 0 THEN 1 ELSE 0 END
  )::integer AS active_system_count
FROM days day_item
LEFT JOIN habit_totals ON habit_totals.user_id = day_item.user_id AND habit_totals.activity_date = day_item.activity_date
LEFT JOIN habit_completed ON habit_completed.user_id = day_item.user_id AND habit_completed.activity_date = day_item.activity_date
LEFT JOIN journal_daily ON journal_daily.user_id = day_item.user_id AND journal_daily.activity_date = day_item.activity_date
LEFT JOIN events_90d_daily ON events_90d_daily.user_id = day_item.user_id AND events_90d_daily.activity_date = day_item.activity_date
LEFT JOIN time_daily ON time_daily.user_id = day_item.user_id AND time_daily.activity_date = day_item.activity_date
LEFT JOIN fitness_daily ON fitness_daily.user_id = day_item.user_id AND fitness_daily.activity_date = day_item.activity_date
LEFT JOIN finance_daily ON finance_daily.user_id = day_item.user_id AND finance_daily.activity_date = day_item.activity_date
LEFT JOIN learning_daily ON learning_daily.user_id = day_item.user_id AND learning_daily.activity_date = day_item.activity_date
ORDER BY day_item.activity_date DESC;

GRANT SELECT ON public.data_lab_daily_activity_90d TO authenticated;

-- 3.4 data_lab_module_consistency_30d (single-pass over data_lab_daily_activity_90d)
CREATE OR REPLACE VIEW public.data_lab_module_consistency_30d
WITH (security_invoker = true) AS
WITH date_boundary AS (
  SELECT ((now() AT TIME ZONE 'Asia/Kolkata')::date - 29) AS cutoff
),
daily_30d AS (
  SELECT * FROM public.data_lab_daily_activity_90d
  WHERE activity_date >= (SELECT cutoff FROM date_boundary)
),
module_rows AS (
  SELECT d.user_id, d.activity_date, s.signal_key, s.was_active
  FROM daily_30d d
  CROSS JOIN LATERAL (
    VALUES
      ('mind-habits', d.habits_completed > 0),
      ('mind-journal', d.journal_entries > 0),
      ('execution-tasks', d.tasks_completed > 0),
      ('time-os', d.deep_work_minutes > 0),
      ('fitness-os', d.workouts_logged > 0),
      ('finance-os', d.finance_entries > 0),
      ('learning-os', d.learning_sessions_logged > 0)
  ) AS s(signal_key, was_active)
)
SELECT
  mr.user_id,
  sc.display_name AS module_name,
  count(*)::integer AS days_observed,
  count(*) FILTER (WHERE mr.was_active)::integer AS active_days,
  round((count(*) FILTER (WHERE mr.was_active)::numeric / nullif(count(*), 0)::numeric) * 100)::integer AS consistency_percent,
  max(mr.activity_date) FILTER (WHERE mr.was_active) AS last_active_date
FROM module_rows mr
JOIN public.data_lab_signal_config sc ON sc.signal_key = mr.signal_key
WHERE sc.is_active = true
GROUP BY mr.user_id, sc.display_name
ORDER BY consistency_percent DESC, sc.display_name ASC;

GRANT SELECT ON public.data_lab_module_consistency_30d TO authenticated;

-- 3.5 data_lab_weekly_system_score_12w (single-pass over data_lab_daily_activity_90d)
CREATE OR REPLACE VIEW public.data_lab_weekly_system_score_12w
WITH (security_invoker = true) AS
WITH date_boundary AS (
  SELECT date_trunc('week', ((now() AT TIME ZONE 'Asia/Kolkata')::date - 83)::timestamp)::date AS cutoff
),
daily AS (
  SELECT * FROM public.data_lab_daily_activity_90d
),
weekly_detail AS (
  SELECT
    user_id,
    date_trunc('week', activity_date::timestamp)::date AS week_start_date,
    count(*)::integer AS days_observed,
    count(*) FILTER (WHERE habits_completed > 0)::integer AS habit_active_days,
    count(*) FILTER (WHERE journal_entries > 0)::integer AS journal_days,
    count(*) FILTER (WHERE tasks_completed > 0)::integer AS task_completion_days,
    count(*) FILTER (WHERE deep_work_minutes > 0)::integer AS deep_work_days,
    count(*) FILTER (WHERE workouts_logged > 0)::integer AS workout_days,
    count(*) FILTER (WHERE finance_entries > 0)::integer AS finance_logged_days,
    count(*) FILTER (WHERE learning_sessions_logged > 0)::integer AS learning_logged_days,
    sum(habits_completed)::integer AS habits_completed,
    avg(habit_completion_percent)::numeric(5,2) AS avg_habit_completion_percent,
    sum(journal_entries)::integer AS journal_entries,
    avg(nullif(avg_mood, 0))::numeric(5,2) AS avg_mood,
    sum(tasks_created)::integer AS tasks_created,
    sum(tasks_completed)::integer AS tasks_completed,
    sum(total_focus_minutes)::integer AS total_focus_minutes,
    sum(deep_work_minutes)::integer AS deep_work_minutes,
    sum(workouts_logged)::integer AS workouts_logged,
    sum(workout_minutes)::integer AS workout_minutes,
    sum(total_spent)::numeric(12,2) AS total_spent,
    sum(need_spent)::numeric(12,2) AS need_spent,
    sum(want_spent)::numeric(12,2) AS want_spent,
    avg(active_system_count)::numeric(5,2) AS avg_active_systems,
    sum(events_logged)::integer AS events_logged
  FROM daily
  GROUP BY user_id, date_trunc('week', activity_date::timestamp)::date
),
signal_weekly AS (
  SELECT
    wd.user_id,
    wd.week_start_date,
    s.signal_key,
    s.active_days
  FROM weekly_detail wd
  CROSS JOIN LATERAL (
    VALUES
      ('mind-habits', wd.habit_active_days),
      ('mind-journal', wd.journal_days),
      ('execution-tasks', wd.task_completion_days),
      ('time-os', wd.deep_work_days),
      ('fitness-os', wd.workout_days),
      ('finance-os', wd.finance_logged_days),
      ('learning-os', wd.learning_logged_days)
  ) AS s(signal_key, active_days)
),
signal_score AS (
  SELECT
    sw.user_id,
    sw.week_start_date,
    sum(
      sc.weight_percent * least(sw.active_days, sc.weight_cap_days)::numeric / sc.weight_cap_days
    ) AS weighted_signal_score
  FROM signal_weekly sw
  JOIN public.data_lab_signal_config sc ON sc.signal_key = sw.signal_key
  WHERE sc.is_active = true AND sc.weight_percent > 0
  GROUP BY sw.user_id, sw.week_start_date
),
breadth_score AS (
  SELECT
    wd.user_id,
    wd.week_start_date,
    least(wd.avg_active_systems, (SELECT count(*) FROM public.data_lab_signal_config WHERE is_active = true))::numeric
      / nullif((SELECT count(*) FROM public.data_lab_signal_config WHERE is_active = true), 0)::numeric
      * 10 AS breadth_points
  FROM weekly_detail wd
)
SELECT
  wd.*,
  round(
    coalesce(ss.weighted_signal_score, 0) + coalesce(bs.breadth_points, 0)
  )::integer AS weekly_system_score
FROM weekly_detail wd
LEFT JOIN signal_score ss ON ss.user_id = wd.user_id AND ss.week_start_date = wd.week_start_date
LEFT JOIN breadth_score bs ON bs.user_id = wd.user_id AND bs.week_start_date = wd.week_start_date
WHERE wd.week_start_date >= (SELECT cutoff FROM date_boundary)
ORDER BY wd.week_start_date DESC;

GRANT SELECT ON public.data_lab_weekly_system_score_12w TO authenticated;

-- 3.6 data_lab_event_coverage_30d ((select auth.uid()) + native date predicate)
CREATE OR REPLACE VIEW public.data_lab_event_coverage_30d
WITH (security_invoker = true) AS
SELECT
  event_item.user_id,
  event_item.domain,
  event_item.event_type,
  count(*)::integer AS event_count,
  count(DISTINCT event_item.event_date_ist)::integer AS active_days,
  min(event_item.event_date_ist)::date AS first_seen_date,
  max(event_item.event_date_ist)::date AS last_seen_date
FROM public.events event_item
WHERE event_item.user_id = (SELECT auth.uid())
  AND event_item.event_date_ist >= ((now() AT TIME ZONE 'Asia/Kolkata')::date - 29)
GROUP BY event_item.user_id, event_item.domain, event_item.event_type
ORDER BY event_item.domain ASC, event_item.event_type ASC;

GRANT SELECT ON public.data_lab_event_coverage_30d TO authenticated;

COMMIT;
