-- PROJECT ECHO: Human Legacy public archive and private contribution pipeline.
-- This migration is intentionally isolated from the existing Family Legacy policies.

create table public.archive_reviewers (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
revoke all on public.archive_reviewers from public, anon, authenticated;

create function public.is_archive_reviewer() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.archive_reviewers r where r.user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_archive_reviewer() from public, anon;
grant execute on function public.is_archive_reviewer() to authenticated;

create table public.historical_locations (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 1 and 160),
  short_description text not null check (char_length(short_description) between 1 and 2000),
  latitude          numeric(9,6),
  longitude         numeric(9,6),
  map_x             numeric(5,2) not null check (map_x between 0 and 100),
  map_y             numeric(5,2) not null check (map_y between 0 and 100),
  event_title       text not null check (char_length(event_title) between 1 and 200),
  event_date        date not null,
  image_url         text,
  classification    text not null default 'civilization_archive'
                    check (classification in ('civilization_archive','restricted_archive','recovered_site')),
  tags              text[] not null default '{}',
  is_published      boolean not null default false,
  created_at        timestamptz not null default now()
);
create index historical_locations_published_idx
  on public.historical_locations (event_date, slug) where is_published;

create table public.historical_records (
  id                  uuid primary key default gen_random_uuid(),
  location_id         uuid not null references public.historical_locations(id) on delete cascade,
  slug                text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title               text not null check (char_length(title) between 1 and 200),
  content             text not null check (char_length(content) between 1 and 20000),
  event_at            timestamptz,
  record_classification text not null check (record_classification in (
                        'public_bulletin','system_log','personnel_manifest','photograph',
                        'field_recording','written_testimony','interpretive_reconstruction')),
  origin_kind         text not null check (origin_kind in ('original','testimony','reconstruction')),
  provenance          text not null check (char_length(provenance) between 1 and 1000),
  tags                text[] not null default '{}',
  media_url           text,
  verification_status text not null default 'unverified'
                      check (verification_status in ('verified','corroborated','disputed','interpretive','unverified')),
  is_published        boolean not null default false,
  created_at          timestamptz not null default now(),
  constraint reconstructed_records_are_explicit check (
    origin_kind <> 'reconstruction' or verification_status = 'interpretive'
  ),
  constraint published_records_are_reviewed check (
    not is_published or verification_status <> 'unverified'
  ),
  constraint historical_records_id_location_key unique (id, location_id)
);
create index historical_records_location_idx on public.historical_records(location_id, event_at);
create index historical_records_public_idx on public.historical_records(location_id, event_at)
  where is_published;
create index historical_records_tags_idx on public.historical_records using gin(tags);

create table public.historical_contributions (
  id                uuid primary key default gen_random_uuid(),
  location_id       uuid not null references public.historical_locations(id) on delete restrict,
  contributor_id    uuid not null references public.profiles(id) on delete cascade,
  contribution_type text not null check (contribution_type in ('written_account','photograph','document','testimony','audio')),
  title             text not null check (char_length(title) between 1 and 200),
  description       text not null check (char_length(description) between 1 and 20000),
  event_date        date,
  moderation_status text not null default 'pending' check (moderation_status in ('pending','approved','rejected')),
  reviewed_by       uuid references public.archive_reviewers(user_id) on delete restrict,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  constraint historical_contributions_id_contributor_key unique (id, contributor_id),
  constraint contribution_review_consistency check (
    (moderation_status = 'pending' and reviewed_by is null and reviewed_at is null)
    or (moderation_status in ('approved','rejected') and reviewed_by is not null and reviewed_at is not null)
  )
);
create index historical_contributions_owner_idx
  on public.historical_contributions(contributor_id, created_at desc);
create index historical_contributions_review_idx
  on public.historical_contributions(moderation_status, created_at);

create table public.historical_contribution_media (
  id                uuid primary key default gen_random_uuid(),
  contribution_id   uuid not null,
  contributor_id    uuid not null references public.profiles(id) on delete cascade,
  storage_path      text not null unique,
  mime_type         text not null check (mime_type in (
                      'image/jpeg','image/png','image/webp','image/gif',
                      'audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg',
                      'application/pdf')),
  file_size_bytes   bigint not null check (file_size_bytes > 0 and file_size_bytes <= 26214400),
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  created_at        timestamptz not null default now(),
  foreign key (contribution_id, contributor_id)
    references public.historical_contributions(id, contributor_id) on delete cascade,
  check (storage_path like 'contributors/' || contributor_id::text || '/contributions/' || contribution_id::text || '/%'),
  unique (contribution_id, id)
);
create index historical_contribution_media_contribution_idx
  on public.historical_contribution_media(contribution_id);

create table public.family_historical_links (
  id                   uuid primary key default gen_random_uuid(),
  family_id            uuid not null,
  memory_id            uuid not null,
  historical_location_id uuid references public.historical_locations(id) on delete cascade,
  historical_record_id uuid,
  relationship_note    text check (char_length(relationship_note) <= 1000),
  created_at           timestamptz not null default now(),
  foreign key (memory_id, family_id) references public.memories(id, family_id) on delete cascade,
  foreign key (historical_record_id, historical_location_id)
    references public.historical_records(id, location_id) on delete cascade,
  check (historical_location_id is not null or historical_record_id is not null),
  check (historical_record_id is null or historical_location_id is not null),
  unique nulls not distinct (memory_id, historical_location_id, historical_record_id)
);
create index family_historical_links_family_idx on public.family_historical_links(family_id);
create index family_historical_links_location_idx on public.family_historical_links(historical_location_id);

