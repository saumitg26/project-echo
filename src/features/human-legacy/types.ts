import type { HistoricalLocationRow, HistoricalRecordRow } from '../../lib/supabase/database.types'

export type HistoricalRecord = HistoricalRecordRow
export type HistoricalLocation = HistoricalLocationRow & { records: HistoricalRecord[] }
export type ArchiveSource = 'live' | 'fallback'

