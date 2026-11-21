import type { HistoricalLocation } from '../human-legacy/types'
import type { AIEchoConnection, AIEchoResult, ConnectionCategory } from './types'

export interface MemoryQueryInput {
  id: string
  personId: string
  title: string
  description: string
  tags: string[]
  ancestorName?: string
  date?: string
}

export function generateDeterministicFallback(
  memory: MemoryQueryInput,
  archiveLocations: HistoricalLocation[],
): AIEchoConnection[] {
  const matches: AIEchoConnection[] = []
  const memoryTags = new Set(memory.tags.map((t) => t.toLowerCase()))

  for (const location of archiveLocations) {
    for (const record of location.records) {
      const recordTags = new Set([...location.tags, ...(record.tags || [])].map((t) => t.toLowerCase()))
      const sharedTags = [...memoryTags].filter((t) => recordTags.has(t))

      // Also check simple word overlap between memory description and record content/title
      const memoryWords = memory.description.toLowerCase().split(/\W+/).filter((w) => w.length > 4)
      const recordText = (record.title + ' ' + record.content).toLowerCase()
      const textOverlap = memoryWords.filter((w) => recordText.includes(w))

      if (sharedTags.length > 0 || textOverlap.length > 1) {
        let category: ConnectionCategory = 'ARCHIVAL_OVERLAP'
        if (record.origin_kind === 'testimony' || record.slug.includes('letter')) {
          category = 'EYEWITNESS_CONTRADICTION'
        } else if (record.slug.includes('log') || record.slug.includes('alarm')) {
          category = 'CHRONOLOGICAL_CORRELATION'
        } else if (sharedTags.includes('surface') || sharedTags.includes('ocean')) {
          category = 'THEMATIC_ECHO'
        }

        matches.push({
          id: `fallback-${memory.id}-${record.id}`,
          historicalRecordId: record.id,
          historicalRecordSlug: record.slug,
          historicalRecordTitle: record.title,
          historicalLocationId: location.id,
          historicalLocationSlug: location.slug,
          historicalLocationName: location.name,
          provenance: record.provenance,
          connectionCategory: category,
          connectionSummary: `Historical record shares references to ${sharedTags.concat(textOverlap.slice(0, 2)).join(', ') || 'archival context'}.`,
          supportingExcerpt: record.content.length > 140 ? `${record.content.slice(0, 140)}…` : record.content,
          thematicAnchor: sharedTags[0] || 'Historical Context',
          chronologicalAlignment: record.event_at ? `Archival timestamp: ${new Date(record.event_at).toLocaleDateString()}` : 'Date unconfirmed',
          uncertaintyDisclosure: 'Rule-based match from tag overlap. This has not been evaluated by Gemini AI and does not prove the records describe the same event.',
          isAIGenerated: false,
        })
      }
    }
  }

  return matches.slice(0, 3)
}

export async function discoverMemoryEchoes(
  memory: MemoryQueryInput,
  archiveLocations: HistoricalLocation[],
  isDemo = false,
  authToken?: string,
): Promise<AIEchoResult> {
  let token = authToken
  if (!token && !isDemo && typeof window !== 'undefined') {
    try {
      const { supabase } = await import('../../lib/supabase/client')
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        token = data.session?.access_token
      }
    } catch {
      // Proceed unauthenticated (demo fallback)
    }
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch('/api/echoes', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        memoryId: memory.id,
        isDemo,
      }),
      signal: AbortSignal.timeout(28_000),
    })

    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data?.connections)) {
        return {
          memoryId: memory.id,
          connections: data.connections as AIEchoConnection[],
          isAIGenerated: true,
          sourceLabel: `GEMINI ${data.model ? data.model.toUpperCase() : 'AI'} · GROUNDED ARCHIVAL ANALYSIS`,
          modelUsed: data.model,
        }
      }
    }

    // Handle 503 or 404 (Gemini not configured or endpoint unavailable)
    const errData = await response.json().catch(() => null)
    const errorNotice = errData?.error || 'Gemini serverless endpoint not active. Using deterministic fallback.'

    const fallbackConnections = generateDeterministicFallback(memory, archiveLocations)
    return {
      memoryId: memory.id,
      connections: fallbackConnections,
      isAIGenerated: false,
      sourceLabel: 'RULE-BASED DETERMINISTIC FALLBACK · GEMINI NOT CONFIGURED',
      errorNotice,
    }
  } catch (cause) {
    const fallbackConnections = generateDeterministicFallback(memory, archiveLocations)
    return {
      memoryId: memory.id,
      connections: fallbackConnections,
      isAIGenerated: false,
      sourceLabel: 'RULE-BASED DETERMINISTIC FALLBACK · OFFLINE',
      errorNotice: cause instanceof Error ? cause.message : 'Network failure',
    }
  }
}
