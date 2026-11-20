import { isSupabaseConfigured, requireSupabase } from '../../lib/supabase/client'
import type { HistoricalLocationRow, HistoricalRecordRow } from '../../lib/supabase/database.types'
import type { ContributionType, HistoricalContributionRow } from '../../lib/supabase/database.types'
import type { HistoricalLocation } from './types'

export { isSupabaseConfigured }

export async function getHistoricalArchive(): Promise<HistoricalLocation[]> {
  const client = requireSupabase()
  const locationsResult = await client.from('historical_locations').select('*').order('event_date', { ascending: false })
  if (locationsResult.error) throw new Error(`Archive retrieval failed: ${locationsResult.error.message}`)
  const locations = (locationsResult.data ?? []) as HistoricalLocationRow[]
  if (locations.length === 0) return []

  const recordsResult = await client.from('historical_records').select('*')
    .in('location_id', locations.map((location) => location.id)).order('event_at', { ascending: true })
  if (recordsResult.error) throw new Error(`Historical records failed: ${recordsResult.error.message}`)
  const records = (recordsResult.data ?? []) as HistoricalRecordRow[]

  return locations.map((location) => ({
    ...location,
    records: records.filter((record) => record.location_id === location.id),
  }))
}

const CONTRIBUTION_BUCKET = 'historical-contributions'
const CONTRIBUTION_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/webm': 'weba', 'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
}

export async function createHistoricalContribution(input: {
  locationId: string
  contributionType: ContributionType
  title: string
  description: string
  eventDate?: string
  file?: File | null
}): Promise<HistoricalContributionRow> {
  const client = requireSupabase()
  const { data: sessionData } = await client.auth.getSession()
  const contributorId = sessionData.session?.user.id
  if (!contributorId) throw new Error('Sign in before submitting a recovered memory.')

  const created = await client.from('historical_contributions').insert({
    location_id: input.locationId,
    contributor_id: contributorId,
    contribution_type: input.contributionType,
    title: input.title,
    description: input.description,
    event_date: input.eventDate || undefined,
  }).select().single()
  if (created.error || !created.data) throw new Error(`Contribution could not be preserved: ${created.error?.message ?? 'unknown error'}`)
  const contribution = created.data as HistoricalContributionRow
  if (!input.file) return contribution

  const extension = CONTRIBUTION_TYPES[input.file.type]
  if (!extension) {
    await client.from('historical_contributions').delete().eq('id', contribution.id)
    throw new Error('Choose a JPEG, PNG, WebP, GIF, supported audio file, or PDF.')
  }
  if (input.file.size <= 0 || input.file.size > 25 * 1024 * 1024) {
    await client.from('historical_contributions').delete().eq('id', contribution.id)
    throw new Error('Contribution files must be between 1 byte and 25 MB.')
  }

  const assetId = crypto.randomUUID()
  const storagePath = `contributors/${contributorId}/contributions/${contribution.id}/${assetId}.${extension}`
  const upload = await client.storage.from(CONTRIBUTION_BUCKET).upload(storagePath, input.file, {
    contentType: input.file.type, upsert: false,
  })
  if (upload.error) {
    await client.from('historical_contributions').delete().eq('id', contribution.id)
    throw new Error(`Private media upload failed: ${upload.error.message}`)
  }

  const media = await client.from('historical_contribution_media').insert({
    contribution_id: contribution.id, contributor_id: contributorId, storage_path: storagePath,
    mime_type: input.file.type, file_size_bytes: input.file.size,
    original_filename: input.file.name.slice(0, 255),
  })
  if (media.error) {
    await client.storage.from(CONTRIBUTION_BUCKET).remove([storagePath])
    await client.from('historical_contributions').delete().eq('id', contribution.id)
    throw new Error(`Contribution media record failed: ${media.error.message}`)
  }
  return contribution
}

export async function getMyHistoricalContributions(locationId?: string): Promise<HistoricalContributionRow[]> {
  const client = requireSupabase()
  let query = client.from('historical_contributions').select('*').order('created_at', { ascending: false })
  if (locationId) query = query.eq('location_id', locationId)
  const result = await query
  if (result.error) throw new Error(`Pending submissions could not be loaded: ${result.error.message}`)
  return (result.data ?? []) as HistoricalContributionRow[]
}

