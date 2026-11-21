import { useState } from 'react'
import { VERIFICATION_MEANING, formatDate, formatTime, recordKind, type RecordKind } from './format'
import type { ArchiveSource, HistoricalLocation, HistoricalRecord } from './types'

export function Arrow() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M14 6l6 6-6 6" /></svg>
}

export function KindIcon({ kind }: { kind: RecordKind }) {
  const paths: Record<RecordKind, React.ReactNode> = {
    bulletin: <><path d="M6 3h9l4 4v14H6zM15 3v4h4M9 11h7M9 14h7M9 17h4" /></>,
    log: <><path d="M3 5h18v14H3zM7 10l3 2-3 2M12 15h5" /></>,
    testimony: <><path d="M3 6h18v13H3zM3 7l9 7 9-7" /></>,
    photo: <><path d="M4 7h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="13" r="3.6" /></>,
    audio: <><path d="M5 9v6M9 6v12M13 3v18M17 7v10M21 10v4" /></>,
    interpretive: <><path d="M12 3l9 9-9 9-9-9z" strokeDasharray="3 2.5" /><path d="M12 9v4M12 16v.5" /></>,
  }
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">{paths[kind]}</svg>
}

export function VerificationBadge({ status }: { status: HistoricalRecord['verification_status'] }) {
  return <span className={`hl-badge hl-v-${status}`} title={VERIFICATION_MEANING[status]}>{status.toUpperCase()}</span>
}

function stamp(record: HistoricalRecord) {
  if (!record.event_at) return 'TIME UNKNOWN'
  return `${formatDate(record.event_at.slice(0, 10))} · ${formatTime(record.event_at)} UTC`
}

const ORIGIN_TEXT: Record<HistoricalRecord['origin_kind'], string> = {
  original: 'Original surviving artifact',
  testimony: 'Human testimony',
  reconstruction: 'Interpretive reconstruction',
}

function Photo({ record, location }: { record: HistoricalRecord; location: HistoricalLocation }) {
  const [primaryFailed, setPrimaryFailed] = useState(false)
  const [illustrativeFailed, setIllustrativeFailed] = useState(false)
  const showPrimary = Boolean(record.media_url) && !primaryFailed
  const showIllustrative = !showPrimary && Boolean(location.image_url) && !illustrativeFailed
  return <figure className="hl-photo">
    <div className={`hl-photo-frame ${showPrimary || showIllustrative ? '' : 'is-missing'}`}>
      {showPrimary && <img src={record.media_url!} alt={`Recovered photograph: ${record.title}`} onError={() => setPrimaryFailed(true)} />}
      {showIllustrative && <img className="is-illustrative" src={location.image_url!} alt={`Illustrative archive view of ${location.name}. The original image is unavailable.`} onError={() => setIllustrativeFailed(true)} />}
      {!showPrimary && <span className="hl-photo-flag">{showIllustrative ? 'ORIGINAL IMAGE UNAVAILABLE · ILLUSTRATIVE VIEW' : 'IMAGE RECORD UNAVAILABLE'}</span>}
      <i className="hl-corner tl" /><i className="hl-corner tr" /><i className="hl-corner bl" /><i className="hl-corner br" />
    </div>
    <figcaption>{record.content}</figcaption>
  </figure>
}

function Waveform() {
  const bars = Array.from({ length: 48 }, (_, i) => 16 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.43)) * 70)
  return <div className="hl-wave" aria-hidden="true">{bars.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
}

function Body({ record, location }: { record: HistoricalRecord; location: HistoricalLocation }) {
  const { kind } = recordKind(record)
  switch (kind) {
    case 'bulletin':
      return <div className="hl-bulletin">
        <div className="hl-letterhead"><b>THE DIRECTORATE</b><small>PUBLIC TRANSMISSION · {location.name}</small></div>
        <div className="hl-stamp">OFFICIAL RECORD</div>
        <p>{record.content}</p>
        <div className="hl-rule" aria-hidden="true" />
        <small className="hl-bulletin-foot">ISSUED {stamp(record)}</small>
      </div>
    case 'log': {
      const lines = record.content.split(' · ')
      return <div className="hl-log">
        <div className="hl-log-head">RECOVERED ENTRY · {location.name} · {stamp(record)}</div>
        <ol>{lines.map((line, index) => <li key={index}><span aria-hidden="true">{String(index + 1).padStart(3, '0')}</span><p>{line}</p></li>)}</ol>
        <div className="hl-log-end" aria-hidden="true">END OF RECOVERED ENTRY <i /></div>
      </div>
    }
    case 'testimony':
      return <div className="hl-letter">
        <div className="hl-letter-date">{stamp(record)}</div>
        <blockquote>{record.content}</blockquote>
        <div className="hl-letter-note">RECOVERED PERSONAL ACCOUNT</div>
      </div>
    case 'photo':
      return <Photo record={record} location={location} />
    case 'audio':
      return <div className="hl-audio">
        <Waveform />
        {record.media_url ? <audio controls src={record.media_url} aria-label={`Field recording: ${record.title}`} /> : <small>NO AUDIO FILE ATTACHED TO THIS RECORD</small>}
        <p>{record.content}</p>
      </div>
    default:
      return <div className="hl-interpretive">
        <div className="hl-stamp is-dashed">INTERPRETIVE RECONSTRUCTION · NOT ESTABLISHED FACT</div>
        <p>{record.content}</p>
      </div>
  }
}

type Props = {
  record: HistoricalRecord
  location: HistoricalLocation
  source: ArchiveSource
  onBack: () => void
  onConnect?: () => void
}

/** One historical record, presented in a form that matches what kind of document it is. */
export function RecordDocument({ record, location, source, onBack, onConnect }: Props) {
  const { kind, label } = recordKind(record)
  return <article className={`hl-doc hl-doc-${kind} origin-${record.origin_kind}`}>
    <div className="hl-doc-scan" aria-hidden="true" />
    <header className="hl-doc-top">
      <span className="hl-doc-type"><KindIcon kind={kind} />{label}</span>
      <VerificationBadge status={record.verification_status} />
    </header>
    <h3 className="hl-doc-title">{record.title}</h3>
    <Body record={record} location={location} />
    <dl className="hl-prov">
      <div><dt>PROVENANCE</dt><dd>{record.provenance}</dd></div>
      <div><dt>VERIFICATION</dt><dd><b>{record.verification_status.toUpperCase()}</b> {VERIFICATION_MEANING[record.verification_status]}</dd></div>
      <div><dt>INTERPRETATION STATUS</dt><dd>{record.origin_kind === 'reconstruction' ? 'Interpretive reconstruction; not established fact.' : `${record.verification_status}. Source limitations remain visible.`}</dd></div>
      <div><dt>ORIGIN</dt><dd>{ORIGIN_TEXT[record.origin_kind]} · {source === 'live' ? 'database verified' : 'demo fallback'}</dd></div>
      <div className="hl-prov-id"><dt>ARCHIVE ID</dt><dd>{record.id}</dd></div>
    </dl>
    <footer className="hl-doc-actions">
      <button className="secondary" onClick={onBack}>← RETURN TO {location.name} INDEX</button>
      {onConnect && <button className="primary" onClick={onConnect}>CONNECT THIS EVIDENCE <Arrow /></button>}
    </footer>
  </article>
}
