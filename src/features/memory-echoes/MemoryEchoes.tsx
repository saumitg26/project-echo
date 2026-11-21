import { useState, useEffect, useTransition } from 'react'
import type { HistoricalLocation } from '../human-legacy/types'
import { fallbackHistoricalLocations } from '../human-legacy/data'
import { getHistoricalArchive, isSupabaseConfigured } from '../human-legacy/api'
import { discoverMemoryEchoes, type MemoryQueryInput } from './api'
import type { AIEchoConnection, AIEchoResult } from './types'

export interface MemoryEchoesProps {
  go: (s: 'vault' | 'family' | 'room' | 'earth' | 'echoes' | 'reconstruction' | 'capsule') => void
  openHumanLegacy: (locationSlug: string, recordSlug?: string) => void
  memories: Array<{
    id: string
    personId: string
    title: string
    description: string
    type: string
    createdAt: string
    tags: string[]
  }>
  familyMembers?: Array<{
    id: string
    name: string
  }>
  isPrivateArchive?: boolean
}

function EchoIcon({ name }: { name: 'spark' | 'arrow' | 'archive' | 'record' }) {
  if (name === 'spark') {
    return (
      <svg aria-hidden="true" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l1.8 7.2L21 12l-7.2 2.3L12 22l-2.3-7.7L3 12l6.7-2.8z" />
      </svg>
    )
  }
  if (name === 'arrow') {
    return (
      <svg aria-hidden="true" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M14 6l6 6-6 6" />
      </svg>
    )
  }
  if (name === 'record') {
    return (
      <svg aria-hidden="true" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16v13H4zM3 3h18v4H3zM9 11h6" />
    </svg>
  )
}

const CATEGORY_LABELS: Record<string, { label: string; tone: string }> = {
  EYEWITNESS_CONTRADICTION: { label: 'EYEWITNESS CONTRADICTION', tone: '#e89f67' },
  CHRONOLOGICAL_CORRELATION: { label: 'CHRONOLOGICAL CORRELATION', tone: '#75dce7' },
  THEMATIC_ECHO: { label: 'THEMATIC ECHO', tone: '#c39ee3' },
  GEOGRAPHIC_PROXIMITY: { label: 'GEOGRAPHIC PROXIMITY', tone: '#75dce7' },
  ARCHIVAL_OVERLAP: { label: 'ARCHIVAL OVERLAP', tone: '#8ba2a6' },
}

export function MemoryEchoes({
  go,
  openHumanLegacy,
  memories,
  familyMembers = [],
  isPrivateArchive = false,
}: MemoryEchoesProps) {
  const [archiveLocations, setArchiveLocations] = useState<HistoricalLocation[]>(fallbackHistoricalLocations)
  const [archiveSource, setArchiveSource] = useState<'live' | 'fallback'>(isSupabaseConfigured ? 'live' : 'fallback')

  // Selected memory for analysis
  const [selectedMemoryId, setSelectedMemoryId] = useState<string>(() => memories[0]?.id || '')
  const selectedMemory = memories.find((m) => m.id === selectedMemoryId) ?? memories[0]

  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState<AIEchoResult | null>(null)
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [hasRunAnalysis, setHasRunAnalysis] = useState(false)
  const [, startTransition] = useTransition()

  // Load published historical archive
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let mounted = true
    void getHistoricalArchive()
      .then((items) => {
        if (mounted && items.length > 0) {
          setArchiveLocations(items)
          setArchiveSource('live')
        }
      })
      .catch(() => {
        if (mounted) {
          setArchiveLocations(fallbackHistoricalLocations)
          setArchiveSource('fallback')
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  // Auto-select first memory if current becomes invalid
  useEffect(() => {
    if (memories.length > 0 && !memories.some((m) => m.id === selectedMemoryId)) {
      setSelectedMemoryId(memories[0].id)
      setAnalysisResult(null)
      setSelectedConnectionId(null)
      setHasRunAnalysis(false)
    }
  }, [memories, selectedMemoryId])

  const ancestorName = selectedMemory
    ? familyMembers.find((p) => p.id === selectedMemory.personId)?.name ?? 'Preserved Ancestor'
    : 'Unknown Ancestor'

  // Trigger Gemini AI analysis
  const handleDiscover = async () => {
    if (!selectedMemory || analyzing) return
    setAnalyzing(true)

    const queryInput: MemoryQueryInput = {
      id: selectedMemory.id,
      personId: selectedMemory.personId,
      title: selectedMemory.title,
      description: selectedMemory.description,
      tags: selectedMemory.tags,
      ancestorName,
      date: selectedMemory.createdAt,
    }

    try {
      const result = await discoverMemoryEchoes(
        queryInput,
        archiveLocations,
        !isPrivateArchive || selectedMemory.id.startsWith('seed-'),
      )
      startTransition(() => {
        setAnalysisResult(result)
        setSelectedConnectionId(result.connections[0]?.id || null)
        setHasRunAnalysis(true)
      })
    } finally {
      setAnalyzing(false)
    }
  }

  // Active connection inspected on the right
  const activeConnection: AIEchoConnection | undefined =
    analysisResult?.connections.find((c) => c.id === selectedConnectionId) ??
    analysisResult?.connections[0]

  return (
    <section className="inner-screen echoes-screen">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <span><button onClick={() => go('vault')}>Memory Vault</button></span>
        <span><i>/</i><b>Memory Echoes</b></span>
      </nav>

      <div className="section-heading compact">
        <div>
          <div className="kicker">
            <span />
            AI ARCHIVAL DISCOVERY · {archiveSource === 'live' ? 'DATABASE RECORDS' : 'CANONICAL ARCHIVE'}
          </div>
          <h2>Memory <em>Echoes</em></h2>
          <p>Cross-reference personal family memories against verified Human Legacy records using Gemini AI.</p>
        </div>
        <div className="case-status">
          <span>{analysisResult ? analysisResult.connections.length : 0}</span> GROUNDED CONNECTIONS
        </div>
      </div>

      {/* Memory Selection Toolbar */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ font: "9px 'DM Mono'", letterSpacing: '0.1em', color: '#8ba2a6', display: 'flex', alignItems: 'center', gap: '8px' }}>
          SELECT PRESERVED MEMORY:
          <select
            value={selectedMemory?.id || ''}
            onChange={(e) => {
              setSelectedMemoryId(e.target.value)
              setAnalysisResult(null)
              setSelectedConnectionId(null)
              setHasRunAnalysis(false)
            }}
            disabled={analyzing}
            style={{
              background: '#0d161a',
              color: '#d4ecee',
              border: '1px solid #283d44',
              padding: '6px 12px',
              font: "11px 'DM Mono'",
            }}
          >
            {memories.map((m) => {
              const person = familyMembers.find((p) => p.id === m.personId)?.name || 'Ancestor'
              return (
                <option key={m.id} value={m.id}>
                  {person} · {m.title} ({m.type.toUpperCase()})
                </option>
              )
            })}
          </select>
        </label>

        <button
          className="primary"
          onClick={handleDiscover}
          disabled={!selectedMemory || analyzing}
          style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <EchoIcon name="spark" />
          {analyzing ? 'ANALYZING EVIDENCE WITH GEMINI…' : 'DISCOVER CONNECTIONS'}
        </button>

        {analysisResult && (
          <span
            style={{
              font: "8px 'DM Mono'",
              letterSpacing: '0.08em',
              padding: '4px 8px',
              border: `1px solid ${analysisResult.isAIGenerated ? '#75dce7' : '#d49b56'}`,
              color: analysisResult.isAIGenerated ? '#75dce7' : '#e8af6e',
            }}
          >
            {analysisResult.sourceLabel}
          </span>
        )}
      </div>

      <div className="echo-layout">
        {/* Left Column: Discovered Connections */}
        <div className="echo-list">
          {selectedMemory && (
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #23373e',
                background: '#0d181d',
              }}
            >
              <div style={{ font: "8px 'DM Mono'", color: '#6ba7ac', letterSpacing: '0.08em' }}>
                CURRENT MEMORY · {ancestorName.toUpperCase()} ({selectedMemory.type.toUpperCase()})
              </div>
              <h4 style={{ margin: '4px 0 6px', color: '#e8f5f6', fontSize: '15px', fontWeight: 400 }}>
                {selectedMemory.title}
              </h4>
              <p style={{ margin: 0, fontSize: '10px', color: '#7a8e93', lineHeight: 1.5 }}>
                {selectedMemory.description}
              </p>
            </div>
          )}

          {analyzing ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#75dce7' }}>
              <div className="retrieval-core" style={{ margin: '0 auto 16px', width: '36px', height: '36px' }}>
                <i /><span />
              </div>
              <div style={{ font: "10px 'DM Mono'", letterSpacing: '0.12em', color: '#75dce7' }}>
                EXAMINING HISTORICAL ARCHIVE WITH GEMINI…
              </div>
              <p style={{ fontSize: '10px', color: '#6e8084', marginTop: '6px' }}>
                Cross-referencing timeline, location telemetry, and public records for grounded corroboration.
              </p>
            </div>
          ) : analysisResult && analysisResult.connections.length > 0 ? (
            analysisResult.connections.map((conn, idx) => {
              const meta = CATEGORY_LABELS[conn.connectionCategory] || { label: conn.connectionCategory, tone: '#75dce7' }
              const isSelected = activeConnection?.id === conn.id
              return (
                <button
                  key={conn.id}
                  className={isSelected ? 'active' : ''}
                  onClick={() => setSelectedConnectionId(conn.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="echo-number">0{idx + 1}</span>
                  <div>
                    <small style={{ color: meta.tone, letterSpacing: '0.08em' }}>
                      {meta.label} · {conn.historicalLocationName}
                    </small>
                    <b>{conn.historicalRecordTitle}</b>
                    <p>
                      <em>“{conn.supportingExcerpt}”</em>
                    </p>
                    <div>
                      <i style={{ borderColor: meta.tone, color: meta.tone }}>
                        {conn.thematicAnchor || 'Historical Link'}
                      </i>
                    </div>
                  </div>
                  <strong>
                    <small style={{ color: meta.tone }}>
                      {conn.isAIGenerated ? 'AI GROUNDED' : 'RULE MATCH'}
                    </small>
                  </strong>
                </button>
              )
            })
          ) : hasRunAnalysis ? (
            <div className="echo-empty">
              <EchoIcon name="spark" />
              <h3>No grounded connections discovered</h3>
              <p>Gemini cross-referenced available historical records and found no supported connection for this memory.</p>
              <p style={{ fontSize: '9px', color: '#5b6b6f', marginTop: '8px' }}>
                Try selecting a memory related to Boston, Svalbard, Patagonia, or the evacuation convoy.
              </p>
            </div>
          ) : (
            <div className="echo-empty">
              <EchoIcon name="spark" />
              <h3>Ready for AI Archival Discovery</h3>
              <p>Select a family memory above and click <b>Discover Connections</b> to evaluate links against approved historical records.</p>
            </div>
          )}
        </div>

        {/* Right Column: Connection Inspector */}
        <aside className="echo-inspector">
          {activeConnection ? (
            <>
              <div className="kicker">
                <span />
                {activeConnection.isAIGenerated ? 'GEMINI GROUNDED FINDING' : 'DETERMINISTIC FALLBACK'} · NOT PROVEN FACT
              </div>

              <h3 style={{ margin: '14px 0 10px' }}>{activeConnection.historicalRecordTitle}</h3>

              <div className="echo-line" style={{ marginBottom: '14px' }}>
                <span>{selectedMemory?.title || 'Family Memory'}</span>
                <i />
                <span>{activeConnection.historicalLocationName}</span>
              </div>

              {/* Supporting Archival Quote */}
              <div style={{ background: '#121b20', borderLeft: '2px solid #75dce7', padding: '10px 14px', marginBottom: '14px' }}>
                <div style={{ font: "8px 'DM Mono'", color: '#6ba7ac', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  SUPPORTING ARCHIVAL EXCERPT
                </div>
                <blockquote style={{ margin: 0, font: "italic 11px/1.6 'Playfair Display', serif", color: '#d8ebeb' }}>
                  “{activeConnection.supportingExcerpt}”
                </blockquote>
                {activeConnection.provenance && (
                  <small style={{ display: 'block', marginTop: '6px', font: "8px 'DM Mono'", color: '#6e858a' }}>
                    PROVENANCE: {activeConnection.provenance}
                  </small>
                )}
              </div>

              {/* Connection Summary */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ font: "8px 'DM Mono'", color: '#8ba2a6', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  HISTORICAL CORRELATION
                </div>
                <p style={{ margin: 0, fontSize: '10px', color: '#9bb1b5', lineHeight: 1.6 }}>
                  {activeConnection.connectionSummary}
                </p>
              </div>

              {/* Chronological Alignment */}
              {activeConnection.chronologicalAlignment && (
                <div style={{ marginBottom: '14px', padding: '6px 10px', background: '#0d161a', border: '1px solid #1f2f35' }}>
                  <span style={{ font: "8px 'DM Mono'", color: '#75dce7', letterSpacing: '0.08em' }}>
                    TIMELINE ALIGNMENT:
                  </span>{' '}
                  <span style={{ font: "9px 'DM Mono'", color: '#b9cbce' }}>
                    {activeConnection.chronologicalAlignment}
                  </span>
                </div>
              )}

              {/* Archival Limitation / Uncertainty Caution */}
              <div className="caution" style={{ marginBottom: '16px' }}>
                <b>ARCHIVAL LIMITATION & UNCERTAINTY</b>
                <p>{activeConnection.uncertaintyDisclosure}</p>
              </div>

              <button
                className="primary wide"
                onClick={() =>
                  openHumanLegacy(
                    activeConnection.historicalLocationSlug,
                    activeConnection.historicalRecordSlug,
                  )
                }
              >
                OPEN HISTORICAL RECORD IN HUMAN LEGACY <EchoIcon name="arrow" />
              </button>
            </>
          ) : (
            <div className="locked-discovery">
              <span><EchoIcon name="spark" /></span>
              <h3>Select a connection</h3>
              <p>Discover or select a memory echo on the left to inspect its supporting evidence and archival notes.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
