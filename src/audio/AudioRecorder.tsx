
import { useEffect, useRef, useState } from 'react'
import type { RecordingResult } from './types'

type Props = {
  onConfirm: (result: RecordingResult) => void | Promise<void>
  confirmLabel?: string
  maxSeconds?: number
}

type Phase = 'idle' | 'requesting' | 'recording' | 'recorded' | 'error'

// Chrome/Firefox produce WebM, Safari produces MP4. Use the first one the browser supports.
const CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
const pickMime = () => {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  return CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) ?? ''
}
const extFor = (m: string) => (m.includes('webm') ? 'webm' : m.includes('mp4') ? 'mp4' : m.includes('ogg') ? 'ogg' : 'audio')
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

const micError = (e: unknown) => {
  const name = e instanceof DOMException ? e.name : ''
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Microphone access was denied. Allow it using the icon at the left of the address bar, then try again.'
  if (name === 'NotFoundError' || name === 'OverconstrainedError')
    return 'No microphone was found. Connect one and try again.'
  if (name === 'NotReadableError' || name === 'AbortError')
    return 'Your microphone is busy or unavailable. Close other apps that use it and try again.'
  return 'The microphone could not be started.'
}

export default function AudioRecorder({ onConfirm, confirmLabel = 'USE THIS RECORDING', maxSeconds = 120 }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [result, setResult] = useState<RecordingResult | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const interruptedRef = useRef(false)
  const urlRef = useRef('')

  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'

  const clearTimer = () => { if (timerRef.current !== null) { window.clearInterval(timerRef.current); timerRef.current = null } }
  const releaseStream = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null }
  const clearUrl = () => { if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = '' } }

  // Release the microphone and temporary URL if the component unmounts mid-recording.
  useEffect(() => () => {
    clearTimer()
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') { rec.onstop = null; rec.stop() }
    releaseStream()
    clearUrl()
  }, [])

  const stop = () => {
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') rec.stop()
  }

  const start = async () => {
    setError(''); setNotice(''); setResult(null); setElapsed(0); clearUrl()
    interruptedRef.current = false
    setPhase('requesting')

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      setPhase('error'); setError(micError(e)); return
    }
    streamRef.current = stream

    const mime = pickMime()
    let rec: MediaRecorder
    try {
      rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 32000 })
    } catch {
      releaseStream(); setPhase('error'); setError('This browser cannot record in a supported audio format.'); return
    }

    chunksRef.current = []
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    rec.onerror = () => { interruptedRef.current = true; if (rec.state !== 'inactive') rec.stop() }
    rec.onstop = () => {
      clearTimer(); releaseStream()
      const durationSeconds = (Date.now() - startedAtRef.current) / 1000
      const type = rec.mimeType || mime || 'audio/webm'
      const blob = new Blob(chunksRef.current, { type })
      chunksRef.current = []
      if (blob.size === 0 || durationSeconds < 0.5) {
        setPhase('error'); setError('Nothing was recorded. Check your microphone and try again.'); return
      }
      const url = URL.createObjectURL(blob)
      urlRef.current = url
      const base = type.split(';')[0]
      setResult({ blob, url, mimeType: base, durationSeconds: Math.round(durationSeconds * 10) / 10, sizeBytes: blob.size, extension: extFor(base), sourceType: 'original' })
      if (interruptedRef.current) setNotice('The recording was interrupted, so only part of it was saved. You can use it or record again.')
      setPhase('recorded')
    }
    // If the microphone is unplugged or revoked mid-recording, stop and keep what we have.
    stream.getAudioTracks().forEach((t) => {
      t.onended = () => { if (rec.state === 'recording') { interruptedRef.current = true; rec.stop() } }
    })

    recorderRef.current = rec
    startedAtRef.current = Date.now()
    rec.start(1000)
    setPhase('recording')
    timerRef.current = window.setInterval(() => {
      const s = (Date.now() - startedAtRef.current) / 1000
      setElapsed(s)
      if (s >= maxSeconds) { setNotice(`Recording stopped at the ${maxSeconds}-second limit.`); stop() }
    }, 250)
  }

  const discard = () => { clearUrl(); setResult(null); setNotice(''); setElapsed(0); setPhase('idle') }

  if (!supported) {
    return <div className="echo-rec"><p className="echo-rec-error" role="alert">This browser does not support microphone recording. Try a current version of Chrome, Edge, Firefox, or Safari, or upload an audio file instead.</p></div>
  }

  return (
    <div className="echo-rec">
      {phase === 'idle' && <div className="echo-rec-row"><button type="button" className="echo-rec-btn" onClick={start}>● START RECORDING</button><span className="echo-rec-note">Your browser will ask for microphone permission.</span></div>}
      {phase === 'requesting' && <p className="echo-rec-note">Waiting for microphone permission…</p>}
      {phase === 'recording' && <div className="echo-rec-row"><i className="echo-rec-dot" aria-hidden="true" /><span className="echo-rec-time" role="timer">{fmt(elapsed)}</span><span className="echo-rec-note">RECORDING</span><button type="button" className="echo-rec-btn stop" onClick={stop}>■ STOP</button></div>}
      {phase === 'recorded' && result && <>
        <audio controls src={result.url} />
        <span className="echo-rec-note">{fmt(result.durationSeconds)} · {result.mimeType} · {(result.sizeBytes / 1024).toFixed(0)} KB</span>
        <div className="echo-rec-row">
          <button type="button" className="echo-rec-btn" onClick={() => onConfirm(result)}>{confirmLabel}</button>
          <button type="button" className="echo-rec-btn ghost" onClick={start}>RE-RECORD</button>
          <button type="button" className="echo-rec-btn ghost" onClick={discard}>DISCARD</button>
        </div>
      </>}
      {phase === 'error' && <div className="echo-rec-row"><p className="echo-rec-error" role="alert">{error}</p><button type="button" className="echo-rec-btn ghost" onClick={start}>TRY AGAIN</button></div>}
      {notice && phase !== 'error' && <p className="echo-rec-note">{notice}</p>}
    </div>
  )
}
