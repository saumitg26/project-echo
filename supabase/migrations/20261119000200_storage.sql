-- Private bucket for family media. Object path: families/{family_id}/memories/{memory_id}/{unique_filename}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('memory-media', 'memory-media', false, 52428800, array[
  'image/jpeg','image/png','image/webp','image/gif',
  'audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg',
  'video/mp4','video/webm','video/quicktime','application/pdf'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Returns the family uuid from a well-formed object path, else NULL (never raises on bad paths).
create function public.storage_path_family_id(object_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case when object_name ~
    '^families/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/memories/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
    then substring(object_name from '^families/([0-9a-f-]{36})/')::uuid end;
$$;
grant execute on function public.storage_path_family_id(text) to authenticated;

-- No UPDATE policy on purpose: files are immutable (no overwrite). No anon policies: nothing public.
create policy "memory-media read: family members" on storage.objects for select to authenticated
  using (bucket_id = 'memory-media' and public.is_family_member(public.storage_path_family_id(name)));

create policy "memory-media upload: owners/editors" on storage.objects for insert to authenticated
  with check (bucket_id = 'memory-media'
    and public.has_family_role(public.storage_path_family_id(name), array['owner','editor']));

create policy "memory-media delete: owners/editors" on storage.objects for delete to authenticated
  using (bucket_id = 'memory-media'
    and public.has_family_role(public.storage_path_family_id(name), array['owner','editor']));
