-- Add movement_pattern to fitness_exercises for Architectural Catalog dual-categorization
ALTER TABLE public.fitness_exercises
ADD COLUMN IF NOT EXISTS movement_pattern text;

-- Add duration_seconds to exercise_logs for Calisthenics peak hold tracking
ALTER TABLE public.exercise_logs
ADD COLUMN IF NOT EXISTS duration_seconds integer check (duration_seconds >= 0);
