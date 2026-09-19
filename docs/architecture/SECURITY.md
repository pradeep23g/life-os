---
title: "Security & Access Control Architecture"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "security"
---

# LIFE OS — SECURITY & ACCESS CONTROL ARCHITECTURE

**Status:** Authoritative Security & Threat Mitigation Specification  
**Target Repository:** `pradeep23g/life-os`  
**Classification:** Tier 2 System Security Contract  

---

## 1. Threat Model & Security Philosophy

Life OS is a single-tenant personal intelligence operating system deployed on a shared cloud database infrastructure (Supabase PostgreSQL). Because it stores deeply personal, multi-year longitudinal human telemetry — including mental reflections, daily habits, financial ledger transactions, physical performance, and personal life vows — data isolation and confidentiality are zero-compromise invariants.

### Foundational Security Invariants
1. **Cryptographic Tenant Isolation:** No user may read, modify, or infer the existence of another user's records.
2. **Database-Enforced Authorization:** Security boundaries are enforced inside the PostgreSQL kernel via Row Level Security (RLS), not solely in application code.
3. **Zero Service Role Exposure:** The frontend client bundle contains only public anon keys; service role keys never cross into client memory.
4. **Security Invoker Views:** All SQL views execute with the permissions of the calling user (`security_invoker = true`), inheriting RLS filters.

---

## 2. Row Level Security (RLS) Matrix

Every base table in PostgreSQL has RLS enabled (`ALTER TABLE <table> ENABLE ROW LEVEL SECURITY`). Policies enforce strict ownership checks using `auth.uid() = user_id`.

### 2.1 Table Authorization Policies

| Table | Operations Covered | Policy Definition | Notes |
|---|---|---|---|
| `habits` | ALL | `auth.uid() = user_id` | Full tenant isolation |
| `habit_logs` | ALL | `auth.uid() = user_id` | Compound unique `(habit_id, log_date)` |
| `habit_streak_breaks` | ALL | `auth.uid() = user_id` | Break audit ledger |
| `habit_streak_heals` | ALL | `auth.uid() = user_id` | Monthly quota enforced at app level (5/mo) |
| `journal_entries` | ALL | `auth.uid() = user_id` | Sensitive mental reflection data |
| `tasks` | ALL | `auth.uid() = user_id` | Execution backlog |
| `goals` | ALL | `auth.uid() = user_id` | Domain-constrained goals |
| `weekly_plans` | ALL | `auth.uid() = user_id` | Weekly planning records |
| `weekly_plan_items` | ALL | `auth.uid() = user_id` | Binds to `(user_id, week_start_date)` |
| `weekly_reviews` | ALL | `auth.uid() = user_id` | Sunday reflection briefs |
| `learning_roadmaps` | ALL | `auth.uid() = user_id` | Skill acquisition hierarchy |
| `learning_stages` | ALL | `auth.uid() = user_id` | Sequential curriculum units |
| `learning_sessions` | ALL | `auth.uid() = user_id` | Atomic learning blocks |
| `learning_session_logs`| ALL | `auth.uid() = user_id` | Study timer records |
| `learning_milestones` | ALL | `auth.uid() = user_id` | Curriculum milestone gates |
| `learning_projects` | ALL | `auth.uid() = user_id` | Practical proof projects |
| `learning_reflections` | ALL | `auth.uid() = user_id` | Stage retrospective entries |
| `fitness_exercises` | ALL | `auth.uid() = user_id` | Exercise library |
| `workouts` | ALL | `auth.uid() = user_id` | Partial unique active workout constraint |
| `exercise_logs` | ALL | `auth.uid() = user_id` | Kinetic performance logs |
| `time_logs` | ALL | `auth.uid() = user_id` | Partial unique active timer constraint |
| `transactions` | ALL | `auth.uid() = user_id` | Financial ledger |
| `events` | ALL | `auth.uid() = user_id` | Durable audit log (append-only) |
| `system_event_queue` | ALL | `auth.uid() = user_id` | Transient queue buffer |
| `system_metrics` | ALL | `auth.uid() = user_id` | Daily sync closing totals |
| `life_seasons` | ALL | `auth.uid() = user_id` | Seasonal vows & countdown |
| `user_achievements` | ALL | `auth.uid() = user_id` | Badges & capability crests |
| `pulse_logs` | ALL | `auth.uid() = user_id` | Periodic readiness check-ins |
| `knowledge_resources`| ALL | `auth.uid() = user_id` | Ingested URLs & reading notes |
| `experiments` | ALL | `auth.uid() = user_id` | Lifestyle behavioral experiments |
| `user_settings` | ALL | `auth.uid() = user_id` | Unique per user (`user_id` PK/unique) |
| `progress_hub_archive` | ALL | `auth.uid() = user_id` | Historical migration archive |
| `data_lab_signal_config`| SELECT only | `auth.role() = 'authenticated'` | Global configuration (see Section 3) |

