do $$
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'fitness_exercises'
  ) then
    raise exception 'public.fitness_exercises does not exist';
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'fitness_exercises'
      and column_name = 'primary_muscle'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'fitness_exercises'
      and column_name = 'target_muscles'
  ) then
    alter table public.fitness_exercises rename column primary_muscle to target_muscles;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'fitness_exercises'
      and column_name = 'target_muscles'
  ) then
    alter table public.fitness_exercises add column target_muscles text[];
  end if;
end $$;

do $$
declare
  equipment_udt text;
begin
  select c.udt_name
  into equipment_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'fitness_exercises'
    and c.column_name = 'equipment';

  if equipment_udt is null then
    alter table public.fitness_exercises add column equipment text[];
  elsif equipment_udt <> '_text' then
    alter table public.fitness_exercises
      alter column equipment type text[]
      using (
        case
          when equipment is null then null
          when btrim(equipment) = '' then '{}'::text[]
          else array_remove(
            array(
              select nullif(btrim(part), '')
              from unnest(string_to_array(equipment, ',')) as part
            ),
            null
          )
        end
      );
  end if;
end $$;

do $$
declare
  target_udt text;
begin
  select c.udt_name
  into target_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'fitness_exercises'
    and c.column_name = 'target_muscles';

  if target_udt is null then
    alter table public.fitness_exercises add column target_muscles text[];
  elsif target_udt <> '_text' then
    alter table public.fitness_exercises
      alter column target_muscles type text[]
      using (
        case
          when target_muscles is null then null
          when btrim(target_muscles) = '' then '{}'::text[]
          else array_remove(
            array(
              select nullif(btrim(part), '')
              from unnest(string_to_array(target_muscles, ',')) as part
            ),
            null
          )
        end
      );
  end if;
end $$;

alter table public.fitness_exercises
  alter column category type text;
