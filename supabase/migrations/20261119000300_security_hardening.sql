-- PROJECT ECHO: close storage-folder and time-capsule authorization gaps.

-- Returns the memory uuid from a well-formed object path, else NULL.
create function public.storage_path_memory_id(object_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case when object_name ~
    '^families/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/memories/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
    then substring(object_name from '/memories/([0-9a-f-]{36})/')::uuid end;
$$;
revoke all on function public.storage_path_memory_id(text) from public, anon;
grant execute on function public.storage_path_memory_id(text) to authenticated;

-- A member cannot upload into an invented memory folder. The referenced memory must exist in the
-- same family encoded by the path, and only owners/editors may write it.
drop policy "memory-media upload: owners/editors" on storage.objects;
create policy "memory-media upload: owners/editors" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'memory-media'
    and public.has_family_role(public.storage_path_family_id(name), array['owner','editor'])
    and exists (
      select 1 from public.memories m
      where m.id = public.storage_path_memory_id(name)
        and m.family_id = public.storage_path_family_id(name)
    )
  );

-- Locked capsules remain visible to their creator, but not to other family members until the date.
drop policy time_capsules_select_member on public.time_capsules;
create policy time_capsules_select_member on public.time_capsules for select to authenticated
  using (
    public.is_family_member(family_id)
    and (unlock_date is null or unlock_date <= current_date or creator_id = (select auth.uid()))
  );

drop policy time_capsules_select_demo on public.time_capsules;
create policy time_capsules_select_demo on public.time_capsules for select to anon, authenticated
  using (
    (unlock_date is null or unlock_date <= current_date)
    and exists (select 1 from public.families f where f.id = time_capsules.family_id and f.is_demo)
  );
