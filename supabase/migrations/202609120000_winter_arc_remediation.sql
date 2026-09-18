-- Create seasons table (ADR-012)
CREATE TABLE IF NOT EXISTS public.life_seasons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  vows jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.life_seasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own life seasons" ON public.life_seasons FOR ALL USING (auth.uid() = user_id);

-- Create user_achievements table (ADR-016)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own achievements" ON public.user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE UNIQUE INDEX idx_user_achievements_unique ON public.user_achievements (user_id, badge_id);

-- Create pulse_logs table (ADR-022)
CREATE TABLE IF NOT EXISTS public.pulse_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp timestamptz DEFAULT now() NOT NULL,
  value text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.pulse_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own pulse logs" ON public.pulse_logs FOR ALL USING (auth.uid() = user_id);

-- Create knowledge_resources table
CREATE TABLE IF NOT EXISTS public.knowledge_resources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text,
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.knowledge_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own knowledge resources" ON public.knowledge_resources FOR ALL USING (auth.uid() = user_id);

-- Create experiments table
CREATE TABLE IF NOT EXISTS public.experiments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'Active',
  metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own experiments" ON public.experiments FOR ALL USING (auth.uid() = user_id);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  finance_preferences jsonb DEFAULT '{}'::jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);
CREATE UNIQUE INDEX idx_user_settings_user_id ON public.user_settings (user_id);
