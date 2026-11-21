import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createHistoricalContribution, getHistoricalArchive, isSupabaseConfigured } from './api'
import { fallbackHistoricalLocations } from './data'
import { coords, recordKind, useReducedMotion, webglAvailable } from './format'
import FlatEarthMap from './FlatEarthMap'
import type { GlobeApi } from './LostEarthGlobe'
import { CONVOY_EVIDENCE, Dossier, LocationArchive, LocationIndex } from './LocationViews'
import { Arrow, RecordDocument } from './RecordViews'
import type { ArchiveSource, HistoricalLocation, HistoricalRecord } from './types'
import type { ContributionType } from '../../lib/supabase/database.types'
import './human-legacy.css'

const LostEarthGlobe = lazy(() => import('./LostEarthGlobe'))
const VIEW_KEY = 'echo-human-legacy-view'

type Props = {
  initialLocationSlug?: string
  initialRecordSlug?: string | null
  onNavigate: (destination: 'vault' | 'echoes' | 'reconstruction') => void
  onTargetOpened?: () => void
  userId?: string
  onRequestSignIn?: () => void
}

function ArchiveModal({ title, children, onClose, tone }: { title: string; children: React.ReactNode; onClose: () => void; tone?: string }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => { window.removeEventListener('keydown', close); previous?.focus?.() }
  }, [onClose])
  return <div className="modal-backdrop human-archive-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className={`modal large human-archive-modal ${tone ?? ''}`} role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-header"><span>ARCHIVE RETRIEVAL</span><b>{title}</b><button ref={closeRef} onClick={onClose} aria-label="Close archive">×</button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>
}

/** Catches a failed globe chunk load and hands over to the 2D map. */
class LoadBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFail() }
  render() { return this.state.failed ? null : this.props.children }
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])
  return matches
}

function ContributionForm({ location, onClose }: { location: HistoricalLocation; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [type, setType] = useState<ContributionType>('testimony')
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !description.trim()) return setError('Add both a title and an account of what was recovered.')
    setSaving(true); setError('')
    try {
      await createHistoricalContribution({ locationId: location.id, contributionType: type,
        title: title.trim(), description: description.trim(), eventDate: eventDate || undefined, file })
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The contribution could not be preserved.')
    } finally { setSaving(false) }
  }
  if (saved) return <div className="contribution-success"><span>✓</span><div className="kicker"><span />SUBMISSION SEALED · PENDING REVIEW</div><h3>Your account remains private.</h3><p>It is visible to you and trusted archive reviewers. It will not enter the public historical record until it has been verified.</p><button className="primary" onClick={onClose}>RETURN TO {location.name}</button></div>
  return <form className="contribution-form" onSubmit={(event) => void submit(event)}>
    <div className="kicker"><span />RECOVERED MATERIAL INTAKE · {location.name}</div>
    <h3>Preserve what the official record missed.</h3>
    <p>Submissions begin as private, pending testimony. Verification may establish provenance; it does not erase uncertainty.</p>
    <div className="form-grid"><label>ARTIFACT TYPE<select value={type} onChange={(event) => setType(event.target.value as ContributionType)}><option value="testimony">Personal testimony</option><option value="written_account">Written account</option><option value="photograph">Historical photograph</option><option value="document">Recovered document</option><option value="audio">Audio recording</option></select></label><label>EVENT DATE · OPTIONAL<input type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} /></label></div>
    <label>ARCHIVE TITLE<input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="Name this recovered fragment" /></label>
    <label>TESTIMONY OR PROVENANCE<textarea value={description} maxLength={20000} onChange={(event) => setDescription(event.target.value)} placeholder="Describe what happened, where this came from, and what remains uncertain." /></label>
    <label className="contribution-file">PRIVATE MEDIA · OPTIONAL<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><span>{file ? file.name : 'ATTACH PHOTOGRAPH, DOCUMENT, OR AUDIO'}<small>Private pending storage · maximum 25 MB</small></span></label>
    <div className="pending-warning"><b>PENDING BY DEFAULT</b><p>Your submission cannot be approved by your own account and will never appear in the public archive before review.</p></div>
    {error && <p className="form-error">{error}</p>}
    <button className="primary wide" type="submit" disabled={saving}>{saving ? 'ENCRYPTING SUBMISSION…' : 'SUBMIT FOR ARCHIVE REVIEW'} <Arrow /></button>
  </form>
}

