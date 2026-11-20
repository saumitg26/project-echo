import type { HistoricalLocation } from './types'

const cityImage = 'https://images.unsplash.com/photo-1653207771914-f7d37303755c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1600'
const oceanImage = 'https://images.unsplash.com/photo-1747182922993-9c7dde01c97f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1600'
const portraitImage = 'https://images.unsplash.com/photo-1772981277378-f2c23ea6f156?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=700'

const createdAt = '2087-01-01T00:00:00.000Z'
const record = (
  id: string, locationId: string, slug: string, title: string, eventAt: string,
  content: string, provenance: string, origin: 'original' | 'testimony' | 'reconstruction' = 'original',
) => ({
  id, location_id: locationId, slug, title, content, event_at: eventAt,
  record_classification: origin === 'testimony' ? 'written_testimony' as const : 'system_log' as const,
  origin_kind: origin, provenance, tags: [], media_url: null,
  verification_status: origin === 'reconstruction' ? 'interpretive' as const : 'corroborated' as const,
  is_published: true, created_at: createdAt,
})

export const fallbackHistoricalLocations: HistoricalLocation[] = [
  {
    id: 'a1000000-0000-4000-8000-000000000001', slug: 'boston-harbor', name: 'BOSTON HARBOR',
    short_description: 'The final civilian ships departed beneath a sky obscured by ash. Public records describe an orderly evacuation; witnesses remember sealed gates and a priority convoy.',
    latitude: 42.3601, longitude: -71.0589, map_x: 28, map_y: 38, event_title: 'LAST DEPARTURE',
    event_date: '2058-03-22', image_url: cityImage, classification: 'restricted_archive',
    tags: ['boston', 'harbor', 'evacuation', 'convoy'], is_published: true, created_at: createdAt,
    records: [
      record('b1000000-0000-4000-8000-000000000004', 'a1000000-0000-4000-8000-000000000001', 'gate-transit-log-17-b', 'Gate Transit Log 17-B', '2058-03-22T04:51:00Z', 'DIRECTORATE PRIORITY · 17 VEHICLES · CLEARANCE: ORPHEUS. North Bridge gate opened fifty-one minutes before the public warning.', 'Recovered North Bridge access controller · checksum partially verified'),
      record('b1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001', 'boston-harbor-alarms', 'Harbor Alarms Begin', '2058-03-22T05:10:00Z', 'Emergency tones were recorded across the harbor district before the Directorate bulletin.', 'Recovered municipal alarm index · Archive 41-B'),
      record('b1000000-0000-4000-8000-000000000003', 'a1000000-0000-4000-8000-000000000001', 'elena-voss-letter', 'Elena Voss’s Letter', '2058-03-22T05:17:00Z', '“The convoy had already gone. I watched their lights cross the bridge before the sirens.”', 'Voss family archive · recovered personal letter', 'testimony'),
      record('b1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001', 'directorate-evacuation-bulletin', 'Directorate Bulletin', '2058-03-22T05:42:00Z', '“Evacuation commenced at first warning. All citizens were given equal passage.”', 'Public Transmission 6A · Directorate broadcast archive'),
      record('b1000000-0000-4000-8000-000000000005', 'a1000000-0000-4000-8000-000000000001', 'north-gate-sealed', 'North Gate Sealed', '2058-03-22T06:18:00Z', 'The surviving access log records the North Gate entering permanent lockdown.', 'Recovered municipal access log · Archive 41-B'),
    ],
  },
  {
    id: 'a1000000-0000-4000-8000-000000000002', slug: 'svalbard-seed-vault', name: 'SVALBARD',
    short_description: 'Botanists moved the last viable surface seed libraries into deep storage. Elena Voss appears in a damaged personnel manifest recovered in 2081.',
    latitude: 78.2232, longitude: 15.6469, map_x: 52, map_y: 20, event_title: 'SEED VAULT',
    event_date: '2057-11-02', image_url: oceanImage, classification: 'recovered_site',
    tags: ['svalbard', 'seeds', 'surface', 'orpheus'], is_published: true, created_at: createdAt,
    records: [
      record('b1000000-0000-4000-8000-000000000101', 'a1000000-0000-4000-8000-000000000002', 'svalbard-climate-failure', 'Vault Climate Failure', '2057-11-02T18:06:00Z', 'A thermal-control fault threatened the surviving botanical libraries.', 'Svalbard environmental controller · damaged export'),
      record('b1000000-0000-4000-8000-000000000102', 'a1000000-0000-4000-8000-000000000002', 'orpheus-convoy-arrives', 'ORPHEUS Convoy Arrives', '2057-11-02T19:12:00Z', 'A transport convoy using ORPHEUS clearance entered the lower vault.', 'Lower-vault gate ledger · partial checksum match'),
      record('b1000000-0000-4000-8000-000000000104', 'a1000000-0000-4000-8000-000000000002', 'svalbard-inventory-sealed', 'Final Inventory Sealed', '2057-11-02T21:40:00Z', 'The surviving inventory closes with several cases lacking a destination entry.', 'Botanical library inventory · final surviving page'),
    ],
  },
  {
    id: 'a1000000-0000-4000-8000-000000000003', slug: 'kyoto-final-bloom', name: 'KYOTO',
    short_description: 'Citizens documented the last public cherry blossom season. These images became contraband after natural-world media was restricted underground.',
    latitude: 35.0116, longitude: 135.7681, map_x: 79, map_y: 45, event_title: 'FINAL BLOOM',
    event_date: '2056-04-11', image_url: portraitImage, classification: 'civilization_archive',
    tags: ['kyoto', 'flowers', 'surface', 'photograph'], is_published: true, created_at: createdAt,
    records: [
      record('b1000000-0000-4000-8000-000000000201', 'a1000000-0000-4000-8000-000000000003', 'kyoto-gardens-opened', 'Gardens Opened', '2056-04-11T06:30:00Z', 'Public gardens opened before dawn as citizens arrived to document the bloom.', 'Collected civic accounts · identities withheld', 'testimony'),
      record('b1000000-0000-4000-8000-000000000202', 'a1000000-0000-4000-8000-000000000003', 'kyoto-public-archive-captured', 'Public Archive Captured', '2056-04-11T12:14:00Z', 'A distributed set of photographs preserved the final public blossom season.', 'Kyoto civic image archive · media index'),
      record('b1000000-0000-4000-8000-000000000203', 'a1000000-0000-4000-8000-000000000003', 'kyoto-preservation-order', 'Preservation Order Issued', '2056-04-11T20:02:00Z', 'The preservation order collected natural-world media that later became restricted.', 'Directorate Cultural Preservation Order K-11'),
    ],
  },
  {
    id: 'a1000000-0000-4000-8000-000000000004', slug: 'patagonia-southern-signal', name: 'PATAGONIA',
    short_description: 'A remote weather station broadcast ocean and wind recordings for three years after evacuation. The origin of its final human voice remains unknown.',
    latitude: -50.9423, longitude: -73.4068, map_x: 35, map_y: 76, event_title: 'SOUTHERN SIGNAL',
    event_date: '2055-06-14', image_url: oceanImage, classification: 'recovered_site',
    tags: ['patagonia', 'ocean', 'surface', 'signal'], is_published: true, created_at: createdAt,
    records: [
      record('b1000000-0000-4000-8000-000000000301', 'a1000000-0000-4000-8000-000000000004', 'patagonia-telemetry-normal', 'Weather Telemetry Normal', '2055-06-14T03:20:00Z', 'Wind and ocean telemetry remained within the station’s expected range.', 'Southern Station 4 telemetry packet'),
      record('b1000000-0000-4000-8000-000000000302', 'a1000000-0000-4000-8000-000000000004', 'patagonia-human-voice', 'Human Voice Detected', '2055-06-14T03:24:00Z', 'A voice appears beneath the wind channel for eleven seconds. The speaker and words remain unresolved.', 'Southern Station 4 final recording · degraded'),
      record('b1000000-0000-4000-8000-000000000303', 'a1000000-0000-4000-8000-000000000004', 'patagonia-transmission-ends', 'Transmission Ends', '2055-06-14T03:26:00Z', 'The carrier stopped. No later packet from the station has been authenticated.', 'Hollow relay intake log · packet loss 38%'),
    ],
  },
]

