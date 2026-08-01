export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          habit_type: 'binary' | 'target'
          target_value: number
          unit: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          habit_type?: 'binary' | 'target'
          target_value?: number
          unit?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          habit_type?: 'binary' | 'target'
          target_value?: number
          unit?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          value: number
          logged_at: string
          log_date: string
          struggle_note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          value?: number
          logged_at?: string
          log_date?: string
          struggle_note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          value?: number
          logged_at?: string
          log_date?: string
          struggle_note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      habit_streak_breaks: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          break_date: string
          reason: string | null
          recovery_commitment: string | null
          created_at: string
          healed_at: string | null
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          break_date: string
          reason?: string | null
          recovery_commitment?: string | null
          created_at?: string
          healed_at?: string | null
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          break_date?: string
          reason?: string | null
          recovery_commitment?: string | null
          created_at?: string
          healed_at?: string | null
        }
        Relationships: []
      }
      habit_streak_heals: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          break_id: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          break_id: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          break_id?: string
          reason?: string | null
          created_at?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          id: string
          user_id: string
          mood: number
          what_went_good: string | null
          what_you_learned: string | null
          brief_about_day: string | null
          went_well: string | null
          went_wrong: string | null
          lesson_learned: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          mood: number
          what_went_good?: string | null
          what_you_learned?: string | null
          brief_about_day?: string | null
          went_well?: string | null
          went_wrong?: string | null
          lesson_learned?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          mood?: number
          what_went_good?: string | null
          what_you_learned?: string | null
          brief_about_day?: string | null
          went_well?: string | null
          went_wrong?: string | null
          lesson_learned?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          deadline_type: 'same_day' | 'no_deadline' | 'specific_date'
          deadline_date: string | null
          is_completed: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          deadline_type?: 'same_day' | 'no_deadline' | 'specific_date'
          deadline_date?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          deadline_type?: 'same_day' | 'no_deadline' | 'specific_date'
          deadline_date?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          domain: 'mind-os' | 'productivity-hub' | 'learning-os' | 'fitness-os' | 'finance-os' | 'progress-hub'
          status: string
          target_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          domain: 'mind-os' | 'productivity-hub' | 'learning-os' | 'fitness-os' | 'finance-os' | 'progress-hub'
          status?: string
          target_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          domain?: 'mind-os' | 'productivity-hub' | 'learning-os' | 'fitness-os' | 'finance-os' | 'progress-hub'
          status?: string
          target_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      weekly_plans: {
        Row: {
          id: string
          user_id: string
          week_start_date: string
          focus_text: string | null
          outcomes: string[]
          reflection: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          week_start_date: string
          focus_text?: string | null
          outcomes?: string[]
          reflection?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          week_start_date?: string
          focus_text?: string | null
          outcomes?: string[]
          reflection?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      weekly_plan_items: {
        Row: {
          id: string
          user_id: string
          plan_id: string | null
          week_start_date: string
          title: string
          priority: 'Low' | 'Medium' | 'High'
          order_index: number
          status: 'Planned' | 'Doing' | 'Done' | 'Dropped'
          goal_id: string | null
          linked_task_id: string | null
          linked_habit_id: string | null
          notes: string | null
          is_completed: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan_id?: string | null
          week_start_date?: string
          title: string
          priority?: 'Low' | 'Medium' | 'High'
          order_index?: number
          status?: 'Planned' | 'Doing' | 'Done' | 'Dropped'
          goal_id?: string | null
          linked_task_id?: string | null
          linked_habit_id?: string | null
          notes?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string | null
          week_start_date?: string
          title?: string
          priority?: 'Low' | 'Medium' | 'High'
          order_index?: number
          status?: 'Planned' | 'Doing' | 'Done' | 'Dropped'
          goal_id?: string | null
          linked_task_id?: string | null
          linked_habit_id?: string | null
          notes?: string | null
          is_completed?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          id: string
          user_id: string
          week_start_date: string
          wins: string | null
          blockers: string | null
          next_adjustments: string | null
          challenges: string | null
          lessons: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          week_start_date: string
          wins?: string | null
          blockers?: string | null
          next_adjustments?: string | null
          challenges?: string | null
          lessons?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          week_start_date?: string
          wins?: string | null
          blockers?: string | null
          next_adjustments?: string | null
          challenges?: string | null
          lessons?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          workout_date: string
          title: string
          session_type: string | null
          duration_minutes: number | null
          notes: string | null
          start_time: string | null
          end_time: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          workout_date: string
          title?: string
          session_type?: string | null
          duration_minutes?: number | null
          notes?: string | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          workout_date?: string
          title?: string
          session_type?: string | null
          duration_minutes?: number | null
          notes?: string | null
          start_time?: string | null
          end_time?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          id: string
          workout_id: string
          exercise_name: string
          reps: number
          weight_kg: number
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_name: string
          reps: number
          weight_kg: number
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_name?: string
          reps?: number
          weight_kg?: number
          created_at?: string
        }
        Relationships: []
      }
      fitness_exercises: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string | null
          equipment: string | string[] | null
          primary_muscle: string | null
          target_muscles: string[] | null
          default_unit: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category?: string | null
          equipment?: string | string[] | null
          primary_muscle?: string | null
          target_muscles?: string[] | null
          default_unit?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string | null
          equipment?: string | string[] | null
          primary_muscle?: string | null
          target_muscles?: string[] | null
          default_unit?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          id: string
          user_id: string
          workout_id: string
          exercise_id: string
          order_index: number
          sets: number | null
          reps_total: number | null
          weight_kg: number | null
          duration_minutes: number | null
          distance_km: number | null
          rpe: number | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          workout_id: string
          exercise_id: string
          order_index?: number
          sets?: number | null
          reps_total?: number | null
          weight_kg?: number | null
          duration_minutes?: number | null
          distance_km?: number | null
          rpe?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          workout_id?: string
          exercise_id?: string
          order_index?: number
          sets?: number | null
          reps_total?: number | null
          weight_kg?: number | null
          duration_minutes?: number | null
          distance_km?: number | null
          rpe?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "fitness_exercises"
            referencedColumns: ["id"]
          }
        ]
      }
      time_logs: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          bucket: string
          duration_minutes: number | null
          start_time: string
          end_time: string | null
          description: string | null
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          bucket: string
          duration_minutes?: number | null
          start_time?: string
          end_time?: string | null
          description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          bucket?: string
          duration_minutes?: number | null
          start_time?: string
          end_time?: string | null
          description?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          timestamp: string
          is_need: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          timestamp?: string
          is_need?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          timestamp?: string
          is_need?: boolean | null
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string
          is_need: boolean
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          category: string
          is_need?: boolean
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          category?: string
          is_need?: boolean
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          id: string
          user_id: string
          sync_date: string
          momentum_score: number
          events_processed: number
          metric_date: string | null
          eod_score: number | null
          task_completion_rate: number | null
          habit_completion_rate: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sync_date?: string
          momentum_score?: number
          events_processed?: number
          metric_date?: string | null
          eod_score?: number | null
          task_completion_rate?: number | null
          habit_completion_rate?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sync_date?: string
          momentum_score?: number
          events_processed?: number
          metric_date?: string | null
          eod_score?: number | null
          task_completion_rate?: number | null
          habit_completion_rate?: number | null
          created_at?: string
        }
        Relationships: []
      }
      system_event_queue: {
        Row: {
          id: string
          user_id: string
          event_type: string
          payload: Json
          status: 'pending' | 'processed' | 'failed'
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          payload?: Json
          status?: 'pending' | 'processed' | 'failed'
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          payload?: Json
          status?: 'pending' | 'processed' | 'failed'
          created_at?: string
          processed_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          id: string
          user_id: string
          domain: 'mind-os' | 'productivity-hub' | 'learning-os' | 'mission-control' | 'fitness-os' | 'finance-os' | 'time-os' | 'progress-hub'
          entity_type: string
          entity_id: string | null
          event_type: string
          payload: Json
          event_date_ist: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          domain: 'mind-os' | 'productivity-hub' | 'learning-os' | 'mission-control' | 'fitness-os' | 'finance-os' | 'time-os' | 'progress-hub'
          entity_type: string
          entity_id?: string | null
          event_type: string
          payload?: Json
          event_date_ist?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          domain?: 'mind-os' | 'productivity-hub' | 'learning-os' | 'mission-control' | 'fitness-os' | 'finance-os' | 'time-os' | 'progress-hub'
          entity_type?: string
          entity_id?: string | null
          event_type?: string
          payload?: Json
          event_date_ist?: string
          created_at?: string
        }
        Relationships: []
      }
      data_lab_signal_config: {
        Row: {
          signal_key: string
          display_name: string
          weight_percent: number
          weight_cap_days: number
          is_active: boolean
        }
        Insert: {
          signal_key: string
          display_name: string
          weight_percent?: number
          weight_cap_days?: number
          is_active?: boolean
        }
        Update: {
          signal_key?: string
          display_name?: string
          weight_percent?: number
          weight_cap_days?: number
          is_active?: boolean
        }
        Relationships: []
      }
      progress_hub_archive: {
        Row: {
          id: string
          user_id: string
          archived_at: string
          programming_skills: Json
          personal_skills: Json
          milestones: Json
          challenges: Json
        }
        Insert: {
          id?: string
          user_id: string
          archived_at?: string
          programming_skills?: Json
          personal_skills?: Json
          milestones?: Json
          challenges?: Json
        }
        Update: {
          id?: string
          user_id?: string
          archived_at?: string
          programming_skills?: Json
          personal_skills?: Json
          milestones?: Json
          challenges?: Json
        }
        Relationships: []
      }
      learning_roadmaps: {
        Row: {
          id: string
          user_id: string
          title: string
          slug: string | null
          description: string | null
          status: 'active' | 'paused' | 'completed' | 'abandoned'
          start_date: string | null
          target_end_date: string | null
          actual_end_date: string | null
          color: string | null
          metadata: Json
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          slug?: string | null
          description?: string | null
          status?: 'active' | 'paused' | 'completed' | 'abandoned'
          start_date?: string | null
          target_end_date?: string | null
          actual_end_date?: string | null
          color?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          slug?: string | null
          description?: string | null
          status?: 'active' | 'paused' | 'completed' | 'abandoned'
          start_date?: string | null
          target_end_date?: string | null
          actual_end_date?: string | null
          color?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      learning_stages: {
        Row: {
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
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          roadmap_id: string
          order_index: number
          title: string
          subtitle?: string | null
          note?: string | null
          color?: string | null
          start_date?: string | null
          end_date?: string | null
          is_skipped?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          roadmap_id?: string
          order_index?: number
          title?: string
          subtitle?: string | null
          note?: string | null
          color?: string | null
          start_date?: string | null
          end_date?: string | null
          is_skipped?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      learning_sessions: {
        Row: {
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
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          stage_id: string
          order_index: number
          slot?: string | null
          title: string
          description?: string | null
          estimated_minutes?: number | null
          tags?: string[]
          target_date?: string | null
          is_skipped?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          stage_id?: string
          order_index?: number
          slot?: string | null
          title?: string
          description?: string | null
          estimated_minutes?: number | null
          tags?: string[]
          target_date?: string | null
          is_skipped?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      learning_session_logs: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          roadmap_id: string
          time_log_id: string | null
          logged_at: string
          duration_minutes: number | null
          metrics: Json
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          roadmap_id: string
          time_log_id?: string | null
          logged_at?: string
          duration_minutes?: number | null
          metrics?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          roadmap_id?: string
          time_log_id?: string | null
          logged_at?: string
          duration_minutes?: number | null
          metrics?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      learning_milestones: {
        Row: {
          id: string
          user_id: string
          roadmap_id: string
          stage_id: string | null
          title: string
          achieved: boolean
          achieved_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          roadmap_id: string
          stage_id?: string | null
          title: string
          achieved?: boolean
          achieved_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          roadmap_id?: string
          stage_id?: string | null
          title?: string
          achieved?: boolean
          achieved_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      learning_projects: {
        Row: {
          id: string
          user_id: string
          roadmap_id: string
          stage_id: string | null
          title: string
          description: string | null
          status: 'not_started' | 'in_progress' | 'done'
          repo_url: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          roadmap_id: string
          stage_id?: string | null
          title: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'done'
          repo_url?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          roadmap_id?: string
          stage_id?: string | null
          title?: string
          description?: string | null
          status?: 'not_started' | 'in_progress' | 'done'
          repo_url?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
      learning_reflections: {
        Row: {
          id: string
          user_id: string
          roadmap_id: string
          stage_id: string | null
          session_id: string | null
          content: string
          reflection_type: 'general' | 'weekly_milestone' | 'teach_back_test'
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          roadmap_id: string
          stage_id?: string | null
          session_id?: string | null
          content: string
          reflection_type?: 'general' | 'weekly_milestone' | 'teach_back_test'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          roadmap_id?: string
          stage_id?: string | null
          session_id?: string | null
          content?: string
          reflection_type?: 'general' | 'weekly_milestone' | 'teach_back_test'
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      current_day_snapshot: {
        Row: {
          user_id: string
          snapshot_date: string
          pending_tasks_count: number
          total_active_habits: number
          habits_completed_today: number
          journal_logged_today: boolean
          workout_days_this_week: number
          deep_work_minutes_today: number
          learning_sessions_logged_7d: number
          active_roadmaps_count: number
          oldest_pending_task_title: string | null
          newest_active_habit_title: string | null
        }
        Relationships: []
      }
      current_day_snapshot_history_14d: {
        Row: {
          user_id: string
          snapshot_date: string
          tasks_completed_count: number
          habits_completed_count: number
          total_active_habits: number
          journal_logged: boolean
          workout_logged: boolean
        }
        Relationships: []
      }
      data_lab_daily_activity_90d: {
        Row: {
          user_id: string
          activity_date: string
          active_habits: number
          habits_completed: number
          habit_completion_percent: number
          journal_entries: number
          avg_mood: number
          tasks_created: number
          tasks_completed: number
          total_focus_minutes: number
          deep_work_minutes: number
          focus_sessions: number
          workouts_logged: number
          workout_minutes: number
          total_spent: number
          need_spent: number
          want_spent: number
          finance_entries: number
          learning_sessions_logged: number
          events_logged: number
          active_domains: number
          active_system_count: number
        }
        Relationships: []
      }
      data_lab_weekly_system_score_12w: {
        Row: {
          user_id: string
          week_start_date: string
          days_observed: number
          habit_active_days: number
          journal_days: number
          task_completion_days: number
          deep_work_days: number
          workout_days: number
          finance_logged_days: number
          learning_logged_days: number
          habits_completed: number
          avg_habit_completion_percent: number
          journal_entries: number
          avg_mood: number
          tasks_created: number
          tasks_completed: number
          total_focus_minutes: number
          deep_work_minutes: number
          workouts_logged: number
          workout_minutes: number
          total_spent: number
          need_spent: number
          want_spent: number
          avg_active_systems: number
          events_logged: number
          weekly_system_score: number
        }
        Relationships: []
      }
      data_lab_module_consistency_30d: {
        Row: {
          user_id: string
          module_name: string
          days_observed: number
          active_days: number
          consistency_percent: number
          last_active_date: string | null
        }
        Relationships: []
      }
      data_lab_event_coverage_30d: {
        Row: {
          user_id: string
          domain: string
          event_type: string
          event_count: number
          active_days: number
          first_seen_date: string | null
          last_seen_date: string | null
        }
        Relationships: []
      }
      data_lab_signal_mind_habits: {
        Row: {
          user_id: string
          activity_date: string
          was_active: boolean
          magnitude: number
          metrics: Json
        }
        Relationships: []
      }
      data_lab_signal_mind_journal: {
        Row: {
          user_id: string
          activity_date: string
          was_active: boolean
          magnitude: number
          metrics: Json
        }
        Relationships: []
      }
      data_lab_signal_execution_tasks: {
        Row: {
          user_id: string
          activity_date: string
          was_active: boolean
          magnitude: number
          metrics: Json
        }
        Relationships: []
      }
      data_lab_signal_time_os: {
        Row: {
          user_id: string
          activity_date: string
          was_active: boolean
          magnitude: number
          metrics: Json
        }
        Relationships: []
      }
      data_lab_signal_fitness_os: {
        Row: {
          user_id: string
          activity_date: string
          was_active: boolean
          magnitude: number
          metrics: Json
        }
        Relationships: []
      }
      data_lab_signal_finance_os: {
        Row: {
          user_id: string
          activity_date: string
          was_active: boolean
          magnitude: number
          metrics: Json
        }
        Relationships: []
      }
      data_lab_signal_learning_os: {
        Row: {
          user_id: string
          activity_date: string
          was_active: boolean
          magnitude: number
          metrics: Json
        }
        Relationships: []
      }
      learning_stage_progress: {
        Row: {
          stage_id: string
          roadmap_id: string
          total_sessions: number
          completed_sessions: number
          pct_complete: number
        }
        Relationships: []
      }
      learning_roadmap_progress: {
        Row: {
          roadmap_id: string
          total_sessions: number
          completed_sessions: number
          pct_complete: number
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
