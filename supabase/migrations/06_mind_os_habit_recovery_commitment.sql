alter table public.habit_streak_breaks
  add column if not exists recovery_commitment text;
