# LIFE OS — SYSTEM ARCHITECTURE

This document describes the complete architecture of Life OS and how all system layers interact.

It exists to guide human developers and AI agents (Codex, GPT, Gemini) when implementing or modifying the system.

---

# 1. ARCHITECTURE OVERVIEW

Life OS follows a modern full-stack architecture designed for:

• modular frontend systems with nested domains
• scalable relational data storage  
• real-time analytics  
• long-term behavioral tracking  
• strict cognitive boundaries

System Layers:

User Interface (Nested Routing)
↓  
React Application (Vite)
↓  
React Query Data Layer (Domain Isolated)
↓  
Supabase Client  
↓  
Supabase API  
↓  
PostgreSQL Database  
↓  
Events Analytics Pipeline  

---

# 2. SYSTEM FLOW

The core request lifecycle maps user actions to the permanent analytics pipeline.

User Action
↓
React Component (inside a specific OS module)
↓
React Query Hook (Domain Specific)
↓
Supabase Client
↓
PostgreSQL Query & Mutation
↓
PostgreSQL Trigger
↓
Events Table Update
↓
Analytics Layer

Example:

User completes habit in Mind OS Workspace →  
React sends insert →  
Supabase writes to `habit_logs` →  
Postgres trigger fires →  
Event logged to `events` table.

---

# 3. FRONTEND ARCHITECTURE (NESTED DOMAINS)

Life OS uses a **Strict Domain-Driven Feature Architecture**. 
To protect cognitive boundaries, features are not thrown into a flat list. They are nested inside their respective OS Modules.

Directory Structure:

src/
├── app/                  # Global providers, router setup
├── assets/               # Global static assets
├── components/           # Generic UI (Buttons, Standard Cards, Inputs)
├── config/               # Environment variables, constants
├── lib/                  # Supabase client, utility libraries
│
├── features/             # DOMAIN ISOLATED MODULES
│   ├── mission-control/  # Master Dashboard (Aggregator)
│   │   ├── components/   # Summary widgets ONLY
│   │   └── api/          # Aggregation queries across tables
│   │
│   ├── mind-os/          # Cognitive & Reflection Pillar
│   │   ├── dashboard/    # Mind OS landing page
│   │   ├── habits/       # Habit tracking components
│   │   ├── journal/      # Journal components
│   │   └── api/          # Mind OS specific React Query hooks
│   │
│   ├── productivity-hub/ # Execution Pillar
│   │   ├── dashboard/    # Productivity landing page
│   │   ├── tasks/        # Kanban components
│   │   ├── planning/     # Planning engine
│   │   └── api/          # Tasks/Planning specific hooks
│   │
│   ├── fitness-os/       # Physical Pillar
│   └── finance-os/       # Financial Pillar
│
├── pages/                # Page components that map to routes (e.g., /mind-os/journal)
├── layout/               # Global Sidebar, Top Navigation mapping
└── utils/                # Helper functions

Principles:

• features own their business logic and domain-specific UI  
• generic UI elements (like a styled Card) go in `/components`
• master dashboard NEVER directly imports from a domain's internal components; domains must export specific summary widgets for Mission Control.

---

# 4. FRONTEND DATA FLOW

All data fetching must use **React Query**.

Pattern:

React Component
↓
React Query Hook
↓
Supabase Client
↓
Database Query
↓
Return JSON Data
↓
React State Update

Example for fetching active tasks inside Productivity Hub:

useQuery({
  queryKey: ["tasks", "active"],
  queryFn: fetchActiveTasks
})

React Query handles:

• caching  
• background updates  
• stale state  
• loading states (eliminating the need for custom loading spinners)

---

# 5. BACKEND ARCHITECTURE

Backend is handled by **Supabase**.

Supabase provides:

• PostgreSQL database  
• authentication  
• REST + realtime API  
• storage  

Life OS primarily uses PostgreSQL + REST API, heavily relying on SQL triggers for the analytics pipeline.

---

# 6. DATABASE DESIGN PRINCIPLES

