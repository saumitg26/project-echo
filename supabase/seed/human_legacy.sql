-- Controlled, FICTIONAL Human Legacy seed. Safe to re-run.

insert into public.historical_locations
  (id, slug, name, short_description, latitude, longitude, map_x, map_y,
   event_title, event_date, image_url, classification, tags, is_published)
values
  ('a1000000-0000-4000-8000-000000000001', 'boston-harbor', 'BOSTON HARBOR',
   'The final civilian ships departed beneath a sky obscured by ash. Public records describe an orderly evacuation; witnesses remember sealed gates and a priority convoy.',
   42.360100, -71.058900, 28, 38, 'LAST DEPARTURE', '2058-03-22',
   'https://images.unsplash.com/photo-1653207771914-f7d37303755c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1600',
   'restricted_archive', array['boston','harbor','evacuation','convoy'], true),
  ('a1000000-0000-4000-8000-000000000002', 'svalbard-seed-vault', 'SVALBARD',
   'Botanists moved the last viable surface seed libraries into deep storage. Elena Voss appears in a damaged personnel manifest recovered in 2081.',
   78.223200, 15.646900, 52, 20, 'SEED VAULT', '2057-11-02',
   'https://images.unsplash.com/photo-1747182922993-9c7dde01c97f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1600',
   'recovered_site', array['svalbard','seeds','surface','orpheus'], true),
  ('a1000000-0000-4000-8000-000000000003', 'kyoto-final-bloom', 'KYOTO',
   'Citizens documented the last public cherry blossom season. These images became contraband after natural-world media was restricted underground.',
   35.011600, 135.768100, 79, 45, 'FINAL BLOOM', '2056-04-11',
   'https://images.unsplash.com/photo-1772981277378-f2c23ea6f156?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=700',
   'civilization_archive', array['kyoto','flowers','surface','photograph'], true),
  ('a1000000-0000-4000-8000-000000000004', 'patagonia-southern-signal', 'PATAGONIA',
   'A remote weather station broadcast ocean and wind recordings for three years after evacuation. The origin of its final human voice remains unknown.',
   -50.942300, -73.406800, 35, 76, 'SOUTHERN SIGNAL', '2055-06-14',
   'https://images.unsplash.com/photo-1747182922993-9c7dde01c97f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1600',
   'recovered_site', array['patagonia','ocean','surface','signal'], true)
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, short_description = excluded.short_description,
  latitude = excluded.latitude, longitude = excluded.longitude, map_x = excluded.map_x, map_y = excluded.map_y,
  event_title = excluded.event_title, event_date = excluded.event_date, image_url = excluded.image_url,
  classification = excluded.classification, tags = excluded.tags, is_published = excluded.is_published;

insert into public.historical_records
  (id, location_id, slug, title, content, event_at, record_classification, origin_kind,
   provenance, tags, verification_status, is_published)
