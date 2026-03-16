# LIFE OS — DEVELOPMENT WORKFLOW

This document defines the official development workflow for Life OS.

It exists to ensure that human developers and AI agents (Codex, GPT, Gemini) make changes safely without breaking existing systems.

This workflow is especially important for protecting the **Supabase database architecture** and maintaining the **nested cognitive boundaries** of the frontend.

---

# DEVELOPMENT PRINCIPLES

All development must follow these rules:

1. Never break existing features.
2. Avoid rewriting working systems.
3. Always follow the nested, domain-driven architecture defined in:
   SYSTEM_ARCHITECTURE.md
4. Always follow UI constraints and cognitive boundaries defined in:
   UI_SYSTEM.md
5. When uncertain, prefer the simplest implementation.

---

# DATABASE SAFETY RULES (CRITICAL)

The Supabase database is the **core infrastructure** of Life OS.

Agents must follow strict rules when interacting with it.

---

## RULE 1 — NEVER MODIFY EXISTING TABLE STRUCTURE WITHOUT APPROVAL

Tables such as:

profiles  
tasks  
habits  
habit_logs  
journal_entries  
events  

must NOT be altered without clear reasoning.

Avoid:

• dropping columns  
• renaming columns  
• altering constraints  

These changes can break the entire application.

---

## RULE 2 — ALL DATABASE CHANGES MUST USE MIGRATIONS

Database modifications must be written as SQL migrations.

Example:

