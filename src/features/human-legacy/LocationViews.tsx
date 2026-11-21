import { useEffect, useRef } from 'react'
import { coords, formatDate, formatTime, recordKind } from './format'
import { Arrow, KindIcon, VerificationBadge } from './RecordViews'
import type { ArchiveSource, HistoricalLocation, HistoricalRecord } from './types'

/** Records that belong to the First Convoy investigation. Matches the evidence the investigation screen uses. */
export const CONVOY_EVIDENCE = ['gate-transit-log-17-b', 'elena-voss-letter', 'directorate-evacuation-bulletin']
const isConvoyEvidence = (location: HistoricalLocation, record: HistoricalRecord) =>
  location.slug === 'boston-harbor' && CONVOY_EVIDENCE.includes(record.slug)

/** Accessible, always-visible alternative to picking small markers on the globe. */
export function LocationIndex({ locations, selectedSlug, onSelect }: {
  locations: HistoricalLocation[]; selectedSlug: string | null; onSelect: (slug: string) => void
}) {
  return <ol className="hl-index" aria-label="Historical locations">
    {locations.map((location, index) => <li key={location.id}>
      <button type="button" aria-pressed={location.slug === selectedSlug} className={location.slug === selectedSlug ? 'is-selected' : ''} onClick={() => onSelect(location.slug)}>
        <span className="hl-index-no" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
        <span className="hl-index-text"><b>{location.name}</b><small>{location.event_date.slice(0, 4)} · {location.records.length} RECORDS</small></span>
      </button>
    </li>)}
  </ol>
}

function ConvoyThread({ location, onOpenRecord, onInvestigate }: {
  location: HistoricalLocation; onOpenRecord: (record: HistoricalRecord) => void; onInvestigate: () => void
}) {
  const log = location.records.find((record) => record.slug === 'gate-transit-log-17-b')
  return <div className="hl-thread">
    <div className="kicker"><span />THE FIRST CONVOY THREAD</div>
    <ol aria-label="Evidence path">
      <li className="is-origin"><span>MARA’S HARBOR WINDOW</span><small>FAMILY LEGACY</small></li>
      <li className="is-here"><span>BOSTON HARBOR</span><small>YOU ARE HERE</small></li>
      <li>{log ? <button type="button" onClick={() => onOpenRecord(log)}><span>GATE TRANSIT LOG 17-B</span><small>OPEN RECORD</small></button> : <span>GATE TRANSIT LOG 17-B</span>}</li>
      <li><button type="button" onClick={onInvestigate}><span>THE FIRST CONVOY</span><small>INVESTIGATE</small></button></li>
    </ol>
  </div>
}

type DossierProps = {
  location: HistoricalLocation
  source: ArchiveSource
  userId?: string
  imageFailed: boolean
  onImageFailed: () => void
  onEnterArchive: () => void
  onOpenRecord: (record: HistoricalRecord) => void
  onReturn: () => void
  onContribute: () => void
  onRequestSignIn?: () => void
  onInvestigate: () => void
}

/** The selected location's story, shown beside the globe. */
export function Dossier({ location, source, userId, imageFailed, onImageFailed, onEnterArchive, onOpenRecord, onReturn, onContribute, onRequestSignIn, onInvestigate }: DossierProps) {
  const mix = location.records.reduce((counts, record) => {
    counts[record.origin_kind] += 1
    return counts
  }, { original: 0, testimony: 0, reconstruction: 0 })
  return <aside className="hl-dossier" aria-label={`${location.name} location dossier`} data-location={location.slug}>
    <div className="hl-dossier-scroll">
    <div className={`hl-dossier-img ${imageFailed || !location.image_url ? 'is-missing' : ''}`}>
      {location.image_url && !imageFailed
        ? <img src={location.image_url} alt={`Illustrative archive landscape for ${location.name}`} onError={onImageFailed} />
        : <div><span>IMAGE RECORD UNAVAILABLE</span></div>}
      <span className="hl-tag">{location.classification.replace(/_/g, ' ').toUpperCase()}</span>
    </div>
    <div className="hl-dossier-body">
      <div className="kicker"><span />SELECTED LOCATION</div>
      <h3>{location.name}</h3>
      <p className="hl-event">{location.event_title} · {formatDate(location.event_date)}</p>
      <p className="hl-coords">{coords(location)}</p>
      <p className="hl-narrative">{location.short_description}</p>
      <div className="hl-mix" aria-label="Records by origin">
        <span><i className="cyan-dot" /><b>{mix.original}</b> ORIGINAL</span>
        <span><i className="amber-dot" /><b>{mix.testimony}</b> TESTIMONY</span>
        <span><i className="white-dot" /><b>{mix.reconstruction}</b> INTERPRETIVE</span>
      </div>
      <ol className="hl-recs" aria-label="Recovered records">
        {location.records.map((record) => {
          const { kind, label } = recordKind(record)
          return <li key={record.id}><button type="button" onClick={() => onOpenRecord(record)} className={`kind-${kind}`}>
            <span className="hl-recs-time">{formatTime(record.event_at)}</span>
            <span className="hl-recs-main"><b>{record.title}</b><small><KindIcon kind={kind} />{label}{isConvoyEvidence(location, record) ? ' · FIRST CONVOY EVIDENCE' : ''}</small></span>
          </button></li>
        })}
        {location.records.length === 0 && <li className="hl-recs-empty">NO APPROVED RECORDS RECOVERED</li>}
      </ol>
      {location.slug === 'boston-harbor' && <ConvoyThread location={location} onOpenRecord={onOpenRecord} onInvestigate={onInvestigate} />}
      <div className="hl-dossier-actions">
        {source === 'live' && userId ? <button className="secondary wide" onClick={onContribute}>CONTRIBUTE A RECOVERED MEMORY</button>
          : source === 'live' ? <button className="secondary wide" onClick={onRequestSignIn}>SIGN IN TO CONTRIBUTE</button>
          : <p className="fallback-contribution-note">Contributions are disabled in fictional demo fallback mode.</p>}
      </div>
    </div>
    </div>
    <div className="hl-dossier-foot">
      <button className="primary" onClick={onEnterArchive} disabled={location.records.length === 0}>ENTER LOCATION ARCHIVE <Arrow /></button>
      <button className="secondary" onClick={onReturn} aria-label="Return to globe">← GLOBE</button>
    </div>
  </aside>
}