---

## 3. Special Case: `data_lab_signal_config`

`public.data_lab_signal_config` is the sole exception to the `user_id` ownership pattern:

### Structure & Access Pattern
- **Primary Key:** `signal_key` (`text`)
- **No `user_id` Column:** Represents system-wide behavioral signal weighting rules (e.g. `mind_habits`, `execution_tasks`, `fitness_workouts`).
- **RLS Configuration:**
  ```sql
  ALTER TABLE public.data_lab_signal_config ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Signal config is readable by all authenticated users"
    ON public.data_lab_signal_config
    FOR SELECT
    TO authenticated
    USING (true);
  ```
- **Write Protection:** No `INSERT`, `UPDATE`, or `DELETE` policies exist for client roles. Writes are permitted only via migration scripts running under the PostgreSQL superuser or service role.

---

## 4. Service Role Usage Boundaries

Supabase provides two distinct API keys:
1. **Public Anon Key (`VITE_SUPABASE_ANON_KEY`):**
   - Safe for browser client bundles.
   - Always operates under PostgreSQL RLS constraints.
   - Identifies requests as `anon` (unauthenticated) or `authenticated` (when JWT session token is attached).
2. **Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`):**
   - **Bypasses all RLS policies completely.**
   - **STRICT PROHIBITION:** Must NEVER be referenced in `src/`, Vite configuration, client `.env` files, or frontend code.
   - **Permitted Scope:** Local development migration runners, CI/CD automated test seeders, and private offline administrative maintenance scripts.

---

## 5. Admin Console Authorization Model

The Admin Console (`/admin`):
- Operates inside the authenticated client application behind `<ProtectedRoute>`.
- Uses the standard client Supabase instance (`src/lib/supabase.ts`), meaning all queries run as the currently logged-in user under RLS.
- Does **not** possess superuser powers to view or modify records belonging to other users.
- Provides self-administrative capabilities: inspecting personal database health, viewing personal telemetry volumes (`events`, `time_logs`), managing local aesthetic preferences, and exporting personal encrypted JSON data archives.

---

## 6. JSONB Input Validation & Sanitization

Several core tables store structured JSON payloads in `jsonb` columns:
- `life_seasons.vows` (array of vow objects)
- `user_achievements.metadata` (badge criteria, unlock context)
- `pulse_logs.metadata` (scores, sentiment tags)
- `knowledge_resources.metadata` (tags, source summary)
- `experiments.metadata` (hypotheses, outcome metrics)
- `user_settings.finance_preferences` (budget limits, currency preferences)

### Validation Safeguards
1. **Client-Side Schema Validation:** Prior to database submission, JSON inputs (such as AI curriculum imports in ADR-028) must be validated against defined schemas.
2. **Prototype Pollution Protection:** JSON parsers and object mergers must reject keys matching `__proto__`, `constructor`, or `prototype`.
3. **Type & Length Bounds:** Numeric scores must be validated with `Number.isFinite()`; strings within JSONB arrays must enforce reasonable character bounds (e.g. vow text $\le 500$ chars) to prevent storage bloat.

---

## 7. Authentication Flow & Session Management

```text
Browser Client                           Supabase Auth Service
     │                                            │
     │── 1. signInWithPassword(email, pass) ─────→│
     │                                            │ (Validates credentials)
     │←── 2. JWT Access Token + Refresh Token ────│
     │                                            │
(Stored in localStorage securely)                 │
     │                                            │
     │── 3. Client API Request with Bearer JWT ──→│
     │      (PostgreSQL decodes auth.uid())       │
     │                                            │
     │── 4. signOut() ───────────────────────────→│
     │      (Token invalidated, state reset)      │
```

### Session Lifecycle Rules
- **State Synchronization:** `AuthProvider` (`src/lib/AuthContext.tsx`) subscribes to `supabase.auth.onAuthStateChange` to synchronize auth tokens and user presence across tabs.
- **Protected Route Interception:** `<ProtectedRoute>` (`src/App.tsx`) monitors session validity. If unauthenticated, all private application routes redirect immediately to `/auth`.
- **Cryptographic Sign-Out:** The Astrolabe Orb navigation HUD and Profile page provide one-click session termination, clearing memory tokens and localStorage state before redirecting.
