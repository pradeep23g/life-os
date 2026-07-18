# Future Migrations (Queued)

This file tracks SQL migrations that have been prepared but are not yet ready to execute. Do not run these without explicit confirmation.

---

## Legacy Journal Columns Cleanup

**Status:** Prepared — do not execute yet  
**Execution target:** After 2 stable releases confirming no app code reads legacy columns.

The journal schema was extended with structured fields. The legacy columns below are candidates for removal once all code has been confirmed to use only the new fields.

```sql
alter table public.journal_entries
  drop column if exists went_well,
  drop column if exists went_wrong,
  drop column if exists lesson_learned;
```

**Verification before running:**
1. Search codebase for any reference to `went_well`, `went_wrong`, `lesson_learned` in Supabase queries.
2. Confirm Data Lab SQL views do not reference these columns.
3. Confirm Brain Engine snapshot views do not reference these columns.
4. Run after 2 releases of confirmed stability.
