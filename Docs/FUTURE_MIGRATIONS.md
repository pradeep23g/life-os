# Future Migrations (Queued)

## Legacy Journal Columns Cleanup

Status: **Prepared, do not execute yet**  
Execution target: after **2 stable releases** with new journal fields.

```sql
alter table public.journal_entries
  drop column if exists went_well,
  drop column if exists went_wrong,
  drop column if exists lesson_learned;
```

Run only after confirming no active app code reads legacy columns.
