import { useState, useEffect } from 'react'
import type { ArtifactKey, MemoryRoomProps } from './types'
import { artifactData } from './data'
import { Scene } from './Scene'
import { FallbackRoom } from './FallbackRoom'

function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

export function MemoryRoom({
  ancestor,
  memories,
  go,
  openHumanLegacy,
}: MemoryRoomProps) {
  const [open, setOpen] = useState<ArtifactKey | null>(null)
  const [selectedFocus, setSelectedFocus] = useState<ArtifactKey | null>(null)
  const [lastExplored, setLastExplored] = useState<ArtifactKey | null>(null)
  const [explored, setExplored] = useState<ArtifactKey[]>([])
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [infoOpen, setInfoOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showMarkers, setShowMarkers] = useState(false)
  const [showHint, setShowHint] = useState(true)

  const [mode, setMode] = useState<'3d' | '2d'>(() => {
    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (prefersReduced || !isWebGLAvailable()) return '2d'
    }
    return '3d'
  })

  // Auto-dismiss interaction hint after 5 seconds
  useEffect(() => {
    const timer = window.setTimeout(() => setShowHint(false), 5000)
    return () => window.clearTimeout(timer)
  }, [])

  const ancestorMemories = memories.filter((m) => m.personId === ancestor.id)
  const keys: ArtifactKey[] = ['photo', 'letter', 'audio', 'keepsake', 'window']

  const openArtifact = (key: ArtifactKey) => {
    setSelectedFocus(key)
    setOpen(key)
    setLastExplored(key)
    setShowHint(false)
    setExplored((current) => (current.includes(key) ? current : [...current, key]))
  }

  const handleCloseArtifact = () => {
    setOpen(null)
    setSelectedFocus(null)
  }

  const complete = explored.length === keys.length

  return (
    <section className="room-screen-fullscreen">
      {/* 3D WebGL Canvas or 2D Archival Fallback */}
      {mode === '3d' ? (
        <Scene
          selected={selectedFocus}
          explored={explored}
          showMarkers={showMarkers}
          onSelect={openArtifact}
          onFirstInteraction={() => setShowHint(false)}
          onWebGLFailure={() => setMode('2d')}
        />
      ) : (
        <FallbackRoom
          explored={explored}
          lastExplored={lastExplored}
          open={open}
          onSelect={openArtifact}
        />
      )}

      {/* ================= COMPACT TOP NAVIGATION OVERLAY ================= */}
      <header className="room-hud-header" role="banner">
        <div className="room-hud-left">
          <button
            className="hud-back-btn"
            onClick={() => go('family')}
            aria-label="Return to Family Constellation"
          >
            ← BACK TO FAMILY
          </button>
          <div className="hud-title-badge">
            <b>PROJECT ECHO</b>
            <i>·</i>
            <span>{ancestor.name.split(' ')[0]}'s Room, <em>2058</em></span>
            <span className="hud-sector-tag">COASTAL SECTOR · 18:42</span>
          </div>
        </div>

        <div className="room-hud-center">
          <div className="hud-system-status">
            <i aria-hidden="true" />
            <span>ARCHIVE LINK STABLE · RESIDENT 7–A</span>
          </div>
        </div>

        <div className="room-hud-right">
          {/* Collapsible Info Button */}
          <button
            className={`hud-icon-btn ${infoOpen ? 'active' : ''}`}
            onClick={() => setInfoOpen(!infoOpen)}
            title="Archival Reconstruction Details & Dossier"
            aria-expanded={infoOpen}
            aria-label="Toggle archive dossier"
          >
            ℹ DOSSIER
          </button>

          {/* Markers Toggle */}
          <button
            className={`hud-icon-btn ${showMarkers ? 'active' : ''}`}
            onClick={() => setShowMarkers(!showMarkers)}
            title="Toggle subtle artifact highlight markers"
            aria-label="Toggle artifact markers"
          >
            {showMarkers ? '● HINTS ON' : '○ HINTS'}
          </button>

          {/* 3D / 2D Toggle */}
          <button
            className="hud-icon-btn mode-btn"
            onClick={() => setMode((m) => (m === '3d' ? '2d' : '3d'))}
            title="Toggle between 3D immersive room and 2D archival view"
            aria-label="Toggle 2D or 3D view"
          >
            {mode === '3d' ? '2D VIEW' : '3D VIEW'}
          </button>
        </div>
      </header>

      {/* ================= FIRST-ENTRY INTERACTION HINT ================= */}
      {showHint && mode === '3d' && !open && (
        <div className="hud-interaction-hint" role="status">
          <span>Click & drag to look around · Click physical objects to inspect</span>
          <button onClick={() => setShowHint(false)} aria-label="Dismiss interaction hint">✕</button>
        </div>
      )}

      {/* ================= COLLAPSIBLE DOSSIER MODAL/PANEL ================= */}
      {infoOpen && (
        <aside className="hud-dossier-panel" role="region" aria-label="Archive Dossier">
          <div className="dossier-header">
            <span>PRESERVATION DIRECTIVE · 2087</span>
            <h3>Mara Voss Living Archive</h3>
            <button onClick={() => setInfoOpen(false)} aria-label="Close dossier">✕</button>
          </div>
          <div className="dossier-body">
            <p className="dossier-lead">
              Preserved coastal residence beneath 1.4km stone. Historical reconstruction confidence: <b>87%</b>.
            </p>
            <div className="dossier-stats">
              <div>
                <small>DISCOVERED</small>
                <b>{explored.length} / {keys.length} MEMORIES</b>
              </div>
              <div>
                <small>CLASSIFICATION</small>
                <b>RECONSTRUCTED LIVING ENVIRONMENT</b>
              </div>
            </div>
            <div className="dossier-legend">
              <span><i className="cyan-dot" /> ORIGINAL LOG</span>
              <span><i className="amber-dot" /> FAMILY TESTIMONY</span>
              <span><i className="white-dot" /> RECONSTRUCTION</span>
            </div>
            <button
              className="secondary wide"
              onClick={() => {
                setInfoOpen(false)
                setArchiveOpen(true)
              }}
            >
              📦 VIEW {ancestorMemories.length} STORED ASSETS
            </button>
          </div>
        </aside>
      )}

      {/* ================= COMPACT EXPANDABLE ARTIFACT DRAWER ================= */}
      <nav
        className={`hud-artifact-drawer ${drawerOpen ? 'expanded' : 'collapsed'}`}
        aria-label="Mara's Memory Artifacts"
      >
        <button
          className="drawer-toggle-bar"
          onClick={() => setDrawerOpen(!drawerOpen)}
          aria-expanded={drawerOpen}
          aria-label={drawerOpen ? 'Collapse memories drawer' : 'Expand memories drawer'}
        >
          <span className="drawer-indicator">
            <i className={`status-circle ${complete ? 'all-done' : ''}`} />
            <b>{explored.length} OF {keys.length} MEMORIES DISCOVERED</b>
          </span>
          <span className="drawer-chevron">{drawerOpen ? '▾ HIDE' : '▴ BROWSE ARTIFACTS'}</span>
        </button>

        {drawerOpen && (
          <div className="drawer-items">
            {keys.map((key) => {
              const item = artifactData[key]
              const isExp = explored.includes(key)
              return (
                <button
                  key={key}
                  className={`drawer-card ${isExp ? 'explored' : ''} ${selectedFocus === key ? 'active' : ''}`}
                  onClick={() => openArtifact(key)}
                  aria-label={`Open ${item.label}: ${item.hint}`}
                >
                  <span className="card-icon">
                    {key === 'photo' && '📷'}
                    {key === 'letter' && '✉️'}
                    {key === 'audio' && '🎙️'}
                    {key === 'keepsake' && '✨'}
                    {key === 'window' && '🌐'}
                  </span>
                  <div className="card-copy">
                    <b>{item.label}</b>
                    <small>{item.hint}</small>
                  </div>
                  <i className="card-badge">{isExp ? '✓' : '→'}</i>
                </button>
              )
            })}
          </div>
        )}
      </nav>

      {/* ================= MEMORY OBJECT INSPECTION MODAL ================= */}
      {open && (
        <MemoryObjectModal
          objectKey={open}
          go={go}
          openHumanLegacy={openHumanLegacy}
          onClose={handleCloseArtifact}
        />
      )}

      {/* ================= STORED ARCHIVE OBJECTS MODAL ================= */}
      {archiveOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && setArchiveOpen(false)}
        >
          <div className="modal large" role="dialog" aria-modal="true" aria-label={`${ancestor.name}'s archive`}>
            <div className="modal-header">
              <span>ARCHIVE OBJECTS</span>
              <b>{ancestor.name}'s archive</b>
              <button onClick={() => setArchiveOpen(false)} aria-label="Close archive">
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="object-list">
                {ancestorMemories.map((memory) => (
                  <article key={memory.id}>
                    <div>
                      {memory.type === 'image' && memory.dataUrl ? (
                        <img src={memory.dataUrl} alt="" />
                      ) : (
                        <span style={{ fontSize: '22px' }}>📄</span>
                      )}
                    </div>
                    <span>
                      <small>
                        {memory.type.toUpperCase()} · {new Date(memory.createdAt).getFullYear()}
                      </small>
                      <b>{memory.title}</b>
                      <p>{memory.description}</p>
                    </span>
                    {memory.type === 'audio' && memory.dataUrl?.startsWith('data:audio') && (
                      <audio controls src={memory.dataUrl} />
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= COMPLETION BANNER ================= */}
      {complete && !open && (
        <div className="memory-complete" role="status">
          <span>✨</span>
          <div>
            <div className="kicker">MARA’S STORY · PRIMARY MEMORIES EXPLORED</div>
            <h3>You found what she wanted Lia to remember.</h3>
            <p>
              The room remains open. Follow the window memory into the Human Legacy archive, or return to the family constellation.
            </p>
          </div>
          <button
            className="primary"
            onClick={() => openHumanLegacy('boston-harbor', 'gate-transit-log-17-b')}
          >
            FOLLOW THE HARBOR EVIDENCE →
          </button>
          <button className="text-button" onClick={() => go('family')}>
            RETURN TO FAMILY
          </button>
        </div>
      )}
    </section>
  )
}

/**
 * Detailed modal display for each of the five artifacts.
 */
function MemoryObjectModal({
  objectKey,
  openHumanLegacy,
  onClose,
}: {
  objectKey: ArtifactKey
  go: (s: 'vault' | 'family' | 'room' | 'earth' | 'echoes' | 'reconstruction' | 'capsule') => void
  openHumanLegacy: (locationSlug: string, recordSlug?: string) => void
  onClose: () => void
}) {
  const item = artifactData[objectKey]

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="modal-backdrop memory-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal large memory-modal"
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >
        <div className="modal-header">
          <span>MARA VOSS · LIVING MEMORY</span>
          <b>{item.title}</b>
          <button onClick={onClose} aria-label={`Close ${item.title}`}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className={`memory-object memory-object-${objectKey}`}>
            {/* 1. PHOTO */}
            {objectKey === 'photo' && (
              <>
                <div className="polaroid">
                  <img
                    src={item.image}
                    alt="Fabricated demo photograph representing Mara Voss with her family"
                  />
                  <span>18 APR 2041 · VOSS FAMILY HOME</span>
                </div>
                <div className="object-story">
                  <div className="kicker">{item.meta}</div>
                  <h3>
                    Before Mara could remember <em>the sky.</em>
                  </h3>
                  <p>{item.text}</p>
                  <div className="archive-context">
                    <b>CURATOR’S NOTE</b>
                    <p>
                      This fabricated demo image represents a photograph Lia preserved with Mara’s effects. The people shown are illustrative, not real historical subjects.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* 2. LETTER */}
            {objectKey === 'letter' && (
              <>
                <div className="letter-sheet">
                  <small>22 March 2058 · 05:29</small>
                  <p>To whoever finds this,</p>
                  <p>
                    They moved the departure forward. The public bulletin says weather, but we heard the harbor alarms before dawn.
                  </p>
                  <p>
                    Mother put my blue coat by the door. She says we are going to see the trains. I don’t think that is true.
                  </p>
                  <b>— Mara Voss, age 20</b>
                </div>
                <div className="object-story">
                  <div className="kicker">{item.meta}</div>
                  <h3>
                    The letter Mara <em>hid.</em>
                  </h3>
                  <p>{item.text}</p>
                  <div className="archive-context">
                    <b>RECOVERY</b>
                    <p>
                      Fictional demo record: found inside Elena Voss’s cookbook in 2080. The narrative connects to the Boston Harbor evacuation case.
                    </p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => openHumanLegacy('boston-harbor', 'elena-voss-letter')}
                  >
                    OPEN HUMAN LEGACY RECORD →
                  </button>
                </div>
              </>
            )}

            {/* 3. AUDIO */}
            {objectKey === 'audio' && (
              <>
                <div className="recorder-display">
                  <img
                    src={item.image}
                    alt="Example vintage recording device representing Mara's recorder"
                  />
                  <div className="tape-reels">
                    <i />
                    <i />
                  </div>
                  <span className="demo-stamp">FABRICATED DEMO DEVICE</span>
                </div>
                <div className="object-story">
                  <div className="kicker">{item.meta}</div>
                  <h3>
                    Mara’s voice, in the <em>kitchen.</em>
                  </h3>
                  <p>{item.text}</p>
                  <DemoAudioPlayer />
                  <div className="transcript">
                    <b>TRANSCRIPT · 00:31–00:46</b>
                    <p>
                      “Jonas says they’re weather trucks. They aren’t. No markings, no headlights. Seventeen, maybe eighteen, all going north.”
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* 4. KEEPSAKE */}
            {objectKey === 'keepsake' && (
              <>
                <div className="keepsake-display">
                  <img
                    src={item.image}
                    alt="Fabricated demo arrangement representing Mara's brass seed locket"
                  />
                  <div className="locket">
                    <i />
                  </div>
                  <span>FABRICATED DEMO KEEPSAKE</span>
                </div>
                <div className="object-story">
                  <div className="kicker">{item.meta}</div>
                  <h3>
                    A small piece of the <em>surface.</em>
                  </h3>
                  <p>{item.text}</p>
                  <div className="archive-context">
                    <b>FAMILY PROVENANCE</b>
                    <p>
                      Elena Voss → Mara Voss → Lia Vale. The locket represents the family’s connection to Elena’s forbidden seed work.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* 5. WINDOW */}
            {objectKey === 'window' && (
              <>
                <div className="window-memory">
                  <img
                    src={item.image}
                    alt="Reconstructed demo view of Boston Harbor from Mara Voss's window"
                  />
                  <span>RECONSTRUCTED ENVIRONMENT · COLOR INTERPRETIVE</span>
                </div>
                <div className="object-story">
                  <div className="kicker">{item.meta}</div>
                  <h3>
                    What Mara saw <em>before the warning.</em>
                  </h3>
                  <p>{item.text}</p>
                  <div className="evidence-link">
                    <span>04:51</span>
                    <div>
                      <b>NORTH BRIDGE CONVOY</b>
                      <p>Matches recovered Gate Transit Log 17-B in Human Legacy.</p>
                    </div>
                  </div>
                  <button
                    className="primary"
                    onClick={() => openHumanLegacy('boston-harbor', 'gate-transit-log-17-b')}
                  >
                    FOLLOW EVIDENCE TO HUMAN LEGACY →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DemoAudioPlayer() {
  const [playing, setPlaying] = useState(false)
  const transcript =
    'Jonas says they are weather trucks. They are not. No markings, no headlights. Seventeen, maybe eighteen, all going north.'

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const toggle = () => {
    if (playing) {
      window.speechSynthesis?.cancel()
      return setPlaying(false)
    }
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(transcript)
    utterance.rate = 0.82
    utterance.pitch = 0.88
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    setPlaying(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className={`narrated-demo ${playing ? 'playing' : ''}`}>
      <button
        onClick={toggle}
        aria-label={
          playing
            ? 'Stop fabricated demo transcript'
            : 'Play fabricated demo transcript'
        }
      >
        {playing ? '⏸' : '▶'}
      </button>
      <div>
        <b>{playing ? 'PLAYING TRANSCRIPT' : 'PLAY FABRICATED DEMO TRANSCRIPT'}</b>
        <span>Browser-generated narration · not Mara’s real voice</span>
      </div>
      <i />
    </div>
  )
}

export default MemoryRoom
