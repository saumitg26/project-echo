-- PROJECT ECHO RLS + storage-policy verification. Runs in ONE transaction and ROLLS BACK (leaves no data).
-- Run in the Supabase SQL editor or: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_verification.sql
-- Any failed check raises an exception; every passed check prints NOTICE 'PASS: ...'.
-- NOTE: tests the database/storage POLICIES. It does not exercise the HTTP Storage API; do that manually too.
begin;

-- setup as superuser: two users + one fictional demo family
insert into auth.users (id, email) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'a@test.invalid'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'b@test.invalid');
insert into public.families (id, name, is_demo) values ('de000000-0000-4000-8000-000000000001', 'DEMO', true);
insert into public.ancestors (id, family_id, name) values
  ('de000000-0000-4000-8000-0000000000a1', 'de000000-0000-4000-8000-000000000001', 'Demo Ancestor');

-- ===== User A: creates a family, ancestor, memory, media row, storage object =====
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);
set local role authenticated;

insert into public.families (id, name, created_by)
  values ('fa000000-0000-4000-8000-000000000001', 'Family A', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.ancestors (id, family_id, name, generation)
  values ('ac000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001', 'Ancestor A', 1);
insert into public.memories (id, family_id, ancestor_id, title, uploaded_by) values
  ('ee000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001',
   'ac000000-0000-4000-8000-000000000001', 'Memory A', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into storage.objects (bucket_id, name) values ('memory-media',
  'families/fa000000-0000-4000-8000-000000000001/memories/ee000000-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111.jpg');
insert into public.media_assets (memory_id, family_id, storage_path, mime_type, file_size_bytes, original_filename, uploaded_by)
  values ('ee000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001',
  'families/fa000000-0000-4000-8000-000000000001/memories/ee000000-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111.jpg',
  'image/jpeg', 1234, 'photo.jpg', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

do $$ declare n int; r text; begin
  select role into r from public.family_memberships where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if r is distinct from 'owner' then raise exception 'FAIL: creator not made owner (got %)', r; end if;
  raise notice 'PASS: family creator is auto-owner';
  select count(*) into n from public.families where created_by = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  if n <> 1 then raise exception 'FAIL: A cannot read own family'; end if;
  select count(*) into n from public.ancestors where family_id = 'fa000000-0000-4000-8000-000000000001';
  if n <> 1 then raise exception 'FAIL: A cannot read own ancestors'; end if;
  select count(*) into n from public.memories where ancestor_id = 'ac000000-0000-4000-8000-000000000001';
  if n <> 1 then raise exception 'FAIL: A cannot read own memories'; end if;
  select count(*) into n from public.media_assets where memory_id = 'ee000000-0000-4000-8000-000000000001';
  if n <> 1 then raise exception 'FAIL: A cannot read own media row'; end if;
  select count(*) into n from storage.objects where bucket_id = 'memory-media';
  if n <> 1 then raise exception 'FAIL: A cannot read own storage object'; end if;
  raise notice 'PASS: A can create + read own family, ancestor, memory, media row, storage object';
end $$;

do $$ declare ok boolean := false; begin
  begin update public.families set is_demo = true where id = 'fa000000-0000-4000-8000-000000000001';
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: user could flip is_demo'; end if;
  raise notice 'PASS: user cannot mark own family as demo';
  ok := false;
  begin insert into storage.objects (bucket_id, name) values ('memory-media', 'families/not-a-uuid/memories/x/y.jpg');
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: malformed storage path accepted'; end if;
  raise notice 'PASS: malformed storage path rejected';
  ok := false;
  begin insert into public.media_assets (memory_id, family_id, storage_path, mime_type, file_size_bytes, original_filename, uploaded_by)
    values ('ee000000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001',
    'families/fa000000-0000-4000-8000-000000000001/memories/ee000000-0000-4000-8000-000000000001/x.exe',
    'application/x-msdownload', 10, 'x.exe', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: disallowed MIME accepted'; end if;
  raise notice 'PASS: disallowed MIME type rejected';
end $$;
reset role;

-- ===== User B (not a member of A's family) =====
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);
set local role authenticated;
do $$ declare n int; ok boolean; begin
  select count(*) into n from public.families where id = 'fa000000-0000-4000-8000-000000000001';
  if n <> 0 then raise exception 'FAIL: B sees A family'; end if;
  select count(*) into n from public.ancestors where family_id = 'fa000000-0000-4000-8000-000000000001';
  if n <> 0 then raise exception 'FAIL: B sees A ancestors'; end if;
  select count(*) into n from public.memories where family_id = 'fa000000-0000-4000-8000-000000000001';
  if n <> 0 then raise exception 'FAIL: B sees A memories'; end if;
  select count(*) into n from public.media_assets where family_id = 'fa000000-0000-4000-8000-000000000001';
  if n <> 0 then raise exception 'FAIL: B sees A media rows'; end if;
  select count(*) into n from storage.objects where bucket_id = 'memory-media';
  if n <> 0 then raise exception 'FAIL: B can read A storage object'; end if;
  raise notice 'PASS: non-member B cannot read any of A''s private rows or media';

  ok := false;
  begin insert into storage.objects (bucket_id, name) values ('memory-media',
    'families/fa000000-0000-4000-8000-000000000001/memories/ee000000-0000-4000-8000-000000000001/22222222-2222-4222-8222-222222222222.jpg');
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: B uploaded into A family folder'; end if;
  raise notice 'PASS: non-member cannot upload into another family''s folder';

  ok := false;
  begin insert into public.memories (family_id, ancestor_id, title, uploaded_by) values
    ('fa000000-0000-4000-8000-000000000001', 'ac000000-0000-4000-8000-000000000001', 'hack', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: B inserted memory into A family'; end if;
  raise notice 'PASS: non-member cannot write memories into another family';

  ok := false;
  begin insert into public.family_memberships (family_id, user_id, role) values
    ('fa000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'owner');
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: B self-joined A family as owner'; end if;
  raise notice 'PASS: user cannot add themselves to another family';
end $$;
reset role;

-- ===== A invites B as viewer; B can read but not write =====
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}', true);
set local role authenticated;
insert into public.family_memberships (family_id, user_id, role) values
  ('fa000000-0000-4000-8000-000000000001', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'viewer');
reset role;

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}', true);
set local role authenticated;
do $$ declare n int; ok boolean := false; begin
  select count(*) into n from public.memories where family_id = 'fa000000-0000-4000-8000-000000000001';
  if n <> 1 then raise exception 'FAIL: viewer cannot read memories'; end if;
  select count(*) into n from storage.objects where bucket_id = 'memory-media';
  if n <> 1 then raise exception 'FAIL: viewer cannot read media'; end if;
  raise notice 'PASS: viewer can read family memories and media';
  begin insert into public.memories (family_id, ancestor_id, title, uploaded_by) values
    ('fa000000-0000-4000-8000-000000000001', 'ac000000-0000-4000-8000-000000000001', 'x', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: viewer wrote a memory'; end if;
  raise notice 'PASS: viewer cannot write memories';
  ok := false;
  begin insert into storage.objects (bucket_id, name) values ('memory-media',
    'families/fa000000-0000-4000-8000-000000000001/memories/ee000000-0000-4000-8000-000000000001/33333333-3333-4333-8333-333333333333.jpg');
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: viewer uploaded a file'; end if;
  raise notice 'PASS: viewer cannot upload files';
  update public.family_memberships set role = 'owner' where user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: viewer escalated own role'; end if;
  raise notice 'PASS: viewer cannot escalate own role';
end $$;
reset role;

-- ===== anon: no private data, demo only =====
set local role anon;
do $$ declare n int; ok boolean := false; begin
  select count(*) into n from public.families where is_demo = false;
  if n <> 0 then raise exception 'FAIL: anon sees private families'; end if;
  select count(*) into n from public.memories;
  if n <> 0 then raise exception 'FAIL: anon sees private memories'; end if;
  select count(*) into n from public.ancestors;
  if n <> 1 then raise exception 'FAIL: anon should see only the 1 demo ancestor (got %)', n; end if;
  raise notice 'PASS: anon sees only fictional demo data';
  begin insert into public.families (name, is_demo) values ('x', true);
  exception when others then ok := true; end;
  if not ok then raise exception 'FAIL: anon inserted a family'; end if;
  raise notice 'PASS: anon cannot write';
end $$;
select count(*) as anon_storage_objects_visible from storage.objects;  -- expect 0 (or permission denied if anon has no grants)
reset role;

rollback;