values
  ('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   'boston-harbor-alarms', 'Harbor Alarms Begin',
   'Emergency tones were recorded across the harbor district before the Directorate public bulletin. The surviving audio index contains no public explanation for the early alarm.',
   '2058-03-22 05:10:00+00', 'system_log', 'original', 'Recovered municipal alarm index · Archive 41-B',
   array['boston','harbor','evacuation','alarm'], 'corroborated', true),
  ('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001',
   'directorate-evacuation-bulletin', 'Directorate Bulletin',
   '“Evacuation commenced at first warning. All citizens were given equal passage.” The transmission identifies 05:42 as the beginning of organized departure.',
   '2058-03-22 05:42:00+00', 'public_bulletin', 'original', 'Public Transmission 6A · Directorate broadcast archive',
   array['boston','harbor','evacuation','directorate','warning'], 'verified', true),
  ('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001',
   'elena-voss-letter', 'Elena Voss’s Letter',
   '“The convoy had already gone. I watched their lights cross the bridge before the sirens.” The account supports an earlier departure but does not establish the convoy’s purpose or passengers.',
   '2058-03-22 05:17:00+00', 'written_testimony', 'testimony', 'Voss family archive · recovered personal letter',
   array['boston','harbor','evacuation','convoy','voss'], 'corroborated', true),
  ('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001',
   'gate-transit-log-17-b', 'Gate Transit Log 17-B',
   'DIRECTORATE PRIORITY · 17 VEHICLES · CLEARANCE: ORPHEUS. North Bridge gate opened at 04:51, fifty-one minutes before the public warning.',
   '2058-03-22 04:51:00+00', 'system_log', 'original', 'Recovered North Bridge access controller · checksum partially verified',
   array['boston','harbor','evacuation','convoy','orpheus'], 'corroborated', true),
  ('b1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001',
   'north-gate-sealed', 'North Gate Sealed',
   'The surviving access log records the North Gate entering permanent lockdown. Later accounts disagree on how many residents remained outside.',
   '2058-03-22 06:18:00+00', 'system_log', 'original', 'Recovered municipal access log · Archive 41-B',
   array['boston','harbor','evacuation','gate'], 'verified', true),

  ('b1000000-0000-4000-8000-000000000101', 'a1000000-0000-4000-8000-000000000002',
   'svalbard-climate-failure', 'Vault Climate Failure',
   'A thermal-control fault threatened the surviving botanical libraries during their transfer underground.',
   '2057-11-02 18:06:00+00', 'system_log', 'original', 'Svalbard environmental controller · damaged export',
   array['svalbard','seeds','surface','climate'], 'verified', true),
  ('b1000000-0000-4000-8000-000000000102', 'a1000000-0000-4000-8000-000000000002',
   'orpheus-convoy-arrives', 'ORPHEUS Convoy Arrives',
   'A transport convoy using ORPHEUS clearance entered the lower vault. Its complete cargo manifest has not survived.',
   '2057-11-02 19:12:00+00', 'system_log', 'original', 'Lower-vault gate ledger · partial checksum match',
   array['svalbard','seeds','orpheus','convoy'], 'corroborated', true),
  ('b1000000-0000-4000-8000-000000000103', 'a1000000-0000-4000-8000-000000000002',
   'elena-voss-personnel-fragment', 'Elena Voss Personnel Fragment',
   'The damaged manifest includes Elena Voss among the botanical transfer personnel. Her exact assignment is missing.',
   '2057-11-02 20:04:00+00', 'personnel_manifest', 'original', 'Damaged personnel manifest · recovered 2081',
   array['svalbard','seeds','voss','manifest'], 'disputed', true),
  ('b1000000-0000-4000-8000-000000000104', 'a1000000-0000-4000-8000-000000000002',
   'svalbard-inventory-sealed', 'Final Inventory Sealed',
   'The surviving inventory closes at 21:40. Several listed cases have no destination entry.',
   '2057-11-02 21:40:00+00', 'system_log', 'original', 'Botanical library inventory · final surviving page',
   array['svalbard','seeds','inventory'], 'verified', true),

  ('b1000000-0000-4000-8000-000000000201', 'a1000000-0000-4000-8000-000000000003',
   'kyoto-gardens-opened', 'Gardens Opened',
   'Public gardens opened before dawn as citizens arrived to document the bloom.',
   '2056-04-11 06:30:00+00', 'written_testimony', 'testimony', 'Collected civic accounts · identities withheld',
   array['kyoto','flowers','surface'], 'corroborated', true),
  ('b1000000-0000-4000-8000-000000000202', 'a1000000-0000-4000-8000-000000000003',
   'kyoto-public-archive-captured', 'Public Archive Captured',
   'A distributed set of photographs preserved the color and scale of the final public blossom season.',
   '2056-04-11 12:14:00+00', 'photograph', 'original', 'Kyoto civic image archive · media index',
   array['kyoto','flowers','surface','photograph'], 'verified', true),
  ('b1000000-0000-4000-8000-000000000203', 'a1000000-0000-4000-8000-000000000003',
   'kyoto-preservation-order', 'Preservation Order Issued',
   'The Directorate preservation order collected natural-world media. Later access restrictions changed the images from public memory into controlled material.',
   '2056-04-11 20:02:00+00', 'public_bulletin', 'original', 'Directorate Cultural Preservation Order K-11',
   array['kyoto','flowers','directorate','restriction'], 'verified', true),

  ('b1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000004',
   'patagonia-telemetry-normal', 'Weather Telemetry Normal',
   'Wind and ocean telemetry remained within the station’s expected range.',
   '2055-06-14 03:20:00+00', 'system_log', 'original', 'Southern Station 4 telemetry packet',
   array['patagonia','ocean','signal','weather'], 'verified', true),
  ('b1000000-0000-4000-8000-000000000302', 'a1000000-0000-4000-8000-000000000004',
   'patagonia-human-voice', 'Human Voice Detected',
   'A voice appears beneath the wind channel for eleven seconds. The speaker and words remain unresolved.',
   '2055-06-14 03:24:00+00', 'field_recording', 'original', 'Southern Station 4 final recording · degraded',
   array['patagonia','ocean','signal','voice'], 'disputed', true),
  ('b1000000-0000-4000-8000-000000000303', 'a1000000-0000-4000-8000-000000000004',
   'patagonia-transmission-ends', 'Transmission Ends',
   'The carrier signal stopped at 03:26. No later packet from Southern Station 4 has been authenticated.',
   '2055-06-14 03:26:00+00', 'system_log', 'original', 'Hollow relay intake log · packet loss 38%',
   array['patagonia','ocean','signal'], 'verified', true)
on conflict (id) do update set
  location_id = excluded.location_id, slug = excluded.slug, title = excluded.title,
  content = excluded.content, event_at = excluded.event_at,
  record_classification = excluded.record_classification, origin_kind = excluded.origin_kind,
  provenance = excluded.provenance, tags = excluded.tags,
  verification_status = excluded.verification_status, is_published = excluded.is_published;

-- The relationship itself never grants access to the family memory. It is inserted only when the
-- fictional family seed is present and is visible solely to authorized family members through RLS.
insert into public.family_historical_links
  (id, family_id, memory_id, historical_location_id, historical_record_id, relationship_note)
select
  'c1000000-0000-4000-8000-000000000001', m.family_id, m.id,
  'a1000000-0000-4000-8000-000000000001', 'b1000000-0000-4000-8000-000000000004',
  'Mara’s harbor photograph and testimony suggest examining Gate Transit Log 17-B.'
from public.memories m where m.id = 'de000000-0000-4000-8000-0000000000b4'
on conflict (id) do update set relationship_note = excluded.relationship_note;
