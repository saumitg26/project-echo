import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import AudioPlayer from './audio/AudioPlayer'
import { MARA_KITCHEN_TRANSCRIPT } from './audio/demoNarration'
import AudioRecorder from './audio/AudioRecorder'
import { blobToDataUrl } from './audio/utils'
import type { AudioSourceType, RecordingResult, TranscriptionStatus } from './audio/types'
import {
  createAncestor, createFamily, createMemoryWithMedia, getAncestors, getCurrentUser,
  getMediaWithSignedUrls, getMemoriesForAncestor, getMyFamilies, signInWithEmail,
  signOut, signUpWithEmail, type FamilyWithRole,
} from './lib/supabase/api'
import { isSupabaseConfigured, supabase } from './lib/supabase/client'
import { HistoricalArchive } from './features/human-legacy/HistoricalArchive'
import { getHistoricalArchive } from './features/human-legacy/api'
import { fallbackHistoricalLocations } from './features/human-legacy/data'

type Screen = 'vault' | 'family' | 'room' | 'earth' | 'echoes' | 'reconstruction' | 'capsule'
type IconName = 'arrow' | 'archive' | 'audio' | 'camera' | 'close' | 'earth' | 'family' | 'letter' | 'menu' | 'pause' | 'play' | 'plus' | 'record' | 'spark' | 'upload'
type MemoryType = 'image' | 'audio' | 'video' | 'letter' | 'document'

type StoredMemory = {
  id: string
  personId: string
  title: string
  description: string
  type: MemoryType
  fileName?: string
  dataUrl?: string
  mimeType?: string
  durationSeconds?: number
  audioSource?: AudioSourceType
  transcript?: string
  transcriptStatus?: TranscriptionStatus
  createdAt: string
  tags: string[]
}

type StoredCapsule = {
  id: string
  message: string
  recipient: string
  unlockYear: number
  attachmentName?: string
  attachmentUrl?: string
  voiceUrl?: string
  voiceMimeType?: string
  voiceDurationSeconds?: number
  createdAt: string
}

type FamilyMember = { id: string; name: string; years: string; gen: string; memories: number; x: number; y: number; image?: string; biography?: string }
type UploadDraft = { recording?: { mimeType: string; durationSeconds: number }; personId: string; title: string; description: string; type: MemoryType; preview?: string }

const oceanImage = 'https://images.unsplash.com/photo-1747182922993-9c7dde01c97f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1600'
const cityImage = 'https://images.unsplash.com/photo-1653207771914-f7d37303755c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1600'
const roomImage = 'https://images.unsplash.com/photo-1773098587088-f0a3aaab48a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=88&w=2000'
const scrapbookImage = 'https://images.unsplash.com/photo-1781775795345-cdc2ce3feedb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1400'
const oldPhotosImage = 'https://images.unsplash.com/photo-1453828423292-392a660a502f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200'
const paperImage = 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200'
const portraitImage = 'https://images.unsplash.com/photo-1772981277378-f2c23ea6f156?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=700'
const letterImage = 'https://images.unsplash.com/photo-1794035715720-b7e4a059dc9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1000'
const recorderImage = 'https://images.unsplash.com/photo-1781354771866-0bdd0cc09ea9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900'

const screens: { id: Screen; label: string; index: string }[] = [
  { id: 'vault', label: 'Vault', index: '00' },
  { id: 'family', label: 'Family', index: '01' },
  { id: 'room', label: 'Memory', index: '02' },
  { id: 'earth', label: 'Lost Earth', index: '03' },
  { id: 'echoes', label: 'Echoes', index: '04' },
  { id: 'reconstruction', label: 'Evidence', index: '05' },
  { id: 'capsule', label: 'Capsules', index: '06' },
]

function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) as T : initial
    } catch { return initial }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* file size is validated before save */ }
  }, [key, value])
  return [value, setValue] as const
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <><path d="M5 12h14M14 6l6 6-6 6" /></>,
    archive: <><path d="M4 7h16v13H4zM3 3h18v4H3zM9 11h6" /></>,
    audio: <><path d="M5 9v6M9 6v12M13 3v18M17 7v10M21 10v4" /></>,
    camera: <><path d="M4 7h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="13" r="4" /></>,
    close: <><path d="M6 6l12 12M18 6L6 18" /></>,
    earth: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
    family: <><circle cx="12" cy="6" r="3" /><circle cx="5" cy="17" r="2.5" /><circle cx="19" cy="17" r="2.5" /><path d="M12 9v3M5 14v-2h14v2" /></>,
    letter: <><path d="M3 6h18v13H3zM3 7l9 7 9-7" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    pause: <><path d="M9 7v10M15 7v10" /></>,
    play: <><path d="M9 6l9 6-9 6z" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    record: <><circle cx="12" cy="12" r="7" fill="currentColor" stroke="none" /></>,
    spark: <><path d="M12 2l1.8 7.2L21 12l-7.2 2.3L12 22l-2.3-7.7L3 12l6.7-2.8z" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M4 15v5h16v-5" /></>,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function Shell({ screen, setScreen, children }: { screen: Screen; setScreen: (s: Screen) => void; children: React.ReactNode }) {
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setMenu(false)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])
  return (
    <div className={`app scene-${screen}`}>
      <header className="topbar">
        <button className="brand" onClick={() => setScreen('vault')} aria-label="Return to Project Echo vault">
          <span className="brand-mark"><span /></span>
          <span><b>PROJECT ECHO</b><small>MEMORY PRESERVATION DIRECTIVE</small></span>
        </button>
        <div className="system-status"><i /> ARCHIVE LINK STABLE <span>·</span> RESIDENT 7–A</div>
        <button className="icon-button top-menu" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-controls="archive-menu" aria-label={menu ? 'Close navigation' : 'Open navigation'}><Icon name={menu ? 'close' : 'menu'} /></button>
      </header>
      <aside className="rail" aria-label="Primary archive navigation">
        <div className="rail-line" />
        {screens.map((item) => (
          <button key={item.id} className={screen === item.id ? 'active' : ''} onClick={() => { setScreen(item.id); setMenu(false) }}>
            <span>{item.index}</span><i /><b>{item.label}</b>
          </button>
        ))}
      </aside>
      <div id="archive-menu" className={`navigation-drawer ${menu ? 'open' : ''}`} aria-hidden={!menu}>
        <div className="drawer-heading"><Kicker>ARCHIVE DIRECTORY</Kicker><p>Choose a chamber in humanity's living museum.</p></div>
        <nav>
          {screens.map((item) => <button key={item.id} className={screen === item.id ? 'active' : ''} onClick={() => { setScreen(item.id); setMenu(false) }}><span>{item.index}</span><b>{item.label}</b><Icon name="arrow" /></button>)}
        </nav>
        <small>LOCAL PROTOTYPE · DATA REMAINS ON THIS DEVICE</small>
      </div>
      {menu && <button className="drawer-scrim" onClick={() => setMenu(false)} aria-label="Close navigation" />}
      <main>{children}</main>
      <div className="grain" />
    </div>
  )
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="kicker"><span />{children}</div>
}

function Vault({ go }: { go: (s: Screen) => void }) {
  return (
    <section className="vault-screen">
      <div className="vault-architecture"><div className="arch arch-a" /><div className="arch arch-b" /><div className="floor-lines" /></div>
      <div className="core-wrap" aria-hidden="true">
        <div className="orbit orbit-1" /><div className="orbit orbit-2" /><div className="memory-core"><div /><span /></div>
      </div>
      <div className="vault-copy">
        <Kicker>VAULT 01 · ACTIVE SINCE 2059</Kicker>
        <h1>PROJECT<br /><em>ECHO</em></h1>
        <p className="lead">The world is gone. <span>Its memories aren't.</span></p>
        <p className="context">Beneath 1.4 kilometers of stone, the last living archive holds what the Directorate chose to forget—and what our families refused to lose.</p>
        <button className="primary" onClick={() => go('family')}>EXPLORE MEMORIES <Icon name="arrow" /></button>
      </div>
      <div className="portals">
        <button className="portal family-portal" onClick={() => go('family')}>
          <span className="portal-icon"><Icon name="family" size={22} /></span>
          <span className="portal-num">01 / BLOODLINE ARCHIVE</span>
          <strong>Family<br />Legacy</strong>
          <small>42 preserved memories</small>
          <i><Icon name="arrow" /></i>
        </button>
        <button className="portal human-portal" onClick={() => go('earth')}>
          <span className="portal-icon"><Icon name="earth" size={22} /></span>
          <span className="portal-num">02 / CIVILIZATION ARCHIVE</span>
          <strong>Human<br />Legacy</strong>
          <small>8.2 million fragments</small>
          <i><Icon name="arrow" /></i>
        </button>
      </div>
      <div className="scroll-cue">SCROLL TO DESCEND <span /></div>
    </section>
  )
}

