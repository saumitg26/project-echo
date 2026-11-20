-- Controlled seed for the FICTIONAL demo family. Run manually in the Supabase SQL editor (service role / postgres).
-- Safe to re-run. Never run by clients; RLS prevents any user from creating is_demo = true rows.
-- Real user content is never is_demo = true, so demo and real data cannot mix.

insert into public.families (id, name, created_by, is_demo)
values ('de000000-0000-4000-8000-000000000001', 'DEMO: <name of your existing fictional family>', null, true)
on conflict (id) do nothing;

-- TODO: copy your EXISTING fictional characters/memories from the Figma Make demo data here, unchanged.
-- (I could not read the repo, so none are invented.) Template:
--
-- insert into public.ancestors (id, family_id, name, birth_year, death_year, biography, generation) values
--   ('de000000-0000-4000-8000-0000000000a1', 'de000000-0000-4000-8000-000000000001', '<name>', 2010, null, '<bio>', 0)
-- on conflict (id) do nothing;
--
-- insert into public.ancestor_relationships (family_id, from_ancestor_id, to_ancestor_id, relationship_type) values
--   ('de000000-0000-4000-8000-000000000001', '<parent id>', '<child id>', 'parent_of')
-- on conflict do nothing;
--
-- insert into public.memories (id, family_id, ancestor_id, title, description, memory_type) values
--   ('de000000-0000-4000-8000-0000000000b1', 'de000000-0000-4000-8000-000000000001', '<ancestor id>', '<title>', '<story>', 'story')
-- on conflict (id) do nothing;
--
-- Demo photos/audio: keep them as static files in the app (public/), NOT in the private bucket.