Life OS uses a **relational model centered around users**. Data is grouped logically to support the nested frontend architecture.

profiles
│
├── (Mind OS Domain)
│   ├── habits
│   │   └── habit_logs
│   └── journal_entries
│
├── (Productivity Hub Domain)
│   ├── tasks
│   └── projects (future)
│
├── (Fitness OS Domain)
│   ├── workouts
│   └── exercise_logs
│
└── events (Universal Pipeline)

Key ideas:

• user-owned data via row-level security (RLS)
• append-only analytics pipeline  
• soft deletes (`deleted_at` timestamp) instead of hard deletes  

---

# 7. UNIVERSAL EVENT PIPELINE

The `events` table powers Life OS analytics.

Whenever a major action occurs (cross-domain):

habit completed (Mind OS)
task completed (Productivity Hub)
journal entry added (Mind OS)

A trigger writes a record into `events`.

Example event:

{
  "event_type": "habit_completed",
  "timestamp": "2026-03-08T10:20:00",
  "metadata": {
    "habit_id": "abc123",
    "value": 5
  }
}

Benefits:

• cross-domain behavior analytics  
• long-term heatmaps  
• future AI insights  

---

# 8. MIND OS ARCHITECTURE (Habits & Journaling)

Mind OS is built for reflection.

Habits follow a **definition + ledger model**.
habits table defines the rule.
habit_logs table tracks the daily execution.

Journal entries are structured reflections.
Fields: mood, went_well, went_wrong, lesson_learned.

---

# 9. PRODUCTIVITY HUB ARCHITECTURE (Tasks)

Productivity Hub is built for execution.

Tasks follow a **kanban workflow**.
States: To Do, Doing, Done.

Tasks table stores: title, priority, status, created_at, updated_at, deadline.
Moving a task updates the `status` and triggers an event.

**Cognitive Boundary Rule:** Data from this table must NOT be queried inside the Mind OS dashboard.

---

# 10. MISSION CONTROL DASHBOARD ARCHITECTURE

Mission Control acts as the central router and data aggregator.

It does NOT load full datasets.
Instead, it performs highly optimized summary queries or calls upon summary widgets exported by the individual OS modules.

Example metrics:

Active Habits (Mind OS Query)
Pending Tasks (Productivity Hub Query)
Journal Entries (Mind OS Query)
Average Mood (Mind OS Query)

This ensures the master dashboard remains lightning fast even after years of data accumulation.

---

# 11. PERFORMANCE STRATEGY

Life OS is optimized for long-term data growth.

Strategies:

• B-Tree indexes on commonly queried columns (e.g., `user_id`, `created_at`)
• partial indexes for active records (e.g., `WHERE deleted_at IS NULL`)
• append-only analytics pipeline  
• React Query caching with precise cache invalidation

---

# 12. SECURITY MODEL

Production security uses **Row Level Security (RLS)** in PostgreSQL.

Policy pattern:

auth.uid() = user_id

This ensures:

• complete user data isolation  
• secure multi-user deployment capability  

---

# 13. AI AGENT WORKFLOW & RESPONSIBILITIES

AI agents working on Life OS must follow this strict process.

**Planning Phase:**
Agent explains intended changes, verifying which Nested Domain the feature belongs to.

**Implementation Phase:**
Agent modifies code, strictly placing files in the correct `src/features/[domain]/` folder.

**Verification Phase:**
Agent confirms:

• compilation success  
• runtime behavior  
• no architectural violations (e.g., no cross-domain contamination)

---

# 14. FINAL ARCHITECTURE SUMMARY

Life OS is built as a highly structured, domain-isolated system:

React UI (Nested Workspaces)
↓
React Query (Domain Specific Hooks)
↓
Supabase Client
↓
Supabase API
↓
PostgreSQL
↓
Events Analytics Pipeline

This architecture enforces cognitive clarity in the UI and absolute data integrity in the backend, allowing Life OS to scale into a permanent behavioral intelligence platform.