const family: FamilyMember[] = [
  { id: 'elena', name: 'Elena Voss', years: '2008—2071', gen: 'GEN I · MARA’S MOTHER', memories: 18, x: 50, y: 19, image: oldPhotosImage },
  { id: 'mara', name: 'Mara Voss', years: '2038—2080', gen: 'GEN II · LIA’S MOTHER', memories: 12, x: 34, y: 51, image: portraitImage },
  { id: 'jonas', name: 'Jonas Vale', years: '2035—2076', gen: 'GEN II · MARA’S PARTNER', memories: 7, x: 66, y: 51, image: oceanImage },
  { id: 'lia', name: 'Lia Vale', years: '2062—', gen: 'GEN III · YOU', memories: 5, x: 50, y: 82, image: undefined },
]
const reconstructedRoomIds = new Set<string>(['mara'])

const seededMemories: StoredMemory[] = [
  { id: 'seed-elena-photo', personId: 'elena', title: 'The afternoon before', description: 'A family photograph taken on the first warm day of 2041.', type: 'image', dataUrl: portraitImage, createdAt: '2041-04-18', tags: ['family', 'boston', '2041'] },
  { id: 'seed-elena-letter', personId: 'elena', title: 'To whoever finds this', description: 'An unsent letter describing harbor alarms before the official warning.', type: 'letter', dataUrl: letterImage, createdAt: '2049-08-07', tags: ['letter', 'boston', 'evacuation'] },
  { id: 'seed-elena-audio', personId: 'elena', title: 'Field notes 17', description: 'A recovered recording about seed vaults and the north gate convoy.', type: 'audio', dataUrl: recorderImage, createdAt: '2057-11-02', tags: ['audio', 'svalbard', 'evacuation'] },
  { id: 'seed-mara-city', personId: 'mara', title: 'City above the water', description: 'Mara’s last photograph of the harbor skyline.', type: 'image', dataUrl: cityImage, createdAt: '2058-03-22', tags: ['boston', 'harbor', 'evacuation'] },
  { id: 'seed-jonas-ocean', personId: 'jonas', title: 'The open water', description: 'A memory of an ocean horizon before the shelters closed.', type: 'image', dataUrl: oceanImage, createdAt: '2055-06-14', tags: ['ocean', 'patagonia', 'surface'] },
]

function Breadcrumbs({ items }: { items: { label: string; action?: () => void }[] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={item.label}>{index > 0 && <i>/</i>}{item.action ? <button onClick={item.action}>{item.label}</button> : <b>{item.label}</b>}</span>)}</nav>
}

function Family({ go, enterMemory, selected, setSelected, memories, members, archiveName, isPrivate, onAccount, onSaveMemory }: {
  go: (s: Screen) => void; enterMemory: (ancestorId: string) => void; selected: FamilyMember;
  setSelected: (p: FamilyMember) => void; memories: StoredMemory[]; members: FamilyMember[];
  archiveName: string; isPrivate: boolean; onAccount: () => void;
  onSaveMemory: (draft: UploadDraft, file: File | null) => Promise<StoredMemory>;
}) {
  const [upload, setUpload] = useState(false)
  const selectedMemories = memories.filter((memory) => memory.personId === selected.id)
  return (
    <section className="inner-screen family-screen">
      <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Family Legacy' }]} />
      <div className="section-heading">
        <div><Kicker>BLOODLINE ARCHIVE · {archiveName.toUpperCase()}</Kicker><h2>Family <em>Constellation</em></h2><p>{isPrivate ? 'Your private family archive, secured by Supabase.' : 'Three generations. Forty-two fragments of a world your family once knew.'}</p></div>
        <div className="archive-actions"><button className="secondary" onClick={onAccount}><Icon name="family" /> {isPrivate ? 'SWITCH ARCHIVE' : 'SIGN IN'}</button><button className="secondary" onClick={() => setUpload(true)} disabled={members.length === 0}><Icon name="upload" /> UPLOAD MEMORY</button></div>
      </div>
      <div className="constellation">
        <svg className="connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M50 19 C50 35 38 38 34 51M34 51 L66 51M50 51 C50 66 50 70 50 82" />
        </svg>
        {members.map((person) => (
          <button key={person.id} className={`person-node ${selected.id === person.id ? 'selected' : ''}`} style={{ left: `${person.x}%`, top: `${person.y}%` }} onClick={() => setSelected(person)} aria-label={`Select ${person.name}, ${person.memories} memories`}>
            <span className="node-orbit" /><span className="node-image">{person.image ? <img src={person.image} alt="" /> : <Icon name="spark" />}</span>
            <span className="node-label"><b>{person.name}</b><small>{person.gen}</small></span>
          </button>
        ))}
        <span className="star s1" /><span className="star s2" /><span className="star s3" /><span className="star s4" />
      </div>
      <aside className={`ancestor-card ${selected.id === 'mara' ? 'mara-selected' : ''}`}>
        <div className="card-image"><img src={selected.image || oceanImage} alt={`Example archive portrait for ${selected.name}`} /><span>ARCHIVAL EXAMPLE</span></div>
        <Kicker>SELECTED ANCESTOR</Kicker>
        <h3>{selected.name}</h3><p className="years">{selected.years}</p>
        <p>{selected.biography || (selected.id === 'elena' ? 'Botanist, mother, keeper of forbidden seeds. Elena recorded the last rainfall above Shelter 12.' : selected.id === 'mara' ? 'Your mother at twenty: sketching the harbor from the kitchen window, saving songs on worn tape, and writing letters she never sent.' : 'A branch of your family story, preserved through images, sound, and written testimony.')}</p>
        {selected.id === 'mara' && <blockquote className="ancestor-quote">“If you ever forget the color of morning, I left it here for you.”<span>— Mara, field tape 04</span></blockquote>}
        <div className="memory-stats"><span><b>{isPrivate ? selectedMemories.length : selected.memories + selectedMemories.filter((m) => !m.id.startsWith('seed-')).length}</b> MEMORIES</span><span><b>{new Set(selectedMemories.map((m) => m.type)).size || 1}</b> MEDIA TYPES</span></div>
        <div className="memory-strip" aria-label={`${selected.name}'s available memories`}>
          {selectedMemories.slice(-3).map((memory) => <button key={memory.id} onClick={() => isPrivate && memory.dataUrl ? window.open(memory.dataUrl, '_blank', 'noopener,noreferrer') : reconstructedRoomIds.has(selected.id) && enterMemory(selected.id)} disabled={!isPrivate && !reconstructedRoomIds.has(selected.id)} title={isPrivate ? `Open private file for ${memory.title}` : reconstructedRoomIds.has(selected.id) ? `Enter ${memory.title}` : `${memory.title} is preserved; immersive room not yet reconstructed`}>
            {memory.type === 'image' && memory.dataUrl ? <img src={memory.dataUrl} alt="" /> : <Icon name={memory.type === 'audio' ? 'audio' : memory.type === 'letter' ? 'letter' : 'archive'} />}
            <span>{memory.title}</span>
          </button>)}
          {selectedMemories.length === 0 && <p className="empty-state">No preserved objects yet. Upload the first memory.</p>}
        </div>
        {reconstructedRoomIds.has(selected.id)
          ? <button className={`primary wide enter-memory ${selected.id === 'mara' ? 'featured' : ''}`} onClick={() => enterMemory(selected.id)}><span><small>STEP BEYOND THE ARCHIVE</small>ENTER {selected.name.split(' ')[0].toUpperCase()}'S MEMORY</span> <Icon name="arrow" /></button>
          : <div className="room-unavailable-note"><button className="secondary wide" disabled><Icon name="archive" /> MEMORY ROOM NOT YET RECONSTRUCTED</button><p>{selected.name}’s memories are preserved in the archive, but an immersive reconstruction is not yet available.</p></div>}
      </aside>
      {upload && <UploadMemory initialPerson={selected.id} members={members} persistent={isPrivate} onClose={() => setUpload(false)} onSave={async (draft, file) => { const memory = await onSaveMemory(draft, file); setSelected(members.find((p) => p.id === memory.personId) || selected); return memory }} />}
    </section>
  )
}