alter table public.archive_reviewers enable row level security;
alter table public.historical_locations enable row level security;
alter table public.historical_records enable row level security;
alter table public.historical_contributions enable row level security;
alter table public.historical_contribution_media enable row level security;
alter table public.family_historical_links enable row level security;

grant select on public.historical_locations, public.historical_records to anon, authenticated;
grant insert, select, delete on public.historical_contributions, public.historical_contribution_media to authenticated;
grant select on public.family_historical_links to authenticated;

create policy historical_locations_public_read on public.historical_locations
  for select to anon, authenticated using (is_published);
create policy historical_locations_reviewer_read on public.historical_locations
  for select to authenticated using (public.is_archive_reviewer());

create policy historical_records_public_read on public.historical_records
  for select to anon, authenticated using (
    is_published and exists (
      select 1 from public.historical_locations l where l.id = location_id and l.is_published
    )
  );
create policy historical_records_reviewer_read on public.historical_records
  for select to authenticated using (public.is_archive_reviewer());

create policy historical_contributions_insert_own on public.historical_contributions
  for insert to authenticated with check (
    contributor_id = (select auth.uid())
    and moderation_status = 'pending' and reviewed_by is null and reviewed_at is null
    and exists (select 1 from public.historical_locations l where l.id = location_id and l.is_published)
  );
create policy historical_contributions_read_own on public.historical_contributions
  for select to authenticated using (contributor_id = (select auth.uid()));
create policy historical_contributions_delete_own_pending on public.historical_contributions
  for delete to authenticated using (
    contributor_id = (select auth.uid()) and moderation_status = 'pending'
  );
create policy historical_contributions_reviewer_read on public.historical_contributions
  for select to authenticated using (public.is_archive_reviewer());
-- Only moderation columns are writable through the client API. Public records remain admin-managed.
grant update (moderation_status, reviewed_by, reviewed_at)
  on public.historical_contributions to authenticated;
create policy historical_contributions_reviewer_update on public.historical_contributions
  for update to authenticated using (
    public.is_archive_reviewer() and contributor_id <> (select auth.uid())
  )
  with check (
    public.is_archive_reviewer() and contributor_id <> (select auth.uid())
    and reviewed_by = (select auth.uid())
  );

create policy historical_contribution_media_insert_own on public.historical_contribution_media
  for insert to authenticated with check (
    contributor_id = (select auth.uid()) and exists (
      select 1 from public.historical_contributions c
      where c.id = contribution_id and c.contributor_id = (select auth.uid()) and c.moderation_status = 'pending'
    )
  );
create policy historical_contribution_media_read_own on public.historical_contribution_media
  for select to authenticated using (contributor_id = (select auth.uid()));
create policy historical_contribution_media_delete_own on public.historical_contribution_media
  for delete to authenticated using (
    contributor_id = (select auth.uid()) and exists (
      select 1 from public.historical_contributions c
      where c.id = contribution_id and c.contributor_id = (select auth.uid()) and c.moderation_status = 'pending'
    )
  );
create policy historical_contribution_media_reviewer_read on public.historical_contribution_media
  for select to authenticated using (public.is_archive_reviewer());

create policy family_historical_links_member_read on public.family_historical_links
  for select to authenticated using (public.is_family_member(family_id));
-- Deliberately no anon policy and no join from public records to private family data.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('historical-contributions', 'historical-contributions', false, 26214400, array[
  'image/jpeg','image/png','image/webp','image/gif',
  'audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg','application/pdf'])
on conflict (id) do update set public = false,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create function public.historical_path_owner(object_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case when object_name ~
    '^contributors/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/contributions/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
    then substring(object_name from '^contributors/([0-9a-f-]{36})/')::uuid end;
$$;
create function public.historical_path_contribution(object_name text) returns uuid
language sql immutable set search_path = '' as $$
  select case when object_name ~
    '^contributors/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/contributions/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+$'
    then substring(object_name from '/contributions/([0-9a-f-]{36})/')::uuid end;
$$;
revoke all on function public.historical_path_owner(text), public.historical_path_contribution(text) from public, anon;
grant execute on function public.historical_path_owner(text), public.historical_path_contribution(text) to authenticated;

create policy "historical contribution media: owner read" on storage.objects for select to authenticated
  using (bucket_id = 'historical-contributions' and public.historical_path_owner(name) = (select auth.uid()));
create policy "historical contribution media: reviewer read" on storage.objects for select to authenticated
  using (bucket_id = 'historical-contributions' and public.is_archive_reviewer());
create policy "historical contribution media: owner upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'historical-contributions'
    and public.historical_path_owner(name) = (select auth.uid())
    and exists (
      select 1 from public.historical_contributions c
      where c.id = public.historical_path_contribution(name)
        and c.contributor_id = (select auth.uid()) and c.moderation_status = 'pending'
    )
  );
create policy "historical contribution media: owner delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'historical-contributions'
    and public.historical_path_owner(name) = (select auth.uid())
    and exists (
      select 1 from public.historical_contributions c
      where c.id = public.historical_path_contribution(name)
        and c.contributor_id = (select auth.uid()) and c.moderation_status = 'pending'
    )
  );
