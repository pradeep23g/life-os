-- Security Advisor closure for the September 2026 production baseline.
--
-- These are intentionally narrow, additive hardening changes:
-- 1. Force the live snapshot view to execute with caller permissions/RLS.
-- 2. Pin the habit-heal trigger function's search_path so name resolution
--    cannot be changed by the caller/session.
--
-- Do not replace or rebuild the view here: the existing view definition is
-- already the canonical application contract. This migration only hardens
-- its security mode.

alter view public.current_day_snapshot
  set (security_invoker = true);

alter function public.enforce_habit_streak_heal_monthly_limit()
  set search_path = public;
