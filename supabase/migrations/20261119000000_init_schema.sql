-- PROJECT ECHO: core schema (profiles, families, memberships, ancestors, memories, media, capsules)
-- Every table is family-scoped. family_id is denormalised onto memories/media_assets so RLS and
-- storage paths can check membership without joins; composite FKs keep it consistent.

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Resident' check (char_length(display_name) between 1 and 80),
  created_at   timestamptz not null default now()
);

create table public.families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  created_by uuid references public.profiles(id) on delete set null,
  is_demo    boolean not null default false,   -- fictional demo family; only set via seed (service role)
  created_at timestamptz not null default now()
);

create table public.family_memberships (
  family_id  uuid not null references public.families(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'viewer' check (role in ('owner','editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (family_id, user_id)
);
create index family_memberships_user_idx on public.family_memberships(user_id);

create table public.ancestors (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 160),
  birth_year integer check (birth_year between 0 and 3000),
  death_year integer check (death_year between 0 and 3000),
  biography  text,
  generation integer not null default 0 check (generation >= 0),
  created_at timestamptz not null default now(),
  constraint ancestors_years_order check (birth_year is null or death_year is null or death_year >= birth_year),
  constraint ancestors_id_family_key unique (id, family_id)
);
create index ancestors_family_idx on public.ancestors(family_id);

create table public.ancestor_relationships (
  id               uuid primary key default gen_random_uuid(),
  family_id        uuid not null,
  from_ancestor_id uuid not null,
  to_ancestor_id   uuid not null,
  relationship_type text not null check (relationship_type in ('parent_of','spouse_of','sibling_of')),
  created_at       timestamptz not null default now(),
  foreign key (from_ancestor_id, family_id) references public.ancestors(id, family_id) on delete cascade,
  foreign key (to_ancestor_id,   family_id) references public.ancestors(id, family_id) on delete cascade,
  check (from_ancestor_id <> to_ancestor_id),
  unique (from_ancestor_id, to_ancestor_id, relationship_type)
);
create index ancestor_rel_family_idx on public.ancestor_relationships(family_id);
create index ancestor_rel_to_idx     on public.ancestor_relationships(to_ancestor_id);

create table public.memories (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null,
  ancestor_id uuid not null,
  title       text not null check (char_length(title) between 1 and 200),
  description text,
  memory_date date,
  memory_type text not null default 'story'
              check (memory_type in ('story','photo','audio','video','document','other')),
  location    text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  foreign key (ancestor_id, family_id) references public.ancestors(id, family_id) on delete cascade,
  constraint memories_id_family_key unique (id, family_id)
);
create index memories_ancestor_idx on public.memories(ancestor_id);
create index memories_family_idx   on public.memories(family_id);

create table public.media_assets (
  id                uuid primary key default gen_random_uuid(),
  memory_id         uuid not null,
  family_id         uuid not null,
  storage_path      text not null unique,
  mime_type         text not null check (mime_type in (
                      'image/jpeg','image/png','image/webp','image/gif',
                      'audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg',
                      'video/mp4','video/webm','video/quicktime','application/pdf')),
  file_size_bytes   bigint not null check (file_size_bytes > 0 and file_size_bytes <= 52428800),
  original_filename text not null,
  uploaded_by       uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  foreign key (memory_id, family_id) references public.memories(id, family_id) on delete cascade,
  -- path must live under this asset's own family + memory folder
  check (storage_path like 'families/' || family_id::text || '/memories/' || memory_id::text || '/%')
);
create index media_assets_memory_idx on public.media_assets(memory_id);
create index media_assets_family_idx on public.media_assets(family_id);

create table public.time_capsules (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families(id) on delete cascade,
  creator_id uuid references public.profiles(id) on delete set null,
  message    text not null check (char_length(message) between 1 and 10000),
  recipient  text,          -- intended person or generation, free text
  unlock_date date,         -- null = no lock
  created_at timestamptz not null default now()
);
create index time_capsules_family_idx on public.time_capsules(family_id);

-- Auto-create a profile for each new auth user.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(left(new.raw_user_meta_data->>'display_name', 80), ''), 'Resident'))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Creator of a family automatically becomes its owner.
create function public.add_creator_as_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.created_by is not null then
    insert into public.family_memberships (family_id, user_id, role)
    values (new.id, new.created_by, 'owner') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_family_created after insert on public.families
  for each row execute function public.add_creator_as_owner();