function UploadMemory({ initialPerson, members, persistent, onClose, onSave }: {
  initialPerson: string; members: FamilyMember[]; persistent: boolean; onClose: () => void;
  onSave: (draft: UploadDraft, file: File | null) => Promise<StoredMemory>;
}) {
  const [personId, setPersonId] = useState(initialPerson)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<MemoryType>('image')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  useEffect(() => () => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview) }, [preview])
  const [recMeta, setRecMeta] = useState<{
    mimeType: string
    durationSeconds: number
  } | null>(null)

  const [transcript, setTranscript] = useState<string | null>(null)
  const [transcriptionError, setTranscriptionError] = useState('')
  const [transcribing, setTranscribing] = useState(false)

  const clearTranscript = () => {
    setTranscript(null)
    setTranscriptionError('')
  }

  const transcribeRecording = async () => {
    if (!file || type !== 'audio' || saving || transcribing) return
    setTranscriptionError('')
    if (file.size > 2_000_000) {
      setTranscriptionError('Transcription accepts audio clips up to 2 MB.')
      return
    }
    if (!supabase) {
      setTranscriptionError('Open the configured Preview and sign in to transcribe audio.')
      return
    }

    setTranscribing(true)
    try {
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) throw new Error('Sign in to transcribe audio.')

      const form = new FormData()
      form.set('file', file)
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        body: form,
        signal: AbortSignal.timeout(45_000),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || typeof result?.text !== 'string') {
        throw new Error(typeof result?.error === 'string' ? result.error : 'Transcription is unavailable. Try again.')
      }
      setTranscript(result.text)
    } catch (cause) {
      setTranscriptionError(cause instanceof Error ? cause.message : 'Transcription failed.')
    } finally {
      setTranscribing(false)
    }
  }

  const saveRecording = async (recording: RecordingResult) => {
    setError('')
    if (recording.sizeBytes > 2_000_000) {
      setError('This recording exceeds 2 MB. Record a shorter memory.')
      return
    }

    try {
      const audioFile = new File(
        [recording.blob],
        `recording-${Date.now()}.${recording.extension}`,
        { type: recording.mimeType.split(';', 1)[0] },
      )

      const nextPreview = persistent ? URL.createObjectURL(audioFile) : await blobToDataUrl(audioFile)
      clearTranscript()
      setFile(audioFile)
      setPreview(nextPreview)
      setRecMeta({
        mimeType: audioFile.type,
        durationSeconds: recording.durationSeconds,
      })
    } catch {
      setError('The browser could not read this recording.')
    }
  }
  const chooseFile = (next: File | null) => {
    setError('')
    clearTranscript()
    setFile(next)
    setPreview('')
    setRecMeta(null)
    if (!next) return
    const maxBytes = persistent ? 50 * 1024 * 1024 : 2_000_000
    if (next.size > maxBytes) { setError(`Files may be at most ${persistent ? '50 MB' : '2 MB'}.`); setFile(null); return }
    const exactTypes = ['image/jpeg','image/png','image/webp','image/gif','audio/mpeg','audio/mp4','audio/wav','audio/webm','audio/ogg','video/mp4','video/webm','video/quicktime','application/pdf']
    const allowed = exactTypes.includes(next.type) && (type === 'image' ? next.type.startsWith('image/') : type === 'audio' ? next.type.startsWith('audio/') : type === 'video' ? next.type.startsWith('video/') : next.type === 'application/pdf')
    if (!allowed) { setError(`Choose a valid ${type} file.`); setFile(null); return }
    if (persistent) { setPreview(URL.createObjectURL(next)); return }
    const reader = new FileReader()
    reader.onerror = () => setError('The browser could not read this file.')
    reader.onload = () => setPreview(String(reader.result))
    reader.readAsDataURL(next)
  }
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (saving || transcribing) return
    if (!title.trim() || !description.trim()) return setError('Add both a title and a description.')
    if ((persistent || type !== 'letter') && (!file || !preview)) return setError(`Choose a ${type} file before saving.`)
    setSaving(true); setError('')
    try {
      await onSave({ personId, title: title.trim(), description: description.trim(), type, preview: preview || undefined, recording: type === 'audio' ? recMeta ?? undefined : undefined }, file)
      setSaved(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The memory could not be preserved.')
    } finally { setSaving(false) }
  }
  return <Modal title="Add to the bloodline" onClose={onClose} large>
    {saved ? <div className="form-success"><span><Icon name="spark" size={28} /></span><Kicker>MEMORY PRESERVED {persistent ? 'IN PRIVATE STORAGE' : 'LOCALLY'}</Kicker><h3>{title}</h3><p>It now appears in {members.find((p) => p.id === personId)?.name}’s archive{persistent ? ' and will survive a refresh.' : ' on this device.'}</p><button className="primary" onClick={onClose}>RETURN TO CONSTELLATION <Icon name="arrow" /></button></div>
    : <form className="archive-form" onSubmit={submit}>
      <p className="local-note"><b>{persistent ? 'PRIVATE SUPABASE ARCHIVE' : 'DEMO MODE'}</b> {persistent ? 'Files are encrypted in transit and stored in a private family path.' : 'Files are saved in this browser only. Sign in to preserve them across devices.'}</p>
      <div className="form-grid">
        <label>FAMILY MEMBER<select value={personId} onChange={(e) => setPersonId(e.target.value)}>{members.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>MEDIA TYPE<select disabled={saving || transcribing} value={type} onChange={(e) => { clearTranscript(); setType(e.target.value as MemoryType); setFile(null); setPreview(''); setRecMeta(null); setError('') }}><option value="image">Photograph</option><option value="audio">Audio</option><option value="video">Video</option>{persistent && <option value="document">PDF document</option>}{!persistent && <option value="letter">Written record</option>}</select></label>
      </div>
      <label>MEMORY TITLE<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={70} placeholder="e.g. The last summer rain" /></label>
      <label>DESCRIPTION<textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="What should future generations know?" /></label>
      {type !== 'letter' && <label className="file-field"><input type="file" disabled={saving || transcribing} accept={type === 'document' ? 'application/pdf' : `${type}/*`} onChange={(e) => chooseFile(e.target.files?.[0] || null)} /><span><Icon name="upload" /><b>{file ? file.name : `CHOOSE ${type.toUpperCase()} FILE`}</b><small>Maximum {persistent ? '50 MB · private cloud storage' : '2 MB · stored only on this device'}</small></span></label>}
      {preview && type === 'image' && <img className="upload-preview" src={preview} alt="Selected file preview" />}
      {type === 'audio' && !file && (
        <>
          <p className="echo-rec-note">OR RECORD NOW</p>
          <AudioRecorder
            confirmLabel="USE THIS RECORDING"
            onConfirm={saveRecording}
          />
        </>
      )}

      {type === 'audio' && preview && (
        <>
          <audio className="upload-media" src={preview} controls />
          <button type="button" className="text-button" disabled={saving || transcribing} onClick={transcribeRecording}>
            {transcribing ? 'Uploading and transcribing…' : transcriptionError ? 'Retry transcription' : 'Transcribe'}
          </button>
          {transcribing && <p role="status">Sending audio to ElevenLabs…</p>}
          {transcriptionError && <p className="form-error" role="alert">{transcriptionError}</p>}
          {transcript !== null && (
            <label>
              Transcript ready · review and edit
              <textarea value={transcript} onChange={(event) => setTranscript(event.target.value)} />
            </label>
          )}
          <button
            type="button"
            className="text-button"
            disabled={saving || transcribing}
            onClick={() => {
              clearTranscript()
              setFile(null)
              setPreview('')
              setRecMeta(null)
              setError('')
            }}
          >
            REMOVE AUDIO
          </button>
        </>
      )}
      {preview && type === 'video' && <video className="upload-media" src={preview} controls />}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary wide" type="submit" disabled={saving || transcribing}>{saving ? 'PRESERVING MEMORY…' : 'PRESERVE MEMORY'} <Icon name="archive" /></button>
    </form>}
  </Modal>
}

