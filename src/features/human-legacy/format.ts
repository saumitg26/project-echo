import { useEffect, useState } from 'react'
import type { HistoricalLocation, HistoricalRecord } from './types'

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`)).toUpperCase()
}

export function formatTime(timestamp: string | null) {
  if (!timestamp) return 'TIME UNKNOWN'
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
    .format(new Date(timestamp))
}

export function coords(location: HistoricalLocation) {
  if (location.latitude == null || location.longitude == null) return 'COORDINATES LOST'
  return `${Math.abs(location.latitude).toFixed(4)}° ${location.latitude >= 0 ? 'N' : 'S'} · ${Math.abs(location.longitude).toFixed(4)}° ${location.longitude >= 0 ? 'E' : 'W'}`
}

export type RecordKind = 'bulletin' | 'log' | 'testimony' | 'photo' | 'audio' | 'interpretive'

/** How a stored classification is presented. Presentation only; the stored value is never changed. */
export function recordKind(record: HistoricalRecord): { kind: RecordKind; label: string } {
  switch (record.record_classification) {
    case 'public_bulletin': return { kind: 'bulletin', label: 'DIRECTORATE BULLETIN' }
    case 'system_log': return { kind: 'log', label: 'SYSTEM LOG' }
    case 'personnel_manifest': return { kind: 'log', label: 'PERSONNEL MANIFEST' }
    case 'written_testimony': return { kind: 'testimony', label: 'PERSONAL TESTIMONY' }
    case 'photograph': return { kind: 'photo', label: 'PHOTOGRAPHIC EVIDENCE' }
    case 'field_recording': return { kind: 'audio', label: 'FIELD RECORDING' }
    default: return { kind: 'interpretive', label: 'INTERPRETIVE RECONSTRUCTION' }
  }
}

export const VERIFICATION_MEANING: Record<HistoricalRecord['verification_status'], string> = {
  verified: 'Authenticated against an independent source.',
  corroborated: 'Supported by at least one other surviving record.',
  disputed: 'Contradicted by another surviving record.',
  interpretive: 'A reconstruction. Not established fact.',
  unverified: 'Not yet authenticated.',
}

/** Tracks the user's reduced-motion preference and reacts if it changes. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

export function webglAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch { return false }
}