```sql
ALTER TABLE tasks
ADD COLUMN deadline TIMESTAMP;
Never modify the database manually without documenting the change.

RULE 3 — SUPABASE CONSOLE SQL MUST BE SAFE
When writing SQL for the Supabase console:

Always verify:

• correct table name
• correct column name
• valid constraints

Example safe query:

SQL
SELECT *
FROM tasks
WHERE deleted_at IS NULL;
Avoid dangerous queries like:

SQL
DELETE FROM tasks;
This can wipe the entire table.

SUPABASE QUERY PATTERNS & DOMAIN CACHE KEYS
Frontend queries must follow standardized patterns.
CRITICAL: React Query cache keys MUST be prefixed with their specific OS Module Domain to prevent data cross-contamination.

PRODUCTIVITY HUB DOMAIN (Execution)
TASKS QUERY (READ)

JavaScript
supabase
  .from("tasks")
  .select("*")
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
Cache key: ["productivity-hub", "tasks"]

TASKS MUTATION (WRITE - TRIGGERS EVENT)

JavaScript
supabase
  .from("tasks")
  .insert({ title, priority, status: "To Do", user_id })
MIND OS DOMAIN (Reflection)
HABITS QUERY (READ)

JavaScript
supabase
  .from("habits")
  .select("*")
  .is("deleted_at", null)
Cache key: ["mind-os", "habits"]

HABIT LOGS MUTATION (WRITE - TRIGGERS EVENT)

JavaScript
supabase
  .from("habit_logs")
  .insert({
    habit_id,
    user_id,
    value
  })
JOURNAL ENTRIES QUERY (READ)

JavaScript
supabase
  .from("journal_entries")
  .select("*")
  .is("deleted_at", null)
  .order("created_at", { ascending: false })
Cache key: ["mind-os", "journals"]

JOURNAL ENTRIES MUTATION (WRITE - TRIGGERS EVENT)

JavaScript
supabase
  .from("journal_entries")
  .insert({ mood, went_well, went_wrong, lesson_learned, user_id })
FRONTEND DEVELOPMENT RULES
Frontend must follow these standards:

Framework: React + Vite
Routing: React Router (Nested Routes)
Styling: TailwindCSS + CSS Grid
State Management: React Query (Domain-Prefixed)

Avoid:
• heavy UI libraries
• large dependency packages
• flat routing structures

COMPONENT & ROUTING DEVELOPMENT RULES (NESTED DOMAINS)
Components MUST remain strictly inside their respective OS Modules. Flat folder structures are banned.

Recommended structure:

Plaintext
features/
  mind-os/
    api/              # hooks: useHabits.ts, useJournal.ts
    components/       # UI: MoodSelector.tsx
    habits/           # Feature: HabitTracker.tsx
    journal/          # Feature: JournalEditor.tsx
    MindOsDashboard.tsx

  productivity-hub/
    api/              # hooks: useTasks.ts
    components/       # UI: KanbanColumn.tsx
    tasks/            # Feature: TasksKanban.tsx
    ProductivityDashboard.tsx
Pages should strictly map to React Router nested routes.

Example Router Structure:

JavaScript
<Route path="/" element={<MissionControl />} />
<Route path="/mind-os" element={<MindOsLayout />}>
  <Route index element={<MindOsDashboard />} />
  <Route path="journal" element={<JournalPage />} />
  <Route path="habits" element={<HabitsPage />} />
</Route>
<Route path="/productivity-hub" element={<ProductivityLayout />}>
  <Route index element={<ProductivityDashboard />} />
  <Route path="tasks" element={<TasksPage />} />
</Route>
REACT QUERY CACHE RULE
After creating or updating data, always refresh the cache using the specific domain key.

Example for updating a task:

JavaScript
queryClient.invalidateQueries({
  queryKey: ["productivity-hub", "tasks"]
});
This ensures the UI stays synchronized with the database while preventing the Mind OS components from unnecessarily re-rendering.

ERROR HANDLING
Supabase operations must always check for errors.

Example:

JavaScript
const { data, error } = await supabase
  .from("tasks")
  .select("*");

if (error) {
  console.error(error);
}
Never ignore database errors.

TESTING RULES
Before committing changes, verify:

Feature renders correctly within its nested layout.

Cognitive boundaries are intact (e.g., no tasks showing in the Journal).

Database writes succeed.

Domain-specific queries return correct data.

No console errors appear.

Use the browser console to verify behavior.

RESPONSIVE DESIGN TESTING
Agents must test both:

Desktop view (Grid layouts, sidebar visible)
Mobile view (Stacked layouts, collapsed sidebar)

Use browser developer tools to simulate mobile screens.

PERFORMANCE RULES
The application must remain lightweight.

Avoid:

• large state trees (Use React Query instead)
• unnecessary re-renders across domains
• heavy animations

Prefer:

• simple components
• efficient database queries
• precise React Query caching

LOCAL COMMAND CHECKLIST
Use npm commands from the repo root (`life-os/`).

- `npm install` for initial setup or dependency sync
- `npm ci` for clean, lockfile-based installs (recommended for reproducible environments)
- `npm run dev` for local feature development
- `npm run lint` before commits to catch lint issues
- `npm run build` before commits to validate type-check + production build
- `npm run preview` when you need to verify the production build output

Quick verification command:
- `npm run lint && npm run build`

GIT WORKFLOW
Every change should follow this process:

Implement feature inside correct nested domain folder
Test locally
Verify database queries
Commit changes

Example commit message:

feat(productivity-hub): add tasks kanban system nested route

Avoid vague commits like:

update stuff

AI AGENT RESPONSIBILITY
AI agents must not attempt large architectural rewrites.

Instead:

• improve existing components within their specific OS domains
• add modular features respecting the nested structure
• follow documented architecture

Agents should always consult:

PRADEEP_PROFILE.md
LIFE_RULES.md
AGENTS.md
SYSTEM_ARCHITECTURE.md
PROJECT_ROADMAP.md
UI_SYSTEM.md
DEV_WORKFLOW.md

before implementing changes.

FINAL RULE
Life OS is a long-term system.

Every change must prioritize:

stability
simplicity
scalability
cognitive protection

Never sacrifice stability for speed.

CODEX AUTONOMOUS DEVELOPMENT MODE
Life OS is designed to allow AI agents to implement features with minimal supervision.

Codex is responsible for:

• frontend component development
• backend query integration
• database migration scripts
• UI improvements
• bug fixes
• testing workflows

However, Codex must follow strict guardrails.

SAFE OPERATIONS (NO APPROVAL REQUIRED)
Codex may freely perform the following actions:

• read files
• modify React components within established domains
• update Tailwind styling and CSS Grids
• write React Query domain-specific queries
• implement nested UI layouts
• refactor small components
• create new feature modules within the correct features/ folder

Examples:

Create new components
Improve responsive design
Add React Query caching

OPERATIONS REQUIRING APPROVAL
Codex must ask before performing these actions:

• modifying database schema
• deleting tables
• installing heavy dependencies
• changing authentication logic
• altering Supabase policies
• modifying environment variables
• restructuring the top-level nested architecture

Example restricted operations:

ALTER TABLE
DROP TABLE
DELETE FROM events
npm install large UI libraries

DATABASE CHANGE PROTOCOL
If a schema change is required:

Generate SQL migration

Present SQL to user

Wait for approval

Execute migration in Supabase console

Codex must NEVER auto-execute destructive queries.

FEATURE DEVELOPMENT FLOW
When implementing a feature Codex should follow this order:

Read SYSTEM_ARCHITECTURE.md

Check PROJECT_ROADMAP.md

Implement backend query

Build UI component in the correct nested directory

Connect React Query with domain-specific cache keys

Map the React Router path

Test locally

Refactor if needed

BUG FIX PROCESS
When a bug appears:

Identify source file and domain

Verify Supabase query

Verify React Query cache (ensure right domain key is invalidated)

Verify UI rendering

Apply minimal fix

Never rewrite entire systems to fix a small bug.

PERFORMANCE REQUIREMENTS
Codex must optimize for:

• small bundle size
• minimal dependencies
• efficient queries
• responsive UI


