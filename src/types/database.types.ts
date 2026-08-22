export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      data_lab_signal_config: {
        Row: {
          display_name: string
          is_active: boolean
          signal_key: string
          weight_cap_days: number
          weight_percent: number
        }
        Insert: {
          display_name: string
          is_active?: boolean
          signal_key: string
          weight_cap_days?: number
          weight_percent?: number
        }
        Update: {
          display_name?: string
          is_active?: boolean
          signal_key?: string
          weight_cap_days?: number
          weight_percent?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          domain: string
          entity_id: string | null
          entity_type: string
          event_date_ist: string
          event_type: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          entity_id?: string | null
          entity_type: string
          event_date_ist: string
          event_type: string
          id?: string
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          entity_id?: string | null
          entity_type?: string
          event_date_ist?: string
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          created_at: string
          deleted_at: string | null
          distance_km: number | null
          duration_minutes: number | null
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps_total: number | null
          rpe: number | null
          sets: number | null
          updated_at: string
          user_id: string
          weight_kg: number | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          distance_km?: number | null
          duration_minutes?: number | null
          exercise_id: string
          id?: string
          notes?: string | null
          order_index?: number
          reps_total?: number | null
          rpe?: number | null
          sets?: number | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
          workout_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          distance_km?: number | null
          duration_minutes?: number | null
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps_total?: number | null
          rpe?: number | null
          sets?: number | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "fitness_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_exercises: {
        Row: {
          category: string | null
          created_at: string
          default_unit: string | null
          deleted_at: string | null
          equipment: string[] | null
          id: string
          name: string
          notes: string | null
          target_muscles: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_unit?: string | null
          deleted_at?: string | null
          equipment?: string[] | null
          id?: string
          name: string
          notes?: string | null
          target_muscles?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_unit?: string | null
          deleted_at?: string | null
          equipment?: string[] | null
          id?: string
          name?: string
          notes?: string | null
          target_muscles?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          domain: string
          id: string
          notes: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          notes?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          notes?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          habit_id: string
          id: string
          log_date: string
          logged_at: string
          struggle_note: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          habit_id: string
          id?: string
          log_date: string
          logged_at?: string
          struggle_note?: string | null
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          logged_at?: string
          struggle_note?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_streak_breaks: {
        Row: {
          break_date: string
          created_at: string
          habit_id: string
          healed_at: string | null
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          break_date: string
          created_at?: string
          habit_id: string
          healed_at?: string | null
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          break_date?: string
          created_at?: string
          habit_id?: string
          healed_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_streak_breaks_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_streak_heals: {
        Row: {
          break_id: string
          created_at: string
          habit_id: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          break_id: string
          created_at?: string
          habit_id: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          break_id?: string
          created_at?: string
          habit_id?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_streak_heals_break_id_fkey"
            columns: ["break_id"]
            isOneToOne: true
            referencedRelation: "habit_streak_breaks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "habit_streak_heals_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          deleted_at: string | null
          habit_type: string
          id: string
          target_value: number
          title: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          habit_type?: string
          id?: string
          target_value?: number
          title: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          habit_type?: string
          id?: string
          target_value?: number
          title?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          brief_about_day: string | null
          created_at: string
          deleted_at: string | null
          id: string
          lesson_learned: string | null
          mood: number
          updated_at: string
          user_id: string
          went_well: string | null
          went_wrong: string | null
          what_went_good: string | null
          what_you_learned: string | null
        }
        Insert: {
          brief_about_day?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          lesson_learned?: string | null
          mood: number
          updated_at?: string
          user_id: string
          went_well?: string | null
          went_wrong?: string | null
          what_went_good?: string | null
          what_you_learned?: string | null
        }
        Update: {
          brief_about_day?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          lesson_learned?: string | null
          mood?: number
          updated_at?: string
          user_id?: string
          went_well?: string | null
          went_wrong?: string | null
          what_went_good?: string | null
          what_you_learned?: string | null
        }
        Relationships: []
      }
      learning_milestones: {
        Row: {
          achieved: boolean
          achieved_at: string | null
          created_at: string
          deleted_at: string | null
          id: string
          roadmap_id: string
          stage_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achieved?: boolean
          achieved_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          roadmap_id: string
          stage_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achieved?: boolean
          achieved_at?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          roadmap_id?: string
          stage_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_milestones_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmap_progress"
            referencedColumns: ["roadmap_id"]
          },
          {
            foreignKeyName: "learning_milestones_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_milestones_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "learning_stage_progress"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "learning_milestones_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "learning_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_projects: {
        Row: {
          completed_at: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          repo_url: string | null
          roadmap_id: string
          stage_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          repo_url?: string | null
          roadmap_id: string
          stage_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          repo_url?: string | null
          roadmap_id?: string
          stage_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_projects_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmap_progress"
            referencedColumns: ["roadmap_id"]
          },
          {
            foreignKeyName: "learning_projects_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_projects_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "learning_stage_progress"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "learning_projects_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "learning_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_reflections: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          reflection_type: string
          roadmap_id: string
          session_id: string | null
          stage_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          reflection_type?: string
          roadmap_id: string
          session_id?: string | null
          stage_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          reflection_type?: string
          roadmap_id?: string
          session_id?: string | null
          stage_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_reflections_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmap_progress"
            referencedColumns: ["roadmap_id"]
          },
          {
            foreignKeyName: "learning_reflections_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_reflections_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_reflections_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "learning_stage_progress"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "learning_reflections_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "learning_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_roadmaps: {
        Row: {
          actual_end_date: string | null
          color: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          slug: string | null
          start_date: string | null
          status: string
          target_end_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_end_date?: string | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          slug?: string | null
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_end_date?: string | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          slug?: string | null
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_session_logs: {
        Row: {
          created_at: string
          deleted_at: string | null
          duration_minutes: number | null
          id: string
          logged_at: string
          metrics: Json | null
          notes: string | null
          roadmap_id: string
          session_id: string | null
          time_log_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          id?: string
          logged_at?: string
          metrics?: Json | null
          notes?: string | null
          roadmap_id: string
          session_id?: string | null
          time_log_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number | null
          id?: string
          logged_at?: string
          metrics?: Json | null
          notes?: string | null
          roadmap_id?: string
          session_id?: string | null
          time_log_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_session_logs_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmap_progress"
            referencedColumns: ["roadmap_id"]
          },
          {
            foreignKeyName: "learning_session_logs_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_session_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_session_logs_time_log_id_fkey"
            columns: ["time_log_id"]
            isOneToOne: false
            referencedRelation: "time_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_sessions: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          estimated_minutes: number | null
          id: string
          is_skipped: boolean
          order_index: number
          slot: string | null
          stage_id: string
          tags: string[] | null
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_skipped?: boolean
          order_index: number
          slot?: string | null
          stage_id: string
          tags?: string[] | null
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          estimated_minutes?: number | null
          id?: string
          is_skipped?: boolean
          order_index?: number
          slot?: string | null
          stage_id?: string
          tags?: string[] | null
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "learning_stage_progress"
            referencedColumns: ["stage_id"]
          },
          {
            foreignKeyName: "learning_sessions_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "learning_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_stages: {
        Row: {
          color: string | null
          created_at: string
          deleted_at: string | null
          end_date: string | null
          id: string
          is_skipped: boolean
          note: string | null
          order_index: number
          roadmap_id: string
          start_date: string | null
          subtitle: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          is_skipped?: boolean
          note?: string | null
          order_index: number
          roadmap_id: string
          start_date?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          end_date?: string | null
          id?: string
          is_skipped?: boolean
          note?: string | null
          order_index?: number
          roadmap_id?: string
          start_date?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_stages_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmap_progress"
            referencedColumns: ["roadmap_id"]
          },
          {
            foreignKeyName: "learning_stages_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      progress_hub_archive: {
        Row: {
          archived_at: string
          challenges: Json
          id: string
          milestones: Json
          personal_skills: Json
          programming_skills: Json
          user_id: string
        }
        Insert: {
          archived_at?: string
          challenges?: Json
          id?: string
          milestones?: Json
          personal_skills?: Json
          programming_skills?: Json
          user_id: string
        }
        Update: {
          archived_at?: string
          challenges?: Json
          id?: string
          milestones?: Json
          personal_skills?: Json
          programming_skills?: Json
          user_id?: string
        }
        Relationships: []
      }
      system_event_queue: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          created_at: string
          events_processed: number
          id: string
          momentum_score: number
          sync_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events_processed?: number
          id?: string
          momentum_score?: number
          sync_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          events_processed?: number
          id?: string
          momentum_score?: number
          sync_date?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          deadline_date: string | null
          deadline_type: string
          deleted_at: string | null
          id: string
          is_completed: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline_date?: string | null
          deadline_type?: string
          deleted_at?: string | null
          id?: string
          is_completed?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline_date?: string | null
          deadline_type?: string
          deleted_at?: string | null
          id?: string
          is_completed?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_logs: {
        Row: {
          bucket: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          start_time: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bucket: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          start_time: string
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bucket?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          start_time?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          id: string
          is_need: boolean | null
          timestamp: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          id?: string
          is_need?: boolean | null
          timestamp?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          id?: string
          is_need?: boolean | null
          timestamp?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_plan_items: {
        Row: {
          created_at: string
          goal_id: string | null
          id: string
          linked_habit_id: string | null
          linked_task_id: string | null
          notes: string | null
          order_index: number
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          goal_id?: string | null
          id?: string
          linked_habit_id?: string | null
          linked_task_id?: string | null
          notes?: string | null
          order_index?: number
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          goal_id?: string | null
          id?: string
          linked_habit_id?: string | null
          linked_task_id?: string | null
          notes?: string | null
          order_index?: number
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_plan_items_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_plan_items_linked_habit_id_fkey"
            columns: ["linked_habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_plan_items_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_plans: {
        Row: {
          created_at: string
          focus_text: string
          id: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          focus_text: string
          id?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          focus_text?: string
          id?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      weekly_reviews: {
        Row: {
          blockers: string | null
          created_at: string
          id: string
          next_adjustments: string | null
          updated_at: string
          user_id: string
          week_start_date: string
          wins: string | null
        }
        Insert: {
          blockers?: string | null
          created_at?: string
          id?: string
          next_adjustments?: string | null
          updated_at?: string
          user_id: string
          week_start_date: string
          wins?: string | null
        }
        Update: {
          blockers?: string | null
          created_at?: string
          id?: string
          next_adjustments?: string | null
          updated_at?: string
          user_id?: string
          week_start_date?: string
          wins?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          deleted_at: string | null
          duration_minutes: number
          end_time: string | null
          id: string
          notes: string | null
          session_type: string | null
          start_time: string | null
          title: string
          updated_at: string
          user_id: string
          workout_date: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          end_time?: string | null
          id?: string
          notes?: string | null
          session_type?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          user_id: string
          workout_date: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          duration_minutes?: number
          end_time?: string | null
          id?: string
          notes?: string | null
          session_type?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          workout_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      current_day_snapshot: {
        Row: {
          active_roadmaps_count: number | null
          budget_utilization_percentage: number | null
          deep_work_minutes_today: number | null
          habits_completed_today: number | null
          journal_logged_today: boolean | null
          learning_sessions_logged_7d: number | null
          newest_active_habit_title: string | null
          oldest_pending_task_title: string | null
          pending_tasks_count: number | null
          recent_want_expenses_count: number | null
          snapshot_date: string | null
          total_active_habits: number | null
          user_id: string | null
          workout_days_this_week: number | null
        }
        Relationships: []
      }
      current_day_snapshot_history_14d: {
        Row: {
          habits_completed_count: number | null
          journal_logged: boolean | null
          snapshot_date: string | null
          tasks_completed_count: number | null
          total_active_habits: number | null
          user_id: string | null
          workout_logged: boolean | null
        }
        Relationships: []
      }
      data_lab_daily_activity_90d: {
        Row: {
          active_domains: number | null
          active_habits: number | null
          active_system_count: number | null
          activity_date: string | null
          avg_mood: number | null
          deep_work_minutes: number | null
          events_logged: number | null
          finance_entries: number | null
          focus_sessions: number | null
          habit_completion_percent: number | null
          habits_completed: number | null
          journal_entries: number | null
          learning_sessions_logged: number | null
          need_spent: number | null
          tasks_completed: number | null
          tasks_created: number | null
          total_focus_minutes: number | null
          total_spent: number | null
          user_id: string | null
          want_spent: number | null
          workout_minutes: number | null
          workouts_logged: number | null
        }
        Relationships: []
      }
      data_lab_event_coverage_30d: {
        Row: {
          active_days: number | null
          domain: string | null
          event_count: number | null
          event_type: string | null
          first_seen_date: string | null
          last_seen_date: string | null
          user_id: string | null
        }
        Relationships: []
      }
      learning_roadmap_progress: {
        Row: {
          completed_sessions: number | null
          pct_complete: number | null
          roadmap_id: string | null
          total_sessions: number | null
        }
        Relationships: []
      }
      learning_stage_progress: {
        Row: {
          completed_sessions: number | null
          pct_complete: number | null
          roadmap_id: string | null
          stage_id: string | null
          total_sessions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_stages_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmap_progress"
            referencedColumns: ["roadmap_id"]
          },
          {
            foreignKeyName: "learning_stages_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmaps"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