function AccountPanel({ user, authLoading, families, activeFamilyId, archiveMode, onClose, onSelectFamily, onDemo, onFamilyCreated, onAncestorCreated }: {
  user: User | null; authLoading: boolean; families: FamilyWithRole[]; activeFamilyId: string | null;
  archiveMode: 'demo' | 'private'; onClose: () => void; onSelectFamily: (id: string) => void;
  onDemo: () => void; onFamilyCreated: (family: FamilyWithRole) => void; onAncestorCreated: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [displayName, setDisplayName] = useState('')
  const [familyName, setFamilyName] = useState(''); const [ancestorName, setAncestorName] = useState('')
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); setMessage(''); try { await action() } catch (cause) { setError(cause instanceof Error ? cause.message : 'The request failed.') } finally { setBusy(false) } }
  const submitAuth = (event: React.FormEvent) => { event.preventDefault(); void run(async () => {
    if (mode === 'login') await signInWithEmail(email, password)
    else { const result = await signUpWithEmail(email, password, displayName); setMessage(result.session ? 'Account created and signed in.' : 'Account created. Check your email to confirm the address, then sign in.') }
  }) }
  return <Modal title="Archive access" onClose={onClose} large>
    {!isSupabaseConfigured ? <div className="form-success"><Kicker>DEMO MODE ACTIVE</Kicker><h3>Supabase credentials are not configured.</h3><p>Add the project URL and publishable key to <code>.env.local</code>, then restart Vite. The fictional demo remains available.</p><button className="primary" onClick={onClose}>RETURN TO DEMO</button></div>
    : authLoading ? <div className="form-success"><Kicker>AUTHENTICATING</Kicker><p>Restoring the secure session…</p></div>
    : !user ? <form className="archive-form" onSubmit={submitAuth}>
      <div className="form-grid"><button type="button" className={mode === 'login' ? 'primary' : 'secondary'} onClick={() => setMode('login')}>SIGN IN</button><button type="button" className={mode === 'signup' ? 'primary' : 'secondary'} onClick={() => setMode('signup')}>CREATE ACCOUNT</button></div>
      {mode === 'signup' && <label>DISPLAY NAME<input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} /></label>}
      <label>EMAIL<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>
      <label>PASSWORD<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
      {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="local-note" role="status">{message}</p>}
      <button className="primary wide" disabled={busy}>{busy ? 'CONNECTING…' : mode === 'login' ? 'ENTER PRIVATE ARCHIVE' : 'CREATE ARCHIVE IDENTITY'}</button>
    </form>
    : <div className="archive-form">
      <p className="local-note"><b>AUTHENTICATED</b> {user.email}</p>
      <label>SELECT ARCHIVE<select value={archiveMode === 'demo' ? 'demo' : activeFamilyId || ''} onChange={(e) => e.target.value === 'demo' ? onDemo() : onSelectFamily(e.target.value)}><option value="demo">Voss / Vale fictional demo</option>{families.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.role}</option>)}</select></label>
      <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void run(async () => { const created = await createFamily(familyName.trim()); onFamilyCreated({ ...created, role: 'owner' }); setFamilyName(''); setMessage('Private family archive created.') }) }}>
        <label>NEW FAMILY NAME<input value={familyName} onChange={(e) => setFamilyName(e.target.value)} required maxLength={120} /></label><button className="secondary" disabled={busy}>CREATE FAMILY</button>
      </form>
      {archiveMode === 'private' && activeFamilyId && <form className="form-grid" onSubmit={(event) => { event.preventDefault(); void run(async () => { await createAncestor({ familyId: activeFamilyId, name: ancestorName.trim() }); setAncestorName(''); onAncestorCreated(); setMessage('Ancestor added to this archive.') }) }}>
        <label>ADD ANCESTOR<input value={ancestorName} onChange={(e) => setAncestorName(e.target.value)} required maxLength={160} /></label><button className="secondary" disabled={busy}>ADD ANCESTOR</button>
      </form>}
      {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="local-note" role="status">{message}</p>}
      <div className="form-grid"><button className="primary" onClick={onClose}>OPEN SELECTED ARCHIVE</button><button className="secondary" onClick={() => void run(async () => { await signOut(); onDemo() })}>SIGN OUT</button></div>
    </div>}
  </Modal>
}

const hotspotData = {
  photo: { icon: 'camera' as IconName, label: 'The Voss family photograph', hint: 'A spring afternoon in 2041', meta: 'FABRICATED DEMO PHOTOGRAPH · 18 APR 2041', title: 'The afternoon the rain stopped', image: oldPhotosImage, text: 'Three-year-old Mara sits between her mother, Elena, and grandfather Tomas outside their harbor apartment. Years later, Mara wrote on the reverse: “I remember the wet pavement more than the faces.”' },
  letter: { icon: 'letter' as IconName, label: 'Mara’s unsent letter', hint: 'Written hours before evacuation', meta: 'FABRICATED DEMO LETTER · 22 MAR 2058', title: 'To whoever finds this', image: paperImage, text: 'Twenty-year-old Mara wrote this while Elena packed their evacuation cases. It records harbor alarms beginning before the Directorate’s public warning.' },
  audio: { icon: 'audio' as IconName, label: 'Kitchen tape recorder', hint: 'Mara’s voice at age twenty', meta: 'FABRICATED DEMO RECORDING · 21 MAR 2058', title: 'Rain against the kitchen glass', image: recorderImage, text: 'Recorded the evening before evacuation, Mara hums a song Jonas taught her, then describes unmarked vehicles moving toward the north gate.' },
  keepsake: { icon: 'spark' as IconName, label: 'Brass seed locket', hint: 'A gift from Elena to Mara', meta: 'FABRICATED DEMO KEEPSAKE · 2056–2080', title: 'The seed she carried below', image: scrapbookImage, text: 'Inside the locket is a pressed calendula seed from Elena’s greenhouse. Mara wore it through the evacuation and later gave it to Lia on her eighteenth birthday.' },
  window: { icon: 'earth' as IconName, label: 'The harbor window', hint: 'Look toward the evacuation route', meta: 'RECONSTRUCTED ENVIRONMENT · 89% CONFIDENCE', title: 'The convoy before the warning', image: oceanImage, text: 'This reconstructed view combines Mara’s photographs, municipal geometry, and her 2058 letter. At 04:51, lights appear on the north bridge—fifty-one minutes before the official warning.' },
}

function Room({ go, openHumanLegacy, ancestor, memories }: { go: (s: Screen) => void; openHumanLegacy: (locationSlug: string, recordSlug?: string) => void; ancestor: FamilyMember; memories: StoredMemory[] }) {
  const [open, setOpen] = useState<keyof typeof hotspotData | null>(null)
  const [lastExplored, setLastExplored] = useState<keyof typeof hotspotData | null>(null)
  const [explored, setExplored] = useState<(keyof typeof hotspotData)[]>([])
  const [archiveOpen, setArchiveOpen] = useState(false)
  const ancestorMemories = memories.filter((memory) => memory.personId === ancestor.id)
  const openArtifact = (key: keyof typeof hotspotData) => {
    setOpen(key)
    setLastExplored(key)
    setExplored((current) => current.includes(key) ? current : [...current, key])
  }
  const complete = explored.length === Object.keys(hotspotData).length
  return (
    <section className={`room-screen memory-world ${open ? 'memory-is-open' : ''} ${lastExplored ? `last-${lastExplored}` : ''}`} style={{ backgroundImage: `url(${roomImage})` }}>
      <div className="room-depth" aria-hidden="true">
        <div className="sunbeam" /><div className="floating-dust">{Array.from({ length: 16 }, (_, index) => <i key={index} />)}</div>
        <div className="foreground-table" style={{ backgroundImage: `url(${scrapbookImage})` }} />
      </div>
      <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Family Legacy', action: () => go('family') }, { label: `${ancestor.name}'s Room` }]} />
      <div className="room-top">
        <button className="text-button" onClick={() => go('family')}>← BACK TO FAMILY</button>
        <div><Kicker>RECONSTRUCTED MEMORY · 87% CONFIDENCE</Kicker><h2>{ancestor.name.split(' ')[0]}'s Room, <em>2058</em></h2></div>
        <span className="room-time">18:42 · COASTAL SECTOR</span>
      </div>
      <p className="room-instruction"><span>THIS ROOM REMEMBERS</span>Move gently. The objects Mara touched still carry pieces of her story.</p>
      {(Object.keys(hotspotData) as (keyof typeof hotspotData)[]).map((key, i) => (
        <button key={key} className={`hotspot hotspot-${i + 1} ${explored.includes(key) ? 'explored' : ''} ${lastExplored === key ? 'last-explored' : ''}`} onClick={() => openArtifact(key)} aria-label={`Open ${hotspotData[key].label}: ${hotspotData[key].hint}`}>
          <span className="hotspot-pulse" /><span className="hotspot-icon"><Icon name={hotspotData[key].icon} /></span><span className="hotspot-label"><b>{hotspotData[key].label}</b><small>{hotspotData[key].hint}</small></span>{explored.includes(key) && <i className="explored-mark">VIEWED</i>}
        </button>
      ))}
      <nav className="artifact-list" aria-label="Artifacts in Mara Voss's memory room">
        <span>MEMORIES IN THIS ROOM · {explored.length}/{Object.keys(hotspotData).length} EXPLORED</span>
        <div>{(Object.keys(hotspotData) as (keyof typeof hotspotData)[]).map((key) => <button key={key} className={explored.includes(key) ? 'explored' : ''} onClick={() => openArtifact(key)}><Icon name={hotspotData[key].icon} /><span><b>{hotspotData[key].label}</b><small>{hotspotData[key].hint}</small></span><i>{explored.includes(key) ? '✓' : '→'}</i></button>)}</div>
      </nav>
      <button className="room-archive-button secondary" onClick={() => setArchiveOpen(true)}><Icon name="archive" /> VIEW {ancestorMemories.length} ARCHIVE OBJECTS</button>
      <div className="room-footer"><span><i className="cyan-dot" /> ORIGINAL</span><span><i className="amber-dot" /> CONTRIBUTED</span><span><i className="white-dot" /> RECONSTRUCTED</span><small>Example media shown for prototype</small></div>
      {open && <MemoryObject objectKey={open} openHumanLegacy={openHumanLegacy} onClose={() => setOpen(null)} />}
      {archiveOpen && <Modal title={`${ancestor.name}'s archive`} onClose={() => setArchiveOpen(false)} large>
        <div className="object-list">{ancestorMemories.map((memory) => <article key={memory.id}>
          <div>{memory.type === 'image' && memory.dataUrl ? <img src={memory.dataUrl} alt="" /> : <Icon name={memory.type === 'audio' ? 'audio' : memory.type === 'letter' ? 'letter' : 'archive'} size={24} />}</div>
          <span><small>{memory.type.toUpperCase()} · {new Date(memory.createdAt).getFullYear()}</small><b>{memory.title}</b><p>{memory.description}</p></span>
          {memory.type === 'audio' && memory.dataUrl?.startsWith('data:audio') && <audio controls src={memory.dataUrl} />}
        </article>)}</div>
      </Modal>}
      {complete && !open && <div className="memory-complete" role="status"><span><Icon name="spark" size={24} /></span><div><Kicker>MARA’S STORY · PRIMARY MEMORIES EXPLORED</Kicker><h3>You found what she wanted Lia to remember.</h3><p>The room remains open. Follow the window memory into the Human Legacy archive, or return to the family constellation.</p></div><button className="primary" onClick={() => openHumanLegacy('boston-harbor', 'gate-transit-log-17-b')}>FOLLOW THE HARBOR EVIDENCE <Icon name="arrow" /></button><button className="text-button" onClick={() => go('family')}>RETURN TO FAMILY</button></div>}
    </section>
  )
}

