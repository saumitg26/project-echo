import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createHistoricalContribution, getHistoricalArchive, isSupabaseConfigured } from './api'
import { fallbackHistoricalLocations } from './data'
import type { ArchiveSource, HistoricalLocation, HistoricalRecord } from './types'
import type { ContributionType } from '../../lib/supabase/database.types'

type Props = {
  initialLocationSlug?: string
  initialRecordSlug?: string | null
  onNavigate: (destination: 'vault' | 'echoes' | 'reconstruction') => void
  onTargetOpened?: () => void
  userId?: string
  onRequestSignIn?: () => void
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${date}T00:00:00Z`)).toUpperCase()
}

function formatTime(timestamp: string | null) {
  if (!timestamp) return 'TIME UNKNOWN'
  return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
    .format(new Date(timestamp))
}

function coords(location: HistoricalLocation) {
  if (location.latitude == null || location.longitude == null) return 'COORDINATES LOST'
  return `${Math.abs(location.latitude).toFixed(4)}° ${location.latitude >= 0 ? 'N' : 'S'} · ${Math.abs(location.longitude).toFixed(4)}° ${location.longitude >= 0 ? 'E' : 'W'}`
}

function Arrow() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M14 6l6 6-6 6" /></svg>
}

function ArchiveModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])
  return <div className="modal-backdrop human-archive-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal large human-archive-modal" role="dialog" aria-modal="true" aria-label={title}>
      <header className="modal-header"><span>ARCHIVE RETRIEVAL</span><b>{title}</b><button onClick={onClose} aria-label="Close archive">×</button></header>
      <div className="modal-body">{children}</div>
    </section>
  </div>
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
  const [selectedSlug, setSelectedSlug] = useState(initialLocationSlug)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [record, setRecord] = useState<HistoricalRecord | null>(null)
  const [imageFailed, setImageFailed] = useState(false)
  const [contributionOpen, setContributionOpen] = useState(false)
  const openedTarget = useRef('')

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
  useEffect(() => { setSelectedSlug(initialLocationSlug) }, [initialLocationSlug])
  const selected = useMemo(
    () => locations.find((location) => location.slug === selectedSlug) ?? locations[0],
    [locations, selectedSlug],
  )

  useEffect(() => {
    const targetKey = `${initialLocationSlug}:${initialRecordSlug ?? 'index'}`
    if (!selected || status !== 'ready' || !onTargetOpened || openedTarget.current === targetKey) return
    openedTarget.current = targetKey
    if (initialRecordSlug) {
      const target = selected.records.find((item) => item.slug === initialRecordSlug)
      if (target) setRecord(target)
      else setArchiveOpen(true)
    } else {
      setArchiveOpen(true)
    }
    onTargetOpened()
  }, [initialLocationSlug, initialRecordSlug, locations, onTargetOpened, selected, status])

  const useFallback = () => {
    setLocations(fallbackHistoricalLocations); setSource('fallback'); setStatus('ready'); setError('')
  }
  const chooseLocation = (location: HistoricalLocation) => {
    setSelectedSlug(location.slug); setArchiveOpen(false); setRecord(null); setImageFailed(false)
  }

  if (status === 'loading') return <section className="inner-screen earth-screen archive-retrieval-state" aria-live="polite">
    <div className="retrieval-core"><i /><span /><b>RETRIEVING CIVILIZATION ARCHIVE</b><small>VERIFYING PUBLIC RECORD INDEX</small></div>
  </section>

  if (status === 'error') return <section className="inner-screen earth-screen archive-retrieval-state">
    <div className="archive-failure"><span>ARCHIVE LINK INTERRUPTED</span><h2>Historical records are <em>unavailable.</em></h2><p>{error}</p><div><button className="primary" onClick={() => void load()}>RETRY SECURE LINK <Arrow /></button><button className="secondary" onClick={useFallback}>OPEN LABELED FICTIONAL DEMO</button></div></div>
  </section>

  if (!selected) return <section className="inner-screen earth-screen archive-retrieval-state"><div className="archive-failure"><h2>No approved records found.</h2><p>The public index responded successfully, but no published locations are available.</p><button className="secondary" onClick={() => void load()}>RETRY ARCHIVE</button></div></section>

  const classifications = selected.records.reduce((counts, item) => {
    counts[item.origin_kind] += 1
    return counts
  }, { original: 0, testimony: 0, reconstruction: 0 })

  return <section className="inner-screen earth-screen">
    <nav className="breadcrumbs" aria-label="Breadcrumb"><span><button onClick={() => onNavigate('vault')}>Memory Vault</button></span><span><i>/</i><b>Human Legacy</b></span></nav>
    <div className="section-heading compact"><div><div className="kicker"><span />CIVILIZATION ARCHIVE</div><h2>The <em>Lost Earth</em></h2><p>Not a map of territory. A map of what remains.</p></div><div className="archive-count"><b>8.2M EST.</b><span>IN-UNIVERSE ARCHIVE ESTIMATE</span></div></div>
    <div className={`archive-source ${source}`} role="status"><i />{source === 'live' ? 'SUPABASE ARCHIVE · APPROVED RECORDS' : 'FICTIONAL DEMO FALLBACK · NOT RETRIEVED FROM SUPABASE'}</div>
    <div className="earth-layout">
      <div className="map">
        <div className="map-grid" /><div className="world-shape shape-1" /><div className="world-shape shape-2" /><div className="world-shape shape-3" />
        {locations.map((location) => <button key={location.id} style={{ left: `${location.map_x}%`, top: `${location.map_y}%` }} className={`location ${selected.id === location.id ? 'active' : ''}`} onClick={() => chooseLocation(location)} aria-label={`Focus historical archive for ${location.name}`}><i /><span>{location.name}<small>{location.records.length} RETRIEVED RECORDS</small></span></button>)}
        <div className="map-scan" /><div className="map-label">SURFACE CARTOGRAPHY / LAST UPDATE 2058</div>
      </div>
      <aside className="location-panel">
        <div className={`location-visual ${imageFailed ? 'image-missing' : ''}`}>{selected.image_url && !imageFailed ? <img src={selected.image_url} alt={`Illustrative archive landscape for ${selected.name}`} onError={() => setImageFailed(true)} /> : <div><span>IMAGE RECORD UNAVAILABLE</span></div>}<span>{selected.classification.replace(/_/g, ' ').toUpperCase()}</span></div>
        <div className="kicker"><span />SELECTED LOCATION · {coords(selected)}</div><h3>{selected.name}</h3><p className="event-title">{selected.event_title} · {formatDate(selected.event_date)}</p>
        <p>{selected.short_description}</p>
        <div className="source-legend"><span><i className="cyan-dot" /><b>ORIGINAL</b> {classifications.original}</span><span><i className="amber-dot" /><b>TESTIMONY</b> {classifications.testimony}</span><span><i className="white-dot" /><b>INTERPRETIVE</b> {classifications.reconstruction}</span></div>
        <div className="timeline-fragments">{selected.records.slice(0, 3).map((item) => <span key={item.id}>{formatTime(item.event_at)} <b>{item.title}</b></span>)}{selected.records.length === 0 && <span>— <b>NO APPROVED RECORDS RECOVERED</b></span>}</div>
        <button className="primary wide" onClick={() => setArchiveOpen(true)} disabled={selected.records.length === 0}>ENTER LOCATION ARCHIVE <Arrow /></button>
        {source === 'live' && userId ? <button className="secondary wide contribute-trigger" onClick={() => setContributionOpen(true)}>CONTRIBUTE A RECOVERED MEMORY</button> : source === 'live' ? <button className="secondary wide contribute-trigger" onClick={onRequestSignIn}>SIGN IN TO CONTRIBUTE</button> : <p className="fallback-contribution-note">Contributions are disabled in fictional demo fallback mode.</p>}
      </aside>
    </div>

    {archiveOpen && <ArchiveModal title={`${selected.name} · ${selected.event_title}`} onClose={() => setArchiveOpen(false)}>
      <div className="history-hero">{selected.image_url && !imageFailed ? <img src={selected.image_url} alt={`Illustrative historical view of ${selected.name}`} onError={() => setImageFailed(true)} /> : <div className="history-image-missing">VISUAL RECORD LOST</div>}<span>FICTIONAL IN-UNIVERSE ARCHIVE · {source === 'live' ? 'DATABASE VERIFIED' : 'DEMO FALLBACK'}</span></div>
      <div className="history-heading"><div><div className="kicker"><span />{formatDate(selected.event_date)} · {coords(selected)}</div><h3>{selected.event_title}</h3></div><b>{selected.records.length}<small>RETRIEVED RECORDS</small></b></div>
      <p className="history-copy">{selected.short_description}</p>
      <div className="history-records archive-record-list">{selected.records.map((item, index) => <button key={item.id} onClick={() => { setArchiveOpen(false); setRecord(item) }}><span>{String(index + 1).padStart(2, '0')}</span><div><small>{item.origin_kind.toUpperCase()} · {formatTime(item.event_at)}</small><b>{item.title}</b><p>{item.content}</p><em>{item.verification_status.toUpperCase()}</em></div><Arrow /></button>)}</div>
      <div className="modal-actions"><button className="secondary" onClick={() => { setArchiveOpen(false); onNavigate('echoes') }}>FIND FAMILY ECHOES</button>{selected.slug === 'boston-harbor' && <button className="primary" onClick={() => { setArchiveOpen(false); onNavigate('reconstruction') }}>INVESTIGATE FIRST CONVOY <Arrow /></button>}</div>
    </ArchiveModal>}

    {record && <ArchiveModal title={record.title} onClose={() => setRecord(null)}>
      <article className={`record-focus origin-${record.origin_kind}`}>
        <div className="record-scanline" /><div className="kicker"><span />{record.origin_kind.toUpperCase()} · {record.verification_status.toUpperCase()}</div>
        <header><span>{formatTime(record.event_at)}</span><div><small>{record.record_classification.replace(/_/g, ' ').toUpperCase()}</small><h3>{record.title}</h3></div></header>
        <p>{record.content}</p>
        <dl><div><dt>PROVENANCE</dt><dd>{record.provenance}</dd></div><div><dt>INTERPRETATION STATUS</dt><dd>{record.origin_kind === 'reconstruction' ? 'Interpretive reconstruction; not established fact.' : `${record.verification_status}. Source limitations remain visible.`}</dd></div></dl>
        <footer><button className="secondary" onClick={() => { setRecord(null); setArchiveOpen(true) }}>← RETURN TO {selected.name} INDEX</button>{selected.slug === 'boston-harbor' && ['gate-transit-log-17-b', 'elena-voss-letter', 'directorate-evacuation-bulletin'].includes(record.slug) && <button className="primary" onClick={() => { setRecord(null); onNavigate('reconstruction') }}>CONNECT THIS EVIDENCE <Arrow /></button>}</footer>
      </article>
    </ArchiveModal>}
    {contributionOpen && <ArchiveModal title={`Contribute to ${selected.name}`} onClose={() => setContributionOpen(false)}><ContributionForm location={selected} onClose={() => setContributionOpen(false)} /></ArchiveModal>}
  </section>
}

