import type { HistoricalLocation } from '../human-legacy/types'
import type { AIEchoConnection, AIEchoResult, ConnectionCategory, FallbackReason } from './types'

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
      signal: AbortSignal.timeout(55_000),
    })

    if (response.ok) {
      const data = await response.json()
      if (Array.isArray(data?.connections)) {
        const modelName = data.model ? String(data.model).toUpperCase() : '3.8-FLASH'
        return {
          memoryId: memory.id,
          connections: data.connections as AIEchoConnection[],
          isAIGenerated: true,
          sourceLabel: `GEMINI ${modelName} · GROUNDED ARCHIVAL ANALYSIS`,
          modelUsed: data.model || 'gemini-3.8-flash',
        }
      }
    }

    // Specific error classification based on response status and error payload
    const errData = await response.json().catch(() => null)
    let fallbackReason: FallbackReason = 'GEMINI_SERVER_ERROR'
    let sourceLabel = `RULE-BASED DETERMINISTIC FALLBACK · ERROR (${response.status})`
    let errorNotice = errData?.error || `Server responded with status ${response.status}.`

    if (errData?.code === 'API_KEY_MISSING') {
      fallbackReason = 'API_KEY_MISSING'
      sourceLabel = 'RULE-BASED DETERMINISTIC FALLBACK · GEMINI API KEY MISSING'
      errorNotice = errData?.error || 'GEMINI_API_KEY is not configured in Vercel environment variables for this deployment.'
    } else if (errData?.code === 'MODEL_OVERLOADED' || (response.status === 503 && !errData?.code)) {
      fallbackReason = 'MODEL_OVERLOADED'
      sourceLabel = 'RULE-BASED DETERMINISTIC FALLBACK · GOOGLE SERVICE OVERLOADED (503)'
      errorNotice = errData?.error || 'Google Gemini service is temporarily overloaded (503). Please retry in a few moments.'
    } else if (response.status === 404 || errData?.code === 'MODEL_UNAVAILABLE') {
      fallbackReason = 'MODEL_UNAVAILABLE'
      sourceLabel = `RULE-BASED DETERMINISTIC FALLBACK · MODEL UNAVAILABLE (404)`
      errorNotice = errData?.error || `Configured model "${errData?.model || 'gemini-3.8-flash'}" was not recognized by Google API (404).`
    } else if (response.status === 401 || response.status === 403 || errData?.code === 'INVALID_API_KEY') {
      fallbackReason = 'INVALID_API_KEY'
      sourceLabel = `RULE-BASED DETERMINISTIC FALLBACK · AUTH REJECTED (${response.status})`
      errorNotice = errData?.error || `Gemini API key was rejected (${response.status}). Verify key permissions in Google Cloud / AI Studio.`
    } else if (response.status === 429 || errData?.code === 'RATE_LIMIT_EXCEEDED') {
      fallbackReason = 'RATE_LIMIT_EXCEEDED'
      sourceLabel = 'RULE-BASED DETERMINISTIC FALLBACK · RATE LIMIT (429)'
      errorNotice = errData?.error || 'Gemini API rate limit or quota exceeded (429). Please retry shortly.'
    } else if (response.status >= 500) {
      fallbackReason = 'GEMINI_SERVER_ERROR'
      sourceLabel = `RULE-BASED DETERMINISTIC FALLBACK · SERVER ERROR (${response.status})`
      errorNotice = errData?.error || `Gemini server returned status ${response.status}.`
    }

    const fallbackConnections = generateDeterministicFallback(memory, archiveLocations)
    return {
      memoryId: memory.id,
      connections: fallbackConnections,
      isAIGenerated: false,
      sourceLabel,
      modelUsed: errData?.model,
      fallbackReason,
      errorNotice,
    }
  } catch (cause) {
    const isTimeout = cause instanceof Error && cause.name === 'TimeoutError'
    const fallbackConnections = generateDeterministicFallback(memory, archiveLocations)
    return {
      memoryId: memory.id,
      connections: fallbackConnections,
      isAIGenerated: false,
      sourceLabel: isTimeout
        ? 'RULE-BASED DETERMINISTIC FALLBACK · REQUEST TIMEOUT'
        : 'RULE-BASED DETERMINISTIC FALLBACK · NETWORK FAILURE',
      fallbackReason: 'NETWORK_FAILURE',
      errorNotice: isTimeout
        ? 'Request to /api/echoes timed out (55s). Using rule-based fallback.'
        : cause instanceof Error ? cause.message : 'Network failure reaching /api/echoes',
    }
  }
}
