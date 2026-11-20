-- Human Legacy RLS verification. Run after migrations; the transaction always rolls back.
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/human_legacy_rls.sql
begin;

-- Capture test notices for both psql and Supabase SQL runner
create temp table if not exists _test_results (phase int, notice text) on commit drop;
grant all on _test_results to anon, authenticated;

-- 1. Provision synthetic test users and profile rows idempotently.
insert into auth.users (id, email) values
  ('d1000000-0000-4000-8000-000000000001', 'contributor-a@test.invalid'),
  ('d1000000-0000-4000-8000-000000000002', 'contributor-b@test.invalid'),
  ('d1000000-0000-4000-8000-000000000003', 'reviewer@test.invalid')
on conflict (id) do nothing;

insert into public.profiles (id, display_name) values
  ('d1000000-0000-4000-8000-000000000001', 'Contributor A'),
  ('d1000000-0000-4000-8000-000000000002', 'Contributor B'),
  ('d1000000-0000-4000-8000-000000000003', 'Archive Reviewer')
on conflict (id) do nothing;

-- 2. Provision synthetic locations and records (published and unpublished fixtures).
insert into public.historical_locations
  (id, slug, name, short_description, map_x, map_y, event_title, event_date, is_published)
values
  ('d2000000-0000-4000-8000-000000000001', 'rls-public-site', 'RLS PUBLIC SITE', 'Published test site.', 20, 30, 'PUBLIC EVENT', '2058-01-01', true),
  ('d2000000-0000-4000-8000-000000000002', 'rls-hidden-site', 'RLS HIDDEN SITE', 'Unpublished test site.', 40, 50, 'HIDDEN EVENT', '2058-01-02', false)
on conflict (id) do nothing;

insert into public.historical_records
  (id, location_id, slug, title, content, record_classification, origin_kind, provenance, verification_status, is_published)
values
  ('d3000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001', 'rls-public-record',
   'Public record', 'Approved fictional record.', 'system_log', 'original', 'RLS fixture', 'verified', true),
  ('d3000000-0000-4000-8000-000000000002', 'd2000000-0000-4000-8000-000000000001', 'rls-hidden-record',
   'Hidden record', 'Unpublished fictional record.', 'system_log', 'original', 'RLS fixture', 'verified', false)
on conflict (id) do nothing;

-- 3. Anonymous readers see only published locations and records, and cannot write.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select set_config('request.jwt.claim.sub', '', true);
set local role anon;

do $$ declare n integer; denied boolean := false; begin
  select count(*) into n from public.historical_locations where id in (
    'd2000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000002');
  if n <> 1 then raise exception 'FAIL: anon location visibility expected 1, got %', n; end if;

  select count(*) into n from public.historical_records where id in (
    'd3000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000002');
  if n <> 1 then raise exception 'FAIL: anon record visibility expected 1, got %', n; end if;

  -- Anon cannot create historical locations (permission denied)
  denied := false;
  begin
    insert into public.historical_locations
      (slug, name, short_description, map_x, map_y, event_title, event_date)
    values ('anon-test-site', 'Anon Site', 'Anon text', 10, 10, 'Anon Event', '2058-01-01');
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: anon inserted historical location'; end if;

  -- Anon cannot create historical records (permission denied)
  denied := false;
  begin
    insert into public.historical_records
      (location_id, slug, title, content, record_classification, origin_kind, provenance)
    values ('d2000000-0000-4000-8000-000000000001', 'anon-record', 'Anon Record',
      'Anon content', 'system_log', 'original', 'Anon provenance');
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: anon inserted historical record'; end if;

  insert into _test_results values (1, 'PASS: anon reads approved public history only and cannot modify public archive');
  raise notice 'PASS: anon reads approved public history only and cannot modify public archive';
end $$;
reset role;

-- 4. Contributor A creates a pending submission and private media.
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000001', true);
set local role authenticated;

insert into public.historical_contributions
  (id, location_id, contributor_id, contribution_type, title, description)
values
  ('d4000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000001',
   'd1000000-0000-4000-8000-000000000001', 'testimony', 'A testimony', 'Private pending account.');

insert into storage.objects (bucket_id, name) values (
  'historical-contributions',
  'contributors/d1000000-0000-4000-8000-000000000001/contributions/d4000000-0000-4000-8000-000000000001/d5000000-0000-4000-8000-000000000001.jpg');

insert into public.historical_contribution_media
  (id, contribution_id, contributor_id, storage_path, mime_type, file_size_bytes, original_filename)
values
  ('d5000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001',
   'd1000000-0000-4000-8000-000000000001',
   'contributors/d1000000-0000-4000-8000-000000000001/contributions/d4000000-0000-4000-8000-000000000001/d5000000-0000-4000-8000-000000000001.jpg',
   'image/jpeg', 1024, 'testimony.jpg');

