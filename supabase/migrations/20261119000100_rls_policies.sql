-- Row Level Security. No USING (true) on private data.
-- Demo data (families.is_demo = true) is fictional and the ONLY thing anon can read.

create function public.is_family_member(fid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.family_memberships m
                 where m.family_id = fid and m.user_id = (select auth.uid()));
$$;

create function public.has_family_role(fid uuid, roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.family_memberships m
                 where m.family_id = fid and m.user_id = (select auth.uid()) and m.role = any(roles));
$$;

create function public.shares_family_with(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.family_memberships a
                 join public.family_memberships b on a.family_id = b.family_id
                 where a.user_id = (select auth.uid()) and b.user_id = other);
$$;

revoke all on function public.is_family_member(uuid), public.has_family_role(uuid, text[]),
  public.shares_family_with(uuid) from public, anon;
grant execute on function public.is_family_member(uuid), public.has_family_role(uuid, text[]),
  public.shares_family_with(uuid) to authenticated;

alter table public.profiles               enable row level security;
alter table public.families               enable row level security;
alter table public.family_memberships     enable row level security;
alter table public.ancestors              enable row level security;
alter table public.ancestor_relationships enable row level security;
alter table public.memories               enable row level security;
alter table public.media_assets           enable row level security;
alter table public.time_capsules          enable row level security;

-- Explicit grants (RLS still decides which rows).
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.families, public.family_memberships, public.ancestors,
  public.ancestor_relationships, public.memories, public.media_assets, public.time_capsules to authenticated;
grant select on public.families, public.ancestors, public.ancestor_relationships, public.memories,
  public.media_assets, public.time_capsules to anon;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_family_with(id));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- families
create policy families_select_member on public.families for select to authenticated
  using (public.is_family_member(id) or created_by = (select auth.uid()));
create policy families_select_demo on public.families for select to anon, authenticated
  using (is_demo);
create policy families_insert on public.families for insert to authenticated
  with check (created_by = (select auth.uid()) and not is_demo);
create policy families_update_owner on public.families for update to authenticated
  using (public.has_family_role(id, array['owner']) and not is_demo)
  with check (not is_demo);
create policy families_delete_owner on public.families for delete to authenticated
  using (public.has_family_role(id, array['owner']) and not is_demo);

-- family_memberships (owners manage; anyone can leave)
create policy memberships_select on public.family_memberships for select to authenticated
  using (user_id = (select auth.uid()) or public.is_family_member(family_id));
create policy memberships_insert_owner on public.family_memberships for insert to authenticated
  with check (public.has_family_role(family_id, array['owner']));
create policy memberships_update_owner on public.family_memberships for update to authenticated
  using (public.has_family_role(family_id, array['owner']))
  with check (public.has_family_role(family_id, array['owner']));
create policy memberships_delete on public.family_memberships for delete to authenticated
  using (public.has_family_role(family_id, array['owner']) or user_id = (select auth.uid()));

-- Family-scoped content tables: members read, owners/editors write.
do $$
declare t text;
begin
  foreach t in array array['ancestors','ancestor_relationships','memories','media_assets','time_capsules'] loop
    execute format($f$create policy %I on public.%I for select to authenticated
      using (public.is_family_member(family_id))$f$, t || '_select_member', t);
    execute format($f$create policy %I on public.%I for select to anon, authenticated
      using (exists (select 1 from public.families f where f.id = %I.family_id and f.is_demo))$f$,
      t || '_select_demo', t, t);
  end loop;
end $$;

create policy ancestors_insert on public.ancestors for insert to authenticated
  with check (public.has_family_role(family_id, array['owner','editor']));
create policy ancestors_update on public.ancestors for update to authenticated
  using (public.has_family_role(family_id, array['owner','editor']))
  with check (public.has_family_role(family_id, array['owner','editor']));
create policy ancestors_delete on public.ancestors for delete to authenticated
  using (public.has_family_role(family_id, array['owner']));

create policy ancestor_rel_insert on public.ancestor_relationships for insert to authenticated
  with check (public.has_family_role(family_id, array['owner','editor']));
create policy ancestor_rel_delete on public.ancestor_relationships for delete to authenticated
  using (public.has_family_role(family_id, array['owner','editor']));

create policy memories_insert on public.memories for insert to authenticated
  with check (public.has_family_role(family_id, array['owner','editor']) and uploaded_by = (select auth.uid()));
create policy memories_update on public.memories for update to authenticated
  using (public.has_family_role(family_id, array['owner']) or
         (public.has_family_role(family_id, array['editor']) and uploaded_by = (select auth.uid())))
  with check (public.has_family_role(family_id, array['owner','editor']));
create policy memories_delete on public.memories for delete to authenticated
  using (public.has_family_role(family_id, array['owner']) or
         (public.has_family_role(family_id, array['editor']) and uploaded_by = (select auth.uid())));

create policy media_insert on public.media_assets for insert to authenticated
  with check (public.has_family_role(family_id, array['owner','editor']) and uploaded_by = (select auth.uid()));
create policy media_delete on public.media_assets for delete to authenticated
  using (public.has_family_role(family_id, array['owner']) or
         (public.has_family_role(family_id, array['editor']) and uploaded_by = (select auth.uid())));

create policy capsules_insert on public.time_capsules for insert to authenticated
  with check (public.has_family_role(family_id, array['owner','editor']) and creator_id = (select auth.uid()));
create policy capsules_delete on public.time_capsules for delete to authenticated
  using (public.has_family_role(family_id, array['owner']) or creator_id = (select auth.uid()));