export function HistoricalArchive({ initialLocationSlug = 'boston-harbor', initialRecordSlug, onNavigate, onTargetOpened, userId, onRequestSignIn }: Props) {
  const [locations, setLocations] = useState<HistoricalLocation[]>([])
  const [source, setSource] = useState<ArchiveSource>('fallback')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  // A visitor arriving from a family memory or an echo lands on that location; otherwise they start on the overview.
  const [selectedSlug, setSelectedSlug] = useState<string | null>(onTargetOpened ? initialLocationSlug : null)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [record, setRecord] = useState<HistoricalRecord | null>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const [contributionOpen, setContributionOpen] = useState(false)
  const [webglOk, setWebglOk] = useState(() => webglAvailable())
  const [view, setView] = useState<'globe' | 'flat'>(() => {
    try { return localStorage.getItem(VIEW_KEY) === 'flat' ? 'flat' : 'globe' } catch { return 'globe' }
  })
  const [resetSignal, setResetSignal] = useState(0)
  const [arrival, setArrival] = useState(Boolean(onTargetOpened))
  const openedTarget = useRef('')
  const timers = useRef<number[]>([])
  const globeApi = useRef<GlobeApi | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const dossierRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 1000px)')

  const load = useCallback(async () => {
    setStatus('loading'); setError('')
    if (!isSupabaseConfigured) {
      setLocations(fallbackHistoricalLocations); setSource('fallback'); setStatus('ready')
      return
    }
    try {
      const result = await getHistoricalArchive()
      setLocations(result); setSource('live'); setStatus('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The archive link could not be established.')
      setStatus('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])
  useEffect(() => { if (onTargetOpened) setSelectedSlug(initialLocationSlug) }, [initialLocationSlug, onTargetOpened])
  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])
  useEffect(() => {
    if (!arrival) return
    const timer = window.setTimeout(() => setArrival(false), 3600)
    return () => window.clearTimeout(timer)
  }, [arrival])

  const selected = useMemo(
    () => locations.find((location) => location.slug === selectedSlug) ?? null,
    [locations, selectedSlug],
  )

  // Opens the record or archive a family memory or echo pointed at. The globe flies in first so the connection reads as a journey.
  useEffect(() => {
    const targetKey = `${initialLocationSlug}:${initialRecordSlug ?? 'index'}`
    if (!selected || status !== 'ready' || !onTargetOpened || openedTarget.current === targetKey) return
    openedTarget.current = targetKey
    const delay = reduced ? 0 : 1500
    const open = () => {
      if (initialRecordSlug) {
        const target = selected.records.find((item) => item.slug === initialRecordSlug)
        if (target) setRecord(target)
        else setArchiveOpen(true)
      } else {
        setArchiveOpen(true)
      }
    }
    if (delay) timers.current.push(window.setTimeout(open, delay))
    else open()
    onTargetOpened()
  }, [initialLocationSlug, initialRecordSlug, locations, onTargetOpened, reduced, selected, status])

  const useFallback = () => {
    setLocations(fallbackHistoricalLocations); setSource('fallback'); setStatus('ready'); setError('')
  }
  const chooseLocation = useCallback((slug: string) => {
    setSelectedSlug(slug); setArchiveOpen(false); setRecord(null); setImageFailed(false)
    if (!desktop) {
      timers.current.push(window.setTimeout(() => dossierRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), reduced ? 0 : 700))
    }
  }, [desktop, reduced])
  const returnToGlobe = useCallback(() => {
    setSelectedSlug(null); setArchiveOpen(false); setRecord(null); setImageFailed(false)
    if (!desktop) stageRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }, [desktop, reduced])
  const resetView = () => { returnToGlobe(); setResetSignal((value) => value + 1) }
  const chooseView = (next: 'globe' | 'flat') => {
    setView(next)
    try { localStorage.setItem(VIEW_KEY, next) } catch { /* preference is optional */ }
  }

  // Escape steps back out to the globe when nothing else is open.
  useEffect(() => {
    if (!selected || archiveOpen || record || contributionOpen) return
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      const field = document.activeElement
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement || field instanceof HTMLSelectElement) return
      returnToGlobe()
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [archiveOpen, contributionOpen, record, returnToGlobe, selected])

  if (status === 'loading') return <section className="inner-screen earth-screen archive-retrieval-state" aria-live="polite">
    <div className="retrieval-core"><i /><span /><b>RETRIEVING CIVILIZATION ARCHIVE</b><small>VERIFYING PUBLIC RECORD INDEX</small></div>
  </section>

  if (status === 'error') return <section className="inner-screen earth-screen archive-retrieval-state">
    <div className="archive-failure"><span>ARCHIVE LINK INTERRUPTED</span><h2>Historical records are <em>unavailable.</em></h2><p>{error}</p><div><button className="primary" onClick={() => void load()}>RETRY SECURE LINK <Arrow /></button><button className="secondary" onClick={useFallback}>OPEN LABELED FICTIONAL DEMO</button></div></div>
  </section>

  if (locations.length === 0) return <section className="inner-screen earth-screen archive-retrieval-state"><div className="archive-failure"><h2>No approved records found.</h2><p>The public index responded successfully, but no published locations are available.</p><button className="secondary" onClick={() => void load()}>RETRY ARCHIVE</button></div></section>

  const showGlobe = webglOk && view === 'globe'
  const offset = selected && desktop ? { x: 0.19, y: 0 } : { x: 0, y: 0 }
  const placedCount = locations.filter((location) => location.latitude != null && location.longitude != null).length
  const origin = initialRecordSlug && initialLocationSlug === 'boston-harbor' ? 'MARA’S HARBOR WINDOW' : 'FAMILY ARCHIVE LINK'

  return <section className="inner-screen earth-screen hl-screen">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><span><button onClick={() => onNavigate('vault')}>Memory Vault</button></span><span><i>/</i><b>Human Legacy</b></span></nav>
    <div className="hl-head">
      <div><div className="kicker"><span />CIVILIZATION ARCHIVE</div><h2>The <em>Lost Earth</em></h2><p>Not a map of territory. A map of what remains.</p></div>
      <div className="hl-head-meta">
        <div className={`hl-source ${source}`} role="status"><i />{source === 'live' ? 'SUPABASE ARCHIVE · APPROVED RECORDS' : 'FICTIONAL DEMO FALLBACK · NOT RETRIEVED FROM SUPABASE'}</div>
        <div className="hl-count"><b>8.2M EST.</b><span>IN-UNIVERSE ARCHIVE ESTIMATE</span></div>
      </div>
    </div>
    <p className="hl-sr" role="status" aria-live="polite">{selected ? `${selected.name} selected. ${selected.records.length} records recovered.` : ''}</p>

    <div className={`hl-stage ${selected ? 'has-selection' : ''}`} ref={stageRef}>
      <div className="hl-viewport">
        <div className="hl-atmos" aria-hidden="true" />
        {showGlobe
          ? <LoadBoundary onFail={() => setWebglOk(false)}>
            <Suspense fallback={<div className="hl-loading" role="status"><i /><span>CALIBRATING SURFACE PROJECTION</span></div>}>
              <LostEarthGlobe locations={locations} selectedSlug={selectedSlug} onSelect={chooseLocation} reduced={reduced}
                offset={offset} resetSignal={resetSignal} onFail={() => setWebglOk(false)} apiRef={globeApi} />
            </Suspense>
          </LoadBoundary>
          : <FlatEarthMap locations={locations} selectedSlug={selectedSlug} onSelect={chooseLocation} />}
        <div className="hl-scan" aria-hidden="true" />
        <div className="hl-toolbar">
          <div className="hl-seg" role="group" aria-label="Map style">
            <button type="button" aria-pressed={showGlobe} disabled={!webglOk} onClick={() => chooseView('globe')}>3D GLOBE</button>
            <button type="button" aria-pressed={!showGlobe} onClick={() => chooseView('flat')}>2D MAP</button>
          </div>
          {showGlobe && <button type="button" className="hl-reset" onClick={resetView}>RESET VIEW</button>}
        </div>
        <p className="hl-hint">{!webglOk ? '3D is unavailable on this device. Showing the 2D map.' : showGlobe ? 'Drag to rotate · Scroll or pinch to zoom · Select a glowing marker' : 'Select a marker to open its archive'}</p>
        {placedCount < locations.length && <p className="hl-hint hl-hint-warn">Some locations have no recorded coordinates and appear only in the list.</p>}
      </div>
      <LocationIndex locations={locations} selectedSlug={selectedSlug} onSelect={chooseLocation} />
      {selected && <div className="hl-dossier-anchor" ref={dossierRef} key={selected.id}>
        <Dossier location={selected} source={source} userId={userId} imageFailed={imageFailed} onImageFailed={() => setImageFailed(true)}
          onEnterArchive={() => setArchiveOpen(true)} onOpenRecord={setRecord} onReturn={returnToGlobe}
          onContribute={() => setContributionOpen(true)} onRequestSignIn={onRequestSignIn} onInvestigate={() => onNavigate('reconstruction')} />
      </div>}
      {!selected && <div className="hl-overview" aria-hidden={false}>
        <div className="kicker"><span />{locations.length} LOCATIONS RECOVERED</div>
        <p>Choose a location to open what survives of it.</p>
      </div>}
    </div>

    {arrival && selected && <div className="hl-arrival" role="status">
      <small>{origin}</small><i aria-hidden="true" /><b>{selected.name}</b><span>{coords(selected)}</span>
    </div>}

    {archiveOpen && selected && <LocationArchive location={selected} source={source} imageFailed={imageFailed} onImageFailed={() => setImageFailed(true)}
      onClose={() => setArchiveOpen(false)} onOpenRecord={(item) => { setArchiveOpen(false); setRecord(item) }}
      onNavigate={(destination) => { setArchiveOpen(false); onNavigate(destination) }} />}

    {record && selected && <ArchiveModal title={record.title} onClose={() => setRecord(null)} tone={`hl-modal-${recordKind(record).kind}`}>
      <RecordDocument record={record} location={selected} source={source}
        onBack={() => { setRecord(null); setArchiveOpen(true) }}
        onConnect={selected.slug === 'boston-harbor' && CONVOY_EVIDENCE.includes(record.slug) ? () => { setRecord(null); onNavigate('reconstruction') } : undefined} />
    </ArchiveModal>}
    {contributionOpen && selected && <ArchiveModal title={`Contribute to ${selected.name}`} onClose={() => setContributionOpen(false)}><ContributionForm location={selected} onClose={() => setContributionOpen(false)} /></ArchiveModal>}
  </section>
}