type ArchiveProps = {
  location: HistoricalLocation
  source: ArchiveSource
  imageFailed: boolean
  onImageFailed: () => void
  onClose: () => void
  onOpenRecord: (record: HistoricalRecord) => void
  onNavigate: (destination: 'vault' | 'echoes' | 'reconstruction') => void
}

/** Full-screen "recovered archive" for one location: its story, then its records as a timeline. */
export function LocationArchive({ location, source, imageFailed, onImageFailed, onClose, onOpenRecord, onNavigate }: ArchiveProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [onClose])
  const showImage = Boolean(location.image_url) && !imageFailed
  return <div className="hl-archive" role="dialog" aria-modal="true" aria-label={`${location.name} archive`}>
    <div className="hl-archive-bg" aria-hidden="true">
      {showImage && <img src={location.image_url!} alt="" onError={onImageFailed} />}
    </div>
    <div className="hl-archive-inner">
      <button ref={closeRef} className="secondary hl-archive-close" onClick={onClose}>← BACK TO GLOBE</button>
      <header className="hl-archive-head">
        <div className="kicker"><span />{formatDate(location.event_date)} · {coords(location)}</div>
        <h2>{location.name}</h2>
        <p className="hl-event">{location.event_title}</p>
        <p className="hl-narrative">{location.short_description}</p>
        <div className="hl-archive-facts">
          <span><b>{location.records.length}</b> RETRIEVED RECORDS</span>
          <span>{location.classification.replace(/_/g, ' ').toUpperCase()}</span>
          <span>{source === 'live' ? 'DATABASE VERIFIED' : 'DEMO FALLBACK'}</span>
          {!showImage && <span>VISUAL RECORD LOST</span>}
        </div>
      </header>
      <ol className="hl-reel" aria-label={`${location.name} records`}>
        {location.records.map((record) => {
          const { kind, label } = recordKind(record)
          return <li key={record.id}><button type="button" className={`hl-reel-card kind-${kind}`} onClick={() => onOpenRecord(record)}>
            <span className="hl-reel-time">{formatTime(record.event_at)}<small>UTC</small></span>
            <span className="hl-reel-node" aria-hidden="true" />
            <span className="hl-reel-main">
              <span className="hl-reel-kind"><KindIcon kind={kind} />{label}</span>
              <b>{record.title}</b>
              <span className="hl-reel-text">{record.content}</span>
              <span className="hl-reel-meta"><VerificationBadge status={record.verification_status} />{isConvoyEvidence(location, record) && <em>FIRST CONVOY EVIDENCE</em>}</span>
            </span>
            <Arrow />
          </button></li>
        })}
      </ol>
      <div className="hl-archive-actions">
        <button className="secondary" onClick={() => onNavigate('echoes')}>FIND FAMILY ECHOES</button>
        {location.slug === 'boston-harbor' && <button className="primary" onClick={() => onNavigate('reconstruction')}>INVESTIGATE FIRST CONVOY <Arrow /></button>}
      </div>
    </div>
  </div>
}
