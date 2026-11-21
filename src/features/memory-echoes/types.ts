export type ConnectionCategory =
  | 'EYEWITNESS_CONTRADICTION'
  | 'CHRONOLOGICAL_CORRELATION'
  | 'THEMATIC_ECHO'
  | 'GEOGRAPHIC_PROXIMITY'
  | 'ARCHIVAL_OVERLAP'

export interface AIEchoConnection {
  id: string
  historicalRecordId: string
  historicalRecordSlug: string
  historicalRecordTitle: string
  historicalLocationId: string
  historicalLocationSlug: string
  historicalLocationName: string
  provenance?: string
  connectionCategory: ConnectionCategory
  connectionSummary: string
  supportingExcerpt: string
  thematicAnchor?: string
  chronologicalAlignment?: string
  uncertaintyDisclosure: string
  isAIGenerated: boolean
}

export type FallbackReason =
  | 'API_KEY_MISSING'
  | 'MODEL_UNAVAILABLE'
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'GEMINI_SERVER_ERROR'
  | 'NETWORK_FAILURE'
  | 'EMPTY_RESPONSE'
  | 'PARSE_ERROR'

export interface AIEchoResult {
  memoryId: string
  connections: AIEchoConnection[]
  isAIGenerated: boolean
  sourceLabel: string
  modelUsed?: string
  fallbackReason?: FallbackReason
  errorNotice?: string
}
