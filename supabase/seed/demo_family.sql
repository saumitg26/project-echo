-- Controlled seed for PROJECT ECHO's FICTIONAL Voss / Vale demo archive.
-- Run as postgres/service role. Safe to re-run; private user rows are never touched.

insert into public.families (id, name, created_by, is_demo)
values ('de000000-0000-4000-8000-000000000001', 'Voss / Vale Family Archive', null, true)
on conflict (id) do update set name = excluded.name, is_demo = true;

insert into public.ancestors
  (id, family_id, name, birth_year, death_year, biography, generation)
values
  ('de000000-0000-4000-8000-0000000000a1', 'de000000-0000-4000-8000-000000000001',
   'Elena Voss', 2008, 2071,
   'Botanist, mother, keeper of forbidden seeds. Elena recorded the last rainfall above Shelter 12.', 1),
  ('de000000-0000-4000-8000-0000000000a2', 'de000000-0000-4000-8000-000000000001',
   'Mara Voss', 2038, 2080,
   'Lia''s mother: she sketched the harbor, saved songs on worn tape, and wrote letters she never sent.', 2),
  ('de000000-0000-4000-8000-0000000000a3', 'de000000-0000-4000-8000-000000000001',
   'Jonas Vale', 2035, 2076,
   'Mara''s partner and Lia''s father, remembered through stories of the open water before the shelters closed.', 2),
  ('de000000-0000-4000-8000-0000000000a4', 'de000000-0000-4000-8000-000000000001',
   'Lia Vale', 2062, null,
   'Third-generation archive keeper and custodian of the Voss / Vale family memories.', 3)
on conflict (id) do update set
  name = excluded.name, birth_year = excluded.birth_year, death_year = excluded.death_year,
  biography = excluded.biography, generation = excluded.generation;

insert into public.ancestor_relationships
  (family_id, from_ancestor_id, to_ancestor_id, relationship_type)
values
  ('de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-0000000000a1', 'de000000-0000-4000-8000-0000000000a2', 'parent_of'),
  ('de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-0000000000a2', 'de000000-0000-4000-8000-0000000000a3', 'spouse_of'),
  ('de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-0000000000a2', 'de000000-0000-4000-8000-0000000000a4', 'parent_of'),
  ('de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-0000000000a3', 'de000000-0000-4000-8000-0000000000a4', 'parent_of')
on conflict do nothing;

insert into public.memories
  (id, family_id, ancestor_id, title, description, memory_date, memory_type)
values
  ('de000000-0000-4000-8000-0000000000b1', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-0000000000a1',
   'The afternoon before', 'A family photograph taken on the first warm day of 2041.', '2041-04-18', 'photo'),
  ('de000000-0000-4000-8000-0000000000b2', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-0000000000a1',
   'To whoever finds this', 'An unsent letter describing harbor alarms before the official warning.', '2049-08-07', 'document'),
  ('de000000-0000-4000-8000-0000000000b3', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-0000000000a1',
   'Field notes 17', 'A recovered recording about seed vaults and the north gate convoy.', '2057-11-02', 'audio'),
  ('de000000-0000-4000-8000-0000000000b4', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-0000000000a2',
   'City above the water', 'Mara''s last photograph of the harbor skyline.', '2058-03-22', 'photo'),
  ('de000000-0000-4000-8000-0000000000b5', 'de000000-0000-4000-8000-000000000001', 'de000000-0000-4000-8000-0000000000a3',
   'The open water', 'A memory of an ocean horizon before the shelters closed.', '2055-06-14', 'photo')
on conflict (id) do update set
  title = excluded.title, description = excluded.description, memory_date = excluded.memory_date,
  memory_type = excluded.memory_type;

-- Demo media stays in the frontend's static experience. The private bucket is reserved for
-- authenticated family uploads and has no anonymous read policy.