function MemoryObject({ objectKey, openHumanLegacy, onClose }: { objectKey: keyof typeof hotspotData; openHumanLegacy: (locationSlug: string, recordSlug?: string) => void; onClose: () => void }) {
  const item = hotspotData[objectKey]
  return <Modal title={item.title} onClose={onClose} large variant="memory">
    <div className={`memory-object memory-object-${objectKey}`}>
      {objectKey === 'photo' && <><div className="polaroid"><img src={item.image} alt="Fabricated demo photograph representing Mara Voss with her family" /><span>18 APR 2041 · VOSS FAMILY HOME</span></div><div className="object-story"><Kicker>{item.meta}</Kicker><h3>Before Mara could remember <em>the sky.</em></h3><p>{item.text}</p><div className="archive-context"><b>CURATOR’S NOTE</b><p>This fabricated demo image represents a photograph Lia preserved with Mara’s effects. The people shown are illustrative, not real historical subjects.</p></div></div></>}
      {objectKey === 'audio' && <><div className="recorder-display"><img src={item.image} alt="Example vintage recording device representing Mara's recorder" /><div className="tape-reels"><i /><i /></div><span className="demo-stamp">FABRICATED DEMO DEVICE</span></div><div className="object-story"><Kicker>{item.meta}</Kicker><h3>Mara’s voice, in the <em>kitchen.</em></h3><p>{item.text}</p><AudioPlayer src="/audio/mara-rain-kitchen-glass.mp3" title={item.title} ancestorName="Mara Voss" dateLabel="21 March 2058" sourceType="ai-generated-demo" transcript={MARA_KITCHEN_TRANSCRIPT} /></div></>}
      {objectKey === 'letter' && <><div className="letter-sheet"><small>22 March 2058 · 05:29</small><p>To whoever finds this,</p><p>They moved the departure forward. The public bulletin says weather, but we heard the harbor alarms before dawn.</p><p>Mother put my blue coat by the door. She says we are going to see the trains. I don’t think that is true.</p><b>— Mara Voss, age 20</b></div><div className="object-story"><Kicker>{item.meta}</Kicker><h3>The letter Mara <em>hid.</em></h3><p>{item.text}</p><div className="archive-context"><b>RECOVERY</b><p>Fictional demo record: found inside Elena Voss’s cookbook in 2080. The narrative connects to the Boston Harbor evacuation case.</p></div><button className="primary" onClick={() => openHumanLegacy('boston-harbor', 'elena-voss-letter')}>OPEN HUMAN LEGACY RECORD <Icon name="arrow" /></button></div></>}
      {objectKey === 'keepsake' && <><div className="keepsake-display"><img src={item.image} alt="Fabricated demo arrangement representing Mara's brass seed locket" /><div className="locket"><i /></div><span>FABRICATED DEMO KEEPSAKE</span></div><div className="object-story"><Kicker>{item.meta}</Kicker><h3>A small piece of the <em>surface.</em></h3><p>{item.text}</p><div className="archive-context"><b>FAMILY PROVENANCE</b><p>Elena Voss → Mara Voss → Lia Vale. The locket represents the family’s connection to Elena’s forbidden seed work.</p></div></div></>}
      {objectKey === 'window' && <><div className="window-memory"><img src={item.image} alt="Reconstructed demo view of Boston Harbor from Mara Voss's window" /><span>RECONSTRUCTED ENVIRONMENT · COLOR INTERPRETIVE</span></div><div className="object-story"><Kicker>{item.meta}</Kicker><h3>What Mara saw <em>before the warning.</em></h3><p>{item.text}</p><div className="evidence-link"><span>04:51</span><div><b>NORTH BRIDGE CONVOY</b><p>Matches recovered Gate Transit Log 17-B in Human Legacy.</p></div></div><button className="primary" onClick={() => openHumanLegacy('boston-harbor', 'gate-transit-log-17-b')}>FOLLOW EVIDENCE TO HUMAN LEGACY <Icon name="arrow" /></button></div></>}
    </div>
  </Modal>
}

function MemoryRoomUnavailable({ ancestor, memories, go }: { ancestor: FamilyMember; memories: StoredMemory[]; go: (s: Screen) => void }) {
  const preserved = memories.filter((memory) => memory.personId === ancestor.id)
  return <section className="inner-screen unavailable-room">
    <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Family Legacy', action: () => go('family') }, { label: ancestor.name }]} />
    <div className="unavailable-room-content">
      <div className="card-image"><img src={ancestor.image || oceanImage} alt={`Archive portrait for ${ancestor.name}`} /><span>ARCHIVAL EXAMPLE</span></div>
      <div>
        <Kicker>{ancestor.gen} · {ancestor.years}</Kicker>
        <h2>{ancestor.name}’s room is <em>not yet reconstructed.</em></h2>
        <p>{preserved.length ? `${preserved.length} preserved ${preserved.length === 1 ? 'memory is' : 'memories are'} available in ${ancestor.name}’s Family Constellation profile.` : `${ancestor.name}’s archive profile remains available in the Family Constellation.`} The immersive environment has not been completed, so no other ancestor’s room is shown in its place.</p>
        <button className="primary" onClick={() => go('family')}>RETURN TO {ancestor.name.toUpperCase()}’S PROFILE <Icon name="arrow" /></button>
      </div>
    </div>
  </section>
}