do $$ declare n integer; changed integer; denied boolean := false; begin
  select count(*) into n from public.historical_contributions where id = 'd4000000-0000-4000-8000-000000000001';
  if n <> 1 then raise exception 'FAIL: contributor cannot read own pending submission'; end if;

  select count(*) into n from storage.objects where bucket_id = 'historical-contributions';
  if n <> 1 then raise exception 'FAIL: contributor cannot read own pending media'; end if;

  -- Contributor cannot self-approve (RLS update policy denies)
  update public.historical_contributions set moderation_status = 'approved'
    where id = 'd4000000-0000-4000-8000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: contributor approved own submission'; end if;

  -- Contributor cannot update content columns (only moderation columns granted to authenticated)
  denied := false;
  begin
    update public.historical_contributions set title = 'malicious title alteration'
      where id = 'd4000000-0000-4000-8000-000000000001';
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: contributor updated restricted title column'; end if;

  insert into _test_results values (2, 'PASS: contributor owns pending data but cannot self-approve or edit content post-submission');
  raise notice 'PASS: contributor owns pending data but cannot self-approve or edit content post-submission';
end $$;
reset role;

-- 5. Contributor B cannot see or alter A's pending submission/media, spoof submissions, or escalate privileges.
select set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000002', true);
set local role authenticated;

do $$ declare n integer; changed integer; denied boolean := false; begin
  select count(*) into n from public.historical_contributions where id = 'd4000000-0000-4000-8000-000000000001';
  if n <> 0 then raise exception 'FAIL: B can read A pending submission'; end if;

  select count(*) into n from public.historical_contribution_media where contribution_id = 'd4000000-0000-4000-8000-000000000001';
  if n <> 0 then raise exception 'FAIL: B can read A pending media row'; end if;

  select count(*) into n from storage.objects where bucket_id = 'historical-contributions';
  if n <> 0 then raise exception 'FAIL: B can read A private storage object'; end if;

  -- B cannot approve A's submission
  update public.historical_contributions set moderation_status = 'approved'
    where id = 'd4000000-0000-4000-8000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: B approved A submission'; end if;

  -- B cannot delete A's submission
  delete from public.historical_contributions where id = 'd4000000-0000-4000-8000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: B deleted A submission'; end if;

  -- B cannot insert a pre-approved submission (denied by RLS WITH CHECK policy)
  denied := false;
  begin
    insert into public.historical_contributions
      (location_id, contributor_id, contribution_type, title, description, moderation_status, reviewed_by, reviewed_at)
    values ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000002',
      'testimony', 'Pre-approved attack', 'Must be rejected.', 'approved',
      'd1000000-0000-4000-8000-000000000002', now());
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: B inserted a pre-approved submission'; end if;

  -- B cannot insert a submission spoofing contributor A
  denied := false;
  begin
    insert into public.historical_contributions
      (location_id, contributor_id, contribution_type, title, description)
    values ('d2000000-0000-4000-8000-000000000001', 'd1000000-0000-4000-8000-000000000001',
      'testimony', 'Spoofing contributor A', 'Must be rejected.');
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: B inserted a submission spoofing contributor A'; end if;

  -- B cannot insert media into A's contribution
  denied := false;
  begin
    insert into public.historical_contribution_media
      (id, contribution_id, contributor_id, storage_path, mime_type, file_size_bytes, original_filename)
    values
      ('d5000000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000001',
       'd1000000-0000-4000-8000-000000000002',
       'contributors/d1000000-0000-4000-8000-000000000002/contributions/d4000000-0000-4000-8000-000000000001/b.jpg',
       'image/jpeg', 1024, 'b.jpg');
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: B inserted media into A contribution'; end if;

  -- B cannot upload file into A's storage folder
  denied := false;
  begin
    insert into storage.objects (bucket_id, name) values (
      'historical-contributions',
      'contributors/d1000000-0000-4000-8000-000000000001/contributions/d4000000-0000-4000-8000-000000000001/b-exploit.jpg');
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: B uploaded media into A storage folder'; end if;

  -- B cannot query the archive_reviewers table
  denied := false;
  begin
    perform count(*) from public.archive_reviewers;
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: B queried archive reviewers table'; end if;

  -- B cannot promote self to archive reviewer
  denied := false;
  begin
    insert into public.archive_reviewers (user_id) values ('d1000000-0000-4000-8000-000000000002');
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: B promoted self to archive reviewer'; end if;

  -- B cannot modify public historical archive locations
  denied := false;
  begin
    update public.historical_locations set is_published = false
      where id = 'd2000000-0000-4000-8000-000000000001';
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: B modified the public historical archive locations'; end if;

  -- B cannot modify public historical archive records
  denied := false;
  begin
    update public.historical_records set is_published = false
      where id = 'd3000000-0000-4000-8000-000000000001';
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: B modified the public historical archive records'; end if;

  insert into _test_results values (3, 'PASS: contributors are isolated and cannot publish or tamper with data');
  raise notice 'PASS: contributors are isolated and cannot publish or tamper with data';
end $$;
reset role;

-- 6. Anonymous users cannot query pending rows, private media, or the private family links table.
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select set_config('request.jwt.claim.sub', '', true);
set local role anon;

