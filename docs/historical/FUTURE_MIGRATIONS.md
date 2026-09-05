# Future Migrations (Queued / Historical Planning)

**Status:** Prepared Reference  
**Last Updated:** September 2026 (Phase 1 Baseline)

---

## Legacy Journal Columns Cleanup

**Status:** Prepared — do not execute yet  
**Execution Target:** After 2 stable releases confirming no client or analytics queries read legacy columns.

The journal schema was updated to structured reflection fields (`what_went_good`, `what_you_learned`, `brief_about_day`). The legacy columns below are candidates for eventual drop:

```sql
alter table public.journal_entries
  drop column if exists went_well,
  drop column if exists went_wrong,
  drop column if exists lesson_learned;
```

**Verification Checklist Before Execution:**
1. Confirm zero codebase queries access `went_well`, `went_wrong`, `lesson_learned`.
2. Confirm zero SQL views in `supabase/migrations/` reference these columns.
