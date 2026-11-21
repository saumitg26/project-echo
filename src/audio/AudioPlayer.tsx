
import { useEffect, useRef, useState } from 'react'
import type { AudioSourceType } from './types'


type Props = {
  src: string
  title: string
  ancestorName: string
  dateLabel: string
  sourceType: AudioSourceType
  transcript?: string[]
}

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function AudioPlayer({ src, title, ancestorName, dateLabel, sourceType, transcript }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [message, setMessage] = useState('')

  // Stop playback when the modal closes or the player unmounts.
  useEffect(() => {
    const el = audioRef.current
    return () => { el?.pause() }
  }, [])

  const toggle = async () => {
    const el = audioRef.current
    if (!el || status !== 'ready') return
    if (el.paused) {
      try { await el.play() } catch { setMessage('Playback was blocked by the browser. Press play again.') }
    } else {
      el.pause()
    }
  }

  const onError = () => {
    const code = audioRef.current?.error?.code
    setStatus('error'); setPlaying(false)
    setMessage(code === 4
      ? 'This recording could not be found or is not a playable audio file.'
      : code === 2 ? 'A network problem interrupted the recording.'
      : 'This recording could not be played.')
  }

  const retry = () => { setStatus('loading'); setMessage(''); audioRef.current?.load() }

  const label = sourceType === 'ai-generated-demo' ? 'AI-GENERATED DEMO NARRATION' : 'ORIGINAL RECORDING'

  return (
    <div className="echo-player">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); setStatus('ready') }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={onError}
      />
      <div className="echo-player-head">
        <span className={`echo-player-badge ${sourceType}`}>{label}</span>
        <b>{title}</b>
        <small>{ancestorName} · {dateLabel}</small>
      </div>
      <div className="echo-player-row">
        <button className="echo-player-btn" onClick={toggle} disabled={status !== 'ready'} aria-label={playing ? 'Pause recording' : 'Play recording'}>
          {playing
            ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
        </button>
        <span className="echo-player-time">{fmt(current)}</span>
        <input
          className="echo-player-seek"
          type="range" min={0} max={duration || 0} step={0.1} value={Math.min(current, duration || 0)}
          disabled={status !== 'ready'}
          onChange={(e) => { const t = Number(e.target.value); if (audioRef.current) audioRef.current.currentTime = t; setCurrent(t) }}
          aria-label="Seek through recording"
        />
        <span className="echo-player-time">{status === 'ready' ? fmt(duration) : '--:--'}</span>
      </div>
      {status === 'loading' && <p className="echo-player-note">Loading recording…</p>}
      {(status === 'error' || message) && (
        <p className="echo-player-error" role="alert">{message} {status === 'error' && <button onClick={retry}>RETRY</button>}</p>
      )}
      {transcript && transcript.length > 0 && (
        <div className="echo-player-transcript">
          <b>TRANSCRIPT</b>
          {transcript.map((line, i) => <p key={i}>{line}</p>)}
        </div>
      )}
    </div>
  )
}
