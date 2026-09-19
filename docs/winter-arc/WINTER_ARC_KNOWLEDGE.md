---
title: "Winter Arc — Knowledge Architecture & Graph"
status: "active"
last_synchronized_commit: "77d1a5b"
domain: "winter-arc"
---

# Winter Arc: Knowledge Vault & Learning OS

This document covers the Knowledge Vault (Books, Videos, Media Tracking) and Learning OS Completion (Features F-20 through F-23, Wave 4).

## KNOWLEDGE VAULT

### Resource Types
- Books
- Videos
- Speeches
- Podcasts
- Articles
- Other educational resources

### Book Progress Support
- Title, Author, Category
- URL (optional)
- Start date
- Page progress (current page / total pages)
- Percentage progress (computed or manual)
- Completion date
- Notes (text, freeform)
- Rating (1-5)
- Category tags
- Last activity date
- Status: `not_started`, `reading`, `completed`, `abandoned`

### Media Progress Support (Videos/Speeches/Podcasts)
- Title
- URL (source link)
- Duration (total)
- Progress (time watched/listened)
- Completion status
- Notes
- Key takeaways (structured list)
- Category tags

### Categories
- Mind, Discipline, Programming, Career, Fitness, Leadership, Psychology, Personal Growth, Other

### Action-Oriented Hook
- Post-completion reflection prompt: "What changed because of this?"
- Prevents passive content hoarding
- Links knowledge consumption to actual behavioral change
- Optional: Link to journal entry or learning reflection

### Data Model Recommendation
- Single table: `knowledge_resources`
- Covers all media types with nullable type-specific fields
- Fields: `id`, `user_id`, `type` (book/video/speech/podcast/article/other), `title`, `author`, `url`, `category`, `status`, `rating`, `notes`, `takeaways` (text[]), `progress_percent`, `page_current`, `page_total`, `duration_total_minutes`, `duration_progress_minutes`, `started_at`, `completed_at`, `last_activity_at`, `created_at`, `updated_at`, `deleted_at`
- RLS: `auth.uid() = user_id` (standard pattern)
- Consider: connection to `learning_roadmaps` via optional `roadmap_id` FK

### UI Components Needed
- Resource list/grid view with filters (type, status, category)
- Resource detail view
- Progress update form
- Quick-add form
- Book reading log
- Completion reflection modal
- Category management

---

## LEARNING OS COMPLETION

### Current State (Schema-Only Features)
These tables [SCHEMA EXISTS] in the database but have [UI MISSING] for creation forms:

1. **learning_milestones** (schema at migration 26):
   - `id`, `user_id`, `roadmap_id`, `stage_id` (optional), `title`, `achieved` (boolean), `achieved_at`, `created_at`, `updated_at`, `deleted_at`
   - Read query exists: `useRoadmapMilestones`
   - **NEEDS:** Create/edit modal, achieve/unachieve toggle, milestone list in roadmap detail view

2. **learning_projects** (schema at migration 26):
   - `id`, `user_id`, `roadmap_id`, `stage_id` (optional), `title`, `description`, `status` (`not_started`/`in_progress`/`done`), `repo_url`, `completed_at`, `created_at`, `updated_at`, `deleted_at`
   - Read query exists: `useRoadmapProjects`
   - **NEEDS:** Create/edit modal, status toggle, project list in roadmap detail view, repo URL link

3. **learning_reflections** (schema at migration 26):
   - `id`, `user_id`, `roadmap_id`, `stage_id` (optional), `session_id` (optional), `content` (text), `reflection_type` (`general`/`weekly_milestone`/`teach_back_test`), `created_at`, `updated_at`, `deleted_at`
   - Read query exists: `useReflections`
   - **NEEDS:** Reflection creation modal, reflection type selector, reflection list/timeline view

### Learning-Knowledge Integration
- Knowledge Vault resources can link to learning roadmaps
- Book reading sessions can log to `learning_session_logs`
- Completing a book/video can trigger achievement events

### UI Work Required
- Milestone CRUD modal within RoadmapDetailView
- Project CRUD modal within RoadmapDetailView
- Reflection creation modal (contextual to roadmap/stage/session)
- Reflection timeline/list view
- Knowledge Vault main page and resource management
- Learning progression dashboard (achievement view)

### Events Already Defined (no new events needed)
- `learning.milestone.created`, `learning.milestone.achieved`
- `learning.project.status_changed`
- `learning.reflection.created`

### Verification
- [ ] Can create, edit, delete milestones via UI
- [ ] Can create, edit, delete projects via UI
- [ ] Can create reflections with type selection
- [ ] Can view reflection history
- [ ] Knowledge resources CRUD works
- [ ] Progress tracking updates correctly
- [ ] Events emit correctly for all mutations

---
**Cross-References:**
- [Master Plan](./WINTER_ARC_MASTER_PLAN.md)
- [Data Model](./WINTER_ARC_DATA_MODEL.md)
- [Telemetry](./WINTER_ARC_TELEMETRY.md)
- [Database Schema](../architecture/DATABASE_SCHEMA.md)
- [Module Guide](../architecture/MODULE_GUIDE.md)