do $$ declare denied boolean := false; n integer; begin
  -- Anon cannot query pending contributions
  denied := false;
  begin
    perform count(*) from public.historical_contributions;
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: anon queried pending contributions'; end if;

  -- Anon cannot query contribution media
  denied := false;
  begin
    perform count(*) from public.historical_contribution_media;
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: anon queried contribution media'; end if;

  -- Anon cannot query private family links
  denied := false;
  begin
    perform count(*) from public.family_historical_links;
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: anon queried private family links'; end if;

  -- Anon cannot query archive reviewers
  denied := false;
  begin
    perform count(*) from public.archive_reviewers;
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: anon queried archive reviewers'; end if;

  -- Anon cannot read private pending storage media (RLS filters out rows or permission denied)
  denied := false;
  begin
    select count(*) into n from storage.objects where bucket_id = 'historical-contributions';
    if n <> 0 then raise exception 'FAIL: anon read private pending media (found % objects)', n; end if;
  exception when insufficient_privilege then denied := true; end;

  insert into _test_results values (4, 'PASS: pending contributions, media, and family links are absent from public access');
  raise notice 'PASS: pending contributions, media, and family links are absent from public access';
end $$;
reset role;

-- 7. A reviewer is provisioned only by a privileged database operation, then may review.
insert into public.archive_reviewers (user_id) values ('d1000000-0000-4000-8000-000000000003')
on conflict (user_id) do nothing;

select set_config('request.jwt.claims', '{"sub":"d1000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', 'd1000000-0000-4000-8000-000000000003', true);
set local role authenticated;

do $$ declare changed integer; n integer; denied boolean := false; begin
  -- Reviewer can read pending contributions queue
  select count(*) into n from public.historical_contributions where id = 'd4000000-0000-4000-8000-000000000001';
  if n <> 1 then raise exception 'FAIL: reviewer cannot read pending queue'; end if;

  -- Reviewer can read pending contribution media in storage
  select count(*) into n from storage.objects where bucket_id = 'historical-contributions';
  if n <> 1 then raise exception 'FAIL: reviewer cannot read pending contribution storage object'; end if;

  -- Reviewer can see unpublished locations and records
  select count(*) into n from public.historical_locations where id in (
    'd2000000-0000-4000-8000-000000000001', 'd2000000-0000-4000-8000-000000000002');
  if n <> 2 then raise exception 'FAIL: reviewer cannot read unpublished historical location'; end if;

  select count(*) into n from public.historical_records where id in (
    'd3000000-0000-4000-8000-000000000001', 'd3000000-0000-4000-8000-000000000002');
  if n <> 2 then raise exception 'FAIL: reviewer cannot read unpublished historical record'; end if;

  -- Reviewer creates own contribution
  insert into public.historical_contributions
    (id, location_id, contributor_id, contribution_type, title, description)
  values ('d4000000-0000-4000-8000-000000000003', 'd2000000-0000-4000-8000-000000000001',
    'd1000000-0000-4000-8000-000000000003', 'testimony', 'Reviewer testimony', 'Still requires another reviewer.');

  -- Reviewer CANNOT approve own contribution (conflict of interest blocked by RLS)
  update public.historical_contributions set moderation_status = 'approved',
    reviewed_by = 'd1000000-0000-4000-8000-000000000003', reviewed_at = now()
    where id = 'd4000000-0000-4000-8000-000000000003';
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: reviewer approved own contribution'; end if;

  -- Reviewer CANNOT forge reviewed_by attribution to another user (RLS WITH CHECK blocks)
  denied := false;
  begin
    update public.historical_contributions set moderation_status = 'approved',
      reviewed_by = 'd1000000-0000-4000-8000-000000000002', reviewed_at = now()
      where id = 'd4000000-0000-4000-8000-000000000001';
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: reviewer forged reviewed_by attribution'; end if;

  -- Reviewer CANNOT edit contribution content columns (title, description)
  denied := false;
  begin
    update public.historical_contributions set title = 'Altered by reviewer'
      where id = 'd4000000-0000-4000-8000-000000000001';
  exception when insufficient_privilege then denied := true; end;
  if not denied then raise exception 'FAIL: reviewer edited contribution content column'; end if;

  -- Reviewer CAN approve other contributor's submission
  update public.historical_contributions set moderation_status = 'approved',
    reviewed_by = 'd1000000-0000-4000-8000-000000000003', reviewed_at = now()
    where id = 'd4000000-0000-4000-8000-000000000001';
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: trusted reviewer could not approve'; end if;

  insert into _test_results values (5, 'PASS: explicitly trusted reviewer can review and cannot forge attribution or approve own work');
  raise notice 'PASS: explicitly trusted reviewer can review and cannot forge attribution or approve own work';
end $$;

-- 8. Clean up session configuration, surface notices, and roll back all changes.
reset role;
select set_config('request.jwt.claims', '', true);
select set_config('request.jwt.claim.sub', '', true);

select phase, notice from _test_results order by phase;

-- Transaction ALWAYS rolls back; never persists test data or modifies production records
rollback;
