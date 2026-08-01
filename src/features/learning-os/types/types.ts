export type RoadmapStatus = 'active' | 'paused' | 'completed' | 'abandoned'
export type ProjectStatus = 'not_started' | 'in_progress' | 'done'
export type ReflectionType = 'general' | 'weekly_milestone' | 'teach_back_test'

export interface LearningRoadmap {
  id: string
  user_id: string
  title: string
  slug: string | null
  description: string | null
  status: RoadmapStatus
  start_date: string | null
  target_end_date: string | null
  actual_end_date: string | null
  color: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface LearningStage {
  id: string
  user_id: string
  roadmap_id: string
  order_index: number
  title: string
  subtitle: string | null
  note: string | null
  color: string | null
  start_date: string | null
  end_date: string | null
  is_skipped: boolean
  created_at: string
}

export interface LearningSession {
  id: string
  user_id: string
  stage_id: string
  order_index: number
  slot: string | null
  title: string
  description: string | null
  estimated_minutes: number | null
  tags: string[]
  target_date: string | null
  is_skipped: boolean
  created_at: string
}

export interface LearningSessionLog {
  id: string
  user_id: string
  session_id: string | null
  roadmap_id: string
  time_log_id: string | null
  logged_at: string
  duration_minutes: number | null
  metrics: Record<string, unknown>
  notes: string | null
  created_at: string
}

export interface LearningMilestone {
  id: string
  user_id: string
  roadmap_id: string
  stage_id: string | null
  title: string
  achieved: boolean
  achieved_at: string | null
  created_at: string
}

export interface LearningProject {
  id: string
  user_id: string
  roadmap_id: string
  stage_id: string | null
  title: string
  description: string | null
  status: ProjectStatus
  repo_url: string | null
  completed_at: string | null
  created_at: string
}

export interface LearningReflection {
  id: string
  user_id: string
  roadmap_id: string
  stage_id: string | null
  session_id: string | null
  content: string
  reflection_type: ReflectionType
  created_at: string
}

export interface StageProgress {
  stage_id: string
  roadmap_id: string
  total_sessions: number
  completed_sessions: number
  pct_complete: number
}

export interface RoadmapProgress {
  roadmap_id: string
  total_sessions: number
  completed_sessions: number
  pct_complete: number
}

export interface CPSessionMetrics {
  problems_solved?: number
  mood_at_log?: number
}