function Echoes({ go, openHumanLegacy, memories }: { go: (s: Screen) => void; openHumanLegacy: (locationSlug: string) => void; memories: StoredMemory[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const [archiveLocations, setArchiveLocations] = useState(fallbackHistoricalLocations)
  const [archiveSource, setArchiveSource] = useState<'live' | 'fallback'>(isSupabaseConfigured ? 'live' : 'fallback')
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let current = true
    void getHistoricalArchive().then((items) => { if (current) { setArchiveLocations(items); setArchiveSource('live') } })
      .catch(() => { if (current) { setArchiveLocations(fallbackHistoricalLocations); setArchiveSource('fallback') } })
    return () => { current = false }
  }, [])
  const suggestions = memories.flatMap((memory) => archiveLocations.map((location) => {
    const historicalTerms = new Set([...location.tags, ...location.records.flatMap((record) => record.tags)])
    const shared = memory.tags.filter((tag) => historicalTerms.has(tag))
    return { memory, location, shared, score: Math.min(94, 52 + shared.length * 14) }
  })).filter((match) => match.shared.length > 0).sort((a, b) => b.score - a.score)
  const active = suggestions.find((suggestion) => `${suggestion.memory.id}-${suggestion.location.id}` === selected)
  return <section className="inner-screen echoes-screen">
    <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Memory Echoes' }]} />
    <div className="section-heading compact"><div><Kicker>DETERMINISTIC DISCOVERY FIELD · {archiveSource === 'live' ? 'DATABASE RECORDS' : 'LABELED DEMO FALLBACK'}</Kicker><h2>Memory <em>Echoes</em></h2><p>Potential links surfaced from shared dates, places, and archive tags.</p></div><div className="case-status"><span>{suggestions.length}</span> POTENTIAL LINKS</div></div>
    <div className="echo-layout">
      <div className="echo-list">
        {suggestions.length ? suggestions.map((suggestion, index) => {
          const id = `${suggestion.memory.id}-${suggestion.location.id}`
          return <button key={id} className={selected === id ? 'active' : ''} onClick={() => setSelected(id)}>
            <span className="echo-number">0{index + 1}</span>
            <div><small>{family.find((p) => p.id === suggestion.memory.personId)?.name} · {suggestion.memory.type.toUpperCase()}</small><b>{suggestion.memory.title}</b><p>may connect to <em>{suggestion.location.name}</em></p><div>{suggestion.shared.map((tag) => <i key={tag}>#{tag}</i>)}</div></div>
            <strong>{suggestion.score}%<small>MATCH</small></strong>
          </button>
        }) : <div className="echo-empty"><Icon name="spark" size={28} /><h3>No echoes found yet</h3><p>Upload a memory mentioning Boston, Svalbard, Patagonia, the ocean, surface, harbor, or evacuation.</p><button className="secondary" onClick={() => go('family')}>ADD A FAMILY MEMORY</button></div>}
      </div>
      <aside className="echo-inspector">
        {active ? <><Kicker>POTENTIAL CONNECTION · NOT CONFIRMED</Kicker><h3>{active.memory.title}</h3><div className="echo-line"><span>{family.find((p) => p.id === active.memory.personId)?.name}</span><i /><span>{active.location.name}</span></div><p>Both records share {active.shared.map((tag) => `“${tag}”`).join(' and ')}. This rule-based match suggests where to investigate; it does not prove the records describe the same event.</p><div className="caution"><b>HOW THIS WAS MATCHED</b><p>Exact overlap of seeded tags, location names, and dates. No AI inference is presented as fact.</p></div><button className="primary wide" onClick={() => openHumanLegacy(active.location.slug)}>INVESTIGATE CONNECTION <Icon name="arrow" /></button></>
        : <div className="locked-discovery"><span><Icon name="spark" size={26} /></span><h3>Select an echo</h3><p>Inspect why a family memory may relate to a historical record.</p></div>}
      </aside>
    </div>
  </section>
}

const fallbackEvidence = [
  { id: 1, type: 'ORIGINAL ARCHIVE', time: '05:42', title: 'Directorate Bulletin', quote: '“Evacuation commenced at first warning. All citizens were given equal passage.”', source: 'PUBLIC TRANSMISSION 6A', tone: 'cyan' },
  { id: 2, type: 'CONTRIBUTED MEMORY', time: '05:17', title: 'Elena’s Letter', quote: '“The convoy had already gone. I watched their lights cross the bridge before the sirens.”', source: 'VOSS FAMILY ARCHIVE', tone: 'amber' },
  { id: 3, type: 'ORIGINAL ARCHIVE', time: '04:51', title: 'Gate Transit Log', quote: 'DIRECTORATE PRIORITY · 17 VEHICLES · CLEARANCE: ORPHEUS', source: 'RECOVERED SYSTEM LOG', tone: 'cyan' },
]

function Reconstruction({ go }: { go: (s: Screen) => void }) {
  const [selected, setSelected] = useState<number[]>([])
  const [solved, setSolved] = useState(false)
  const [evidenceItems, setEvidenceItems] = useState(fallbackEvidence)
  const [evidenceSource, setEvidenceSource] = useState<'live' | 'fallback'>(isSupabaseConfigured ? 'live' : 'fallback')
  useEffect(() => {
    if (!isSupabaseConfigured) return
    let current = true
    void getHistoricalArchive().then((archive) => {
      const boston = archive.find((location) => location.slug === 'boston-harbor')
      const slugs = ['directorate-evacuation-bulletin', 'elena-voss-letter', 'gate-transit-log-17-b']
      const records = slugs.map((slug) => boston?.records.find((record) => record.slug === slug)).filter(Boolean)
      if (current && records.length === 3) {
        setEvidenceItems(records.map((record, index) => ({
          id: index + 1,
          type: record!.origin_kind === 'testimony' ? 'CONTRIBUTED TESTIMONY' : 'ORIGINAL ARCHIVE',
          time: record!.event_at ? new Date(record!.event_at).toISOString().slice(11, 16) : 'UNKNOWN',
          title: record!.title,
          quote: record!.content,
          source: record!.provenance.toUpperCase(),
          tone: record!.origin_kind === 'testimony' ? 'amber' : 'cyan',
        }))); setEvidenceSource('live')
      } else if (current) setEvidenceSource('fallback')
    }).catch(() => { if (current) setEvidenceSource('fallback') })
    return () => { current = false }
  }, [])
  const toggle = (id: number) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  return (
    <section className="inner-screen reconstruction-screen">
      <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Lost Earth', action: () => go('earth') }, { label: 'Historical Mystery' }]} />
      <div className="section-heading compact">
        <div><Kicker>MEMORY RECONSTRUCTION · CASE 07 · {evidenceSource === 'live' ? 'DATABASE EVIDENCE' : 'LABELED DEMO FALLBACK'}</Kicker><h2>The <em>First Convoy</em></h2><p>Connect the fragments. Preserve the contradictions.</p></div>
        <div className="case-status"><span>{selected.length}/3</span> EVIDENCE SELECTED</div>
      </div>
      <div className="evidence-workspace">
        <div className="evidence-field">
          <div className="field-label">{solved ? 'CONNECTION COMPLETE' : 'INSPECT AND SELECT ALL THREE FRAGMENTS'}</div>
          {evidenceItems.map((item) => (
            <button key={item.id} className={`evidence-card ${selected.includes(item.id) ? 'selected' : ''} ${item.tone}`} onClick={() => toggle(item.id)}>
              <span className="evidence-index">0{item.id}</span><span className="select-box">{selected.includes(item.id) ? '×' : '+'}</span>
              <small>{item.type} · {item.time}</small><h3>{item.title}</h3><blockquote>{item.quote}</blockquote><footer>{item.source}</footer>
            </button>
          ))}
          <svg className={`evidence-lines ${solved ? 'visible' : ''}`} viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M18 26L50 61L82 28M18 26L82 28" /></svg>
        </div>
        <aside className={`discovery-panel ${solved ? 'revealed' : ''}`}>
          {!solved ? <div className="locked-discovery"><span><Icon name="spark" size={26} /></span><h3>Discovery unresolved</h3><p>{selected.length < 3 ? 'Inspect and select the remaining evidence fragments.' : 'All evidence is selected. Connect the clues to test their chronology.'}</p><div className="progress"><i style={{ width: `${(selected.length / 3) * 100}%` }} /></div><button className="primary wide connect-clues" disabled={selected.length < 3} onClick={() => setSolved(true)}>CONNECT SELECTED CLUES <Icon name="spark" /></button></div>
          : <><Kicker>CONNECTION REVEALED</Kicker><h3>The evacuation began <em>before</em> the warning.</h3><p>The gate log supports Elena’s timing and conflicts with the public bulletin. A Directorate convoy departed 51 minutes before the official alarm.</p>
            <div className="caution"><b>INTERPRETIVE CAUTION</b><p>This is a supported connection, not an established conclusion. The convoy’s purpose and passengers remain unknown.</p></div>
            <div className="confidence"><span>RELATIONSHIP CONFIDENCE</span><b>HIGH · 89%</b></div>
            <button className="secondary wide" onClick={() => { setSolved(false); setSelected([]) }}>RESET INVESTIGATION</button><button className="primary wide" onClick={() => go('capsule')}>PRESERVE YOUR TESTIMONY <Icon name="arrow" /></button></>}
        </aside>
      </div>
    </section>
  )
}

function Capsule({ go, capsules, saveCapsule }: { go: (s: Screen) => void; capsules: StoredCapsule[]; saveCapsule: (capsule: StoredCapsule) => void }) {
  const [step, setStep] = useState(0)
  const [letter, setLetter] = useState('I want you to know that before the shelters, your family stood beneath an open sky. We kept asking questions, even when answers were hidden.')
  const [created, setCreated] = useState(false)
  const [recipient, setRecipient] = useState('My descendants')
  const [unlockYears, setUnlockYears] = useState(30)
  const [attachment, setAttachment] = useState<{ name: string; url: string; type: string } | null>(null)
  const [error, setError] = useState('')
  const [voice, setVoice] = useState<{ url: string; mimeType: string; durationSeconds: number } | null>(null)
  const saveVoice = async (r: RecordingResult) => {
    setError('')
    if (r.sizeBytes > 2_000_000) return setError('This recording is too large for local browser storage. Record a shorter message.')
    try { setVoice({ url: await blobToDataUrl(r.blob), mimeType: r.mimeType, durationSeconds: r.durationSeconds }) }
    catch { setError('The browser could not store this recording.') }
  }
  const attachFile = (file: File | null) => {
    setError('')
    if (!file) return
    if (file.size > 2_000_000) return setError('Attachments must be under 2 MB for local browser storage.')
    if (!file.type.startsWith('image/') && !file.type.startsWith('audio/')) return setError('Choose an image or audio recording.')
    const reader = new FileReader()
    reader.onerror = () => setError('The browser could not read this attachment.')
    reader.onload = () => setAttachment({ name: file.name, url: String(reader.result), type: file.type })
    reader.readAsDataURL(file)
  }
  const seal = () => {
    if (!letter.trim()) return setError('Write a message before sealing the capsule.')
    saveCapsule({ id: `capsule-${Date.now()}`, message: letter.trim(), recipient, unlockYear: 2087 + unlockYears, attachmentName: attachment?.name, attachmentUrl: attachment?.url, voiceUrl: voice?.url, voiceMimeType: voice?.mimeType, voiceDurationSeconds: voice?.durationSeconds, createdAt: new Date().toISOString() })
    setCreated(true)
  }
  if (created) return <section className="capsule-complete"><div className="capsule-object"><span /><i /></div><Kicker>CAPSULE ECHO–7A–2087 SEALED LOCALLY</Kicker><h2>For those who come <em>after us.</em></h2><p>Your capsule is stored on this device and simulates an unlock in {2087 + unlockYears}. Real scheduled delivery and identity verification require a secure backend.</p><button className="secondary" onClick={() => { setCreated(false); setStep(0); setVoice(null) }}>CREATE ANOTHER</button></section>
  return (
    <section className="inner-screen capsule-screen">
      <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Time Capsules' }]} />
      <div className="section-heading compact"><div><Kicker>FUTURE ARCHIVE</Kicker><h2>Time <em>Capsule</em></h2><p>Leave more than a record. Leave a voice they can recognize.</p></div><span className="autosave"><i /> SAVED LOCALLY · {capsules.length} SEALED</span></div>
      <div className="capsule-layout">
        <nav className="capsule-steps" aria-label="Capsule creation steps">
          {['Voice message', 'Photographs', 'Written letter', 'Recipients', 'Preview capsule'].map((s, i) => <button className={step === i ? 'active' : ''} onClick={() => setStep(i)} key={s}><span>0{i + 1}</span><b>{s}</b><i /></button>)}
        </nav>
        <div className="capsule-editor">
          {step === 0 && <div className="editor-section"><Kicker>01 · YOUR VOICE</Kicker><h3>Speak to someone you may never meet.</h3><p>Record with your microphone. Your browser will ask for permission, and the recording stays in this browser.</p>
          {voice ? <div className="voice-saved"><Kicker>VOICE MESSAGE SAVED · {Math.round(voice.durationSeconds)}s</Kicker><audio controls src={voice.url} /><button type="button" className="text-button" onClick={() => setVoice(null)}>REMOVE AND RECORD AGAIN</button></div> : <AudioRecorder confirmLabel="USE THIS VOICE MESSAGE" onConfirm={saveVoice} />}
          </div>}
          {step === 1 && <div className="editor-section"><Kicker>02 · ATTACHMENT</Kicker><h3>Choose what they should see or hear.</h3><p>Add one photograph or audio recording. It is stored only in this browser.</p><div className="photo-upload-grid">{attachment && <div className="added-photo">{attachment.type.startsWith('image/') ? <img src={attachment.url} alt="Capsule attachment preview" /> : <div className="audio-attachment"><Icon name="audio" size={30} /><audio controls src={attachment.url} /></div>}<button onClick={() => setAttachment(null)} aria-label="Remove attachment">×</button></div>}<label className="add-photo"><input type="file" accept="image/*,audio/*" onChange={(e) => attachFile(e.target.files?.[0] || null)} /><Icon name="plus" /><b>ADD PHOTO OR RECORDING</b><span>Maximum 2 MB</span></label></div></div>}
          {step === 2 && <div className="editor-section"><Kicker>03 · WRITTEN LETTER</Kicker><h3>Words for the future.</h3><textarea value={letter} onChange={(e) => setLetter(e.target.value)} aria-label="Letter to future descendants" /><span className="char-count">{letter.length} / 1,200 CHARACTERS</span></div>}
          {step === 3 && <div className="editor-section"><Kicker>04 · RECIPIENTS</Kicker><h3>Who should receive this memory?</h3><div className="recipient-options">{['My descendants', 'Future generation 04', 'Public archive'].map((option) => <button key={option} className={recipient === option ? 'selected' : ''} onClick={() => setRecipient(option)}><Icon name={option === 'Public archive' ? 'archive' : 'family'} /><span><b>{option}</b><small>{option === 'Public archive' ? 'Available to all future residents' : 'Simulated identity-linked recipient'}</small></span><i>{recipient === option ? '✓' : ''}</i></button>)}</div><label className="date-field">UNSEAL AFTER <input type="number" min="1" max="100" value={unlockYears} onChange={(e) => setUnlockYears(Math.max(1, Math.min(100, Number(e.target.value))))} /> YEARS <span>EST. {2087 + unlockYears}</span></label></div>}
          {step === 4 && <div className="editor-section preview-section"><Kicker>05 · FINAL REVIEW</Kicker><h3>A capsule for tomorrow.</h3><div className="capsule-preview"><div className="mini-core"><span /></div><div><small>ECHO–7A–2087</small><h4>TO {recipient.toUpperCase()}</h4><p>{attachment ? `1 attachment · ${attachment.name}` : 'Message only'}</p><span>SIMULATED UNSEAL {2087 + unlockYears}</span></div></div><div className="preview-quote">“{letter.slice(0, 110)}…”</div><div className="truth-note"><Icon name="archive" /><p><b>Local prototype limitation</b>Saved capsules persist in this browser. Real future delivery requires backend scheduling, durable storage, and recipient verification.</p></div>{capsules.length > 0 && <div className="capsule-archive"><Kicker>SEALED ON THIS DEVICE</Kicker>{capsules.map((capsule) => <article key={capsule.id}><span><Icon name="archive" /></span><div><b>{capsule.recipient}</b><small>UNLOCK {capsule.unlockYear} · {capsule.attachmentName || 'MESSAGE ONLY'}</small></div></article>)}</div>}</div>}
          {error && <p className="form-error capsule-error" role="alert">{error}</p>}
          <div className="editor-controls"><button className="text-button" disabled={step === 0} onClick={() => setStep(step - 1)}>← PREVIOUS</button><span>STEP {step + 1} OF 5</span>{step < 4 ? <button className="primary" onClick={() => setStep(step + 1)}>CONTINUE <Icon name="arrow" /></button> : <button className="primary amber" onClick={seal}>SEAL CAPSULE <Icon name="spark" /></button>}</div>
        </div>
      </div>
    </section>
  )
}

function Modal({ title, onClose, children, large = false, variant = 'archive' }: { title: string; onClose: () => void; children: React.ReactNode; large?: boolean; variant?: 'archive' | 'memory' }) {
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [onClose])
  return <div className={`modal-backdrop ${variant === 'memory' ? 'memory-backdrop' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className={`modal ${large ? 'large' : ''} ${variant === 'memory' ? 'memory-modal' : ''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-header"><span>{variant === 'memory' ? 'MARA VOSS · LIVING MEMORY' : 'ARCHIVE OBJECT'}</span><b>{title}</b><button onClick={onClose} aria-label={`Close ${title}`}><Icon name="close" /></button></div><div className="modal-body">{children}</div></div></div>
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('vault')
  const [transitioning, setTransitioning] = useState(false)
  const [selectedAncestorId, setSelectedAncestorId] = usePersistentState<string>('project-echo-selected-ancestor-v1', family[0].id)
  const [memories, setMemories] = usePersistentState<StoredMemory[]>('project-echo-memories-v1', seededMemories)
  const [capsules, setCapsules] = usePersistentState<StoredCapsule[]>('project-echo-capsules-v1', [])
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [accountOpen, setAccountOpen] = useState(false)
  const [families, setFamilies] = useState<FamilyWithRole[]>([])
  const [activeFamilyId, setActiveFamilyId] = usePersistentState<string | null>('project-echo-active-family-id-v1', null)
  const [archiveMode, setArchiveMode] = usePersistentState<'demo' | 'private'>('project-echo-archive-mode-v1', 'demo')
  const [privateMembers, setPrivateMembers] = useState<FamilyMember[]>([])
  const [privateMemories, setPrivateMemories] = useState<StoredMemory[]>([])
  const [archiveError, setArchiveError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [humanTarget, setHumanTarget] = useState<{ locationSlug: string; recordSlug?: string; autoOpen: boolean }>({
    locationSlug: 'boston-harbor', autoOpen: false,
  })

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    let mounted = true
    void getCurrentUser().then((current) => { if (mounted) { setUser(current); setAuthLoading(false) } })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) { setUser(session?.user ?? null); setAuthLoading(false) }
    })
    return () => { mounted = false; data.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!user) { setFamilies([]); setActiveFamilyId(null); setArchiveMode('demo'); return }
    let current = true
    void getMyFamilies().then((items) => {
      if (current) {
        setFamilies(items)
        if (items.length > 0 && archiveMode === 'private' && (!activeFamilyId || !items.some((f) => f.id === activeFamilyId))) {
          setActiveFamilyId(items[0].id)
        }
      }
    }).catch((cause) => {
      if (current) setArchiveError(cause instanceof Error ? cause.message : 'Could not load families.')
    })
    return () => { current = false }
  }, [user, refreshVersion, archiveMode, activeFamilyId])

  useEffect(() => {
    if (!user || archiveMode !== 'private' || !activeFamilyId) { setPrivateMembers([]); setPrivateMemories([]); return }
    let current = true
    setArchiveError('')
    void (async () => {
      const rows = await getAncestors(activeFamilyId)
      const memoryRows = (await Promise.all(rows.map((row) => getMemoriesForAncestor(row.id)))).flat()
      const loadedMemories = await Promise.all(memoryRows.map(async (row): Promise<StoredMemory> => {
        const assets = await getMediaWithSignedUrls(row.id)
        const media = assets[0]
        const type: MemoryType = row.memory_type === 'photo' ? 'image' : row.memory_type === 'audio' ? 'audio' : row.memory_type === 'video' ? 'video' : row.memory_type === 'document' ? 'document' : 'letter'
        const description = row.description ?? ''
        return { id: row.id, personId: row.ancestor_id, title: row.title, description, type,
          fileName: media?.original_filename, dataUrl: media?.signedUrl ?? undefined,
          createdAt: row.memory_date ?? row.created_at,
          tags: description.toLowerCase().split(/\W+/).filter((tag) => ['boston', 'harbor', 'evacuation', 'ocean', 'svalbard', 'surface'].includes(tag)) }
      }))
      const positions = [{ x: 50, y: 19 }, { x: 34, y: 51 }, { x: 66, y: 51 }, { x: 50, y: 82 }]
      const loadedMembers: FamilyMember[] = rows.map((row, index) => {
        const primaryImage = loadedMemories.find((m) => m.personId === row.id && m.type === 'image' && m.dataUrl)?.dataUrl
        return {
          id: row.id, name: row.name,
          years: `${row.birth_year ?? '—'}—${row.death_year ?? ''}`,
          gen: `GEN ${row.generation || index + 1}`,
          memories: memoryRows.filter((m) => m.ancestor_id === row.id).length,
          image: primaryImage,
          biography: row.biography ?? undefined,
          ...(positions[index] ?? { x: 18 + (index % 4) * 22, y: 20 + Math.floor(index / 4) * 28 }),
        }
      })
      if (current) {
        setPrivateMembers(loadedMembers); setPrivateMemories(loadedMemories)
        if (loadedMembers.length && !loadedMembers.some((item) => item.id === selectedAncestorId)) setSelectedAncestorId(loadedMembers[0].id)
      }
    })().catch((cause) => { if (current) setArchiveError(cause instanceof Error ? cause.message : 'Could not load the private archive.') })
    return () => { current = false }
  }, [user, archiveMode, activeFamilyId, refreshVersion])

  const isPrivate = archiveMode === 'private' && Boolean(user && activeFamilyId)
  const activeMembers = isPrivate ? privateMembers : family
  const activeMemories = isPrivate ? privateMemories : memories
  const selectedAncestor = activeMembers.find((person) => person.id === selectedAncestorId) ?? activeMembers[0] ?? family[0]
  const activeFamily = families.find((item) => item.id === activeFamilyId)
  const go = (s: Screen) => { setScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const openHumanLegacy = (locationSlug: string, recordSlug?: string) => {
    setHumanTarget({ locationSlug, recordSlug, autoOpen: true })
    go('earth')
  }
  const enterMemory = (ancestorId: string) => {
    const ancestor = activeMembers.find((person) => person.id === ancestorId)
    if (!ancestor || !reconstructedRoomIds.has(ancestor.id)) return
    setSelectedAncestorId(ancestor.id)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return go('room')
    setTransitioning(true)
    window.setTimeout(() => setScreen('room'), 520)
    window.setTimeout(() => setTransitioning(false), 1250)
  }
  const saveMemory = async (draft: UploadDraft, file: File | null): Promise<StoredMemory> => {
    const tags = draft.description.toLowerCase().split(/\W+/).filter((tag) => ['boston', 'harbor', 'evacuation', 'ocean', 'svalbard', 'surface'].includes(tag))
    if (!isPrivate || !activeFamilyId) {
      const stored: StoredMemory = { id: `memory-${Date.now()}`, personId: draft.personId, title: draft.title,
        description: draft.description, type: draft.type, fileName: file?.name, dataUrl: draft.preview,
        ...(draft.recording && { ...draft.recording, audioSource: 'original', transcriptStatus: 'none' }),
        createdAt: new Date().toISOString(), tags }
      setMemories((current) => [...current, stored]); return stored
    }
    if (!file) throw new Error('Choose a file to preserve in the private archive.')
    const memoryType = draft.type === 'image' ? 'photo' : draft.type === 'letter' ? 'document' : draft.type
    const result = await createMemoryWithMedia({ familyId: activeFamilyId, ancestorId: draft.personId,
      title: draft.title, description: draft.description, memoryType }, file)
    const [asset] = await getMediaWithSignedUrls(result.memory.id)
    const stored: StoredMemory = { id: result.memory.id, personId: result.memory.ancestor_id, title: result.memory.title,
      description: result.memory.description ?? '', type: draft.type, fileName: asset?.original_filename,
      dataUrl: asset?.signedUrl ?? undefined, createdAt: result.memory.created_at, tags }
    setPrivateMemories((current) => [...current, stored]); return stored
  }
  return <Shell screen={screen} setScreen={go}>
    {transitioning && <div className="memory-transition" role="status" aria-live="polite"><div className="transition-stars">{Array.from({ length: 22 }, (_, index) => <i key={index} />)}</div><span>ENTERING {selectedAncestor.name.toUpperCase()}'S MEMORY</span></div>}
    {screen === 'vault' && <Vault go={go} />}
    {screen === 'family' && isPrivate && activeMembers.length === 0 ? <section className="inner-screen family-screen"><Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Private Family' }]} /><div className="form-success"><Kicker>PRIVATE ARCHIVE READY</Kicker><h2>Add your first <em>ancestor.</em></h2><p>{archiveError || 'This family has no ancestors yet. Add one before preserving a memory.'}</p><button className="primary" onClick={() => setAccountOpen(true)}>ADD ANCESTOR <Icon name="plus" /></button></div></section>
    : screen === 'family' && <Family go={go} enterMemory={enterMemory} selected={selectedAncestor} setSelected={(ancestor) => setSelectedAncestorId(ancestor.id)} memories={activeMemories} members={activeMembers} archiveName={isPrivate ? activeFamily?.name ?? 'Private family' : 'Voss / Vale'} isPrivate={isPrivate} onAccount={() => setAccountOpen(true)} onSaveMemory={saveMemory} />}
    {screen === 'room' && (reconstructedRoomIds.has(selectedAncestor.id) ? <Room go={go} openHumanLegacy={openHumanLegacy} ancestor={selectedAncestor} memories={activeMemories} /> : <MemoryRoomUnavailable ancestor={selectedAncestor} memories={activeMemories} go={go} />)}
    {screen === 'earth' && <HistoricalArchive initialLocationSlug={humanTarget.locationSlug} initialRecordSlug={humanTarget.recordSlug} onNavigate={go} onTargetOpened={humanTarget.autoOpen ? () => setHumanTarget((current) => ({ ...current, autoOpen: false })) : undefined} userId={user?.id} onRequestSignIn={() => setAccountOpen(true)} />}
    {screen === 'echoes' && <Echoes go={go} openHumanLegacy={openHumanLegacy} memories={activeMemories} />}
    {screen === 'reconstruction' && <Reconstruction go={go} />}
    {screen === 'capsule' && <Capsule go={go} capsules={capsules} saveCapsule={(capsule) => setCapsules((current) => [capsule, ...current])} />}
    {accountOpen && <AccountPanel user={user} authLoading={authLoading} families={families} activeFamilyId={activeFamilyId} archiveMode={archiveMode} onClose={() => setAccountOpen(false)} onDemo={() => { setArchiveMode('demo'); setSelectedAncestorId(family[0].id); go('family') }} onSelectFamily={(id) => { setActiveFamilyId(id); setArchiveMode('private'); setSelectedAncestorId(''); go('family') }} onFamilyCreated={(created) => { setFamilies((current) => [...current, created]); setActiveFamilyId(created.id); setArchiveMode('private'); setSelectedAncestorId(''); setRefreshVersion((value) => value + 1); go('family') }} onAncestorCreated={() => setRefreshVersion((value) => value + 1)} />}
  </Shell>
}
