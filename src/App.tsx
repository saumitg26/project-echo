import { useEffect, useState } from 'react'

type Screen = 'vault' | 'family' | 'room' | 'earth' | 'echoes' | 'reconstruction' | 'capsule'
type IconName = 'arrow' | 'archive' | 'audio' | 'camera' | 'close' | 'earth' | 'family' | 'letter' | 'menu' | 'pause' | 'play' | 'plus' | 'record' | 'spark' | 'upload'
type MemoryType = 'image' | 'audio' | 'video' | 'letter'
type StoredMemory = { id: string; personId: string; title: string; description: string; type: MemoryType; fileName?: string; dataUrl?: string; createdAt: string; tags: string[] }
type StoredCapsule = { id: string; message: string; recipient: string; unlockYear: number; attachmentName?: string; attachmentUrl?: string; createdAt: string }

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

const family = [
  { id: 'elena', name: 'Elena Voss', years: '2008—2071', gen: 'GEN I · MARA’S MOTHER', memories: 18, x: 50, y: 19, image: oldPhotosImage },
  { id: 'mara', name: 'Mara Voss', years: '2038—2080', gen: 'GEN II · LIA’S MOTHER', memories: 12, x: 34, y: 51, image: portraitImage },
  { id: 'jonas', name: 'Jonas Vale', years: '2035—2076', gen: 'GEN II · MARA’S PARTNER', memories: 7, x: 66, y: 51, image: oceanImage },
  { id: 'lia', name: 'Lia Vale', years: '2062—', gen: 'GEN III · YOU', memories: 5, x: 50, y: 82, image: undefined },
]
type FamilyMember = typeof family[number]
const reconstructedRoomIds = new Set<FamilyMember['id']>(['mara'])

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

function Family({ go, enterMemory, selected, setSelected, memories, addMemory }: { go: (s: Screen) => void; enterMemory: (ancestorId: string) => void; selected: FamilyMember; setSelected: (p: FamilyMember) => void; memories: StoredMemory[]; addMemory: (m: StoredMemory) => void }) {
  const [upload, setUpload] = useState(false)
  const selectedMemories = memories.filter((memory) => memory.personId === selected.id)
  return (
    <section className="inner-screen family-screen">
      <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Family Legacy' }]} />
      <div className="section-heading">
        <div><Kicker>BLOODLINE ARCHIVE · VOSS / VALE</Kicker><h2>Family <em>Constellation</em></h2><p>Three generations. Forty-two fragments of a world your family once knew.</p></div>
        <button className="secondary" onClick={() => setUpload(true)}><Icon name="upload" /> UPLOAD MEMORY</button>
      </div>
      <div className="constellation">
        <svg className="connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M50 19 C50 35 38 38 34 51M34 51 L66 51M50 51 C50 66 50 70 50 82" />
        </svg>
        {family.map((person) => (
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
        <p>{selected.id === 'elena' ? 'Botanist, mother, keeper of forbidden seeds. Elena recorded the last rainfall above Shelter 12.' : selected.id === 'mara' ? 'Your mother at twenty: sketching the harbor from the kitchen window, saving songs on worn tape, and writing letters she never sent.' : 'A branch of your family story, preserved through images, sound, and written testimony.'}</p>
        {selected.id === 'mara' && <blockquote className="ancestor-quote">“If you ever forget the color of morning, I left it here for you.”<span>— Mara, field tape 04</span></blockquote>}
        <div className="memory-stats"><span><b>{selected.memories + selectedMemories.filter((m) => !m.id.startsWith('seed-')).length}</b> MEMORIES</span><span><b>{new Set(selectedMemories.map((m) => m.type)).size || 1}</b> MEDIA TYPES</span></div>
        <div className="memory-strip" aria-label={`${selected.name}'s available memories`}>
          {selectedMemories.slice(-3).map((memory) => <button key={memory.id} onClick={() => reconstructedRoomIds.has(selected.id) && enterMemory(selected.id)} disabled={!reconstructedRoomIds.has(selected.id)} title={reconstructedRoomIds.has(selected.id) ? `Enter ${memory.title}` : `${memory.title} is preserved; immersive room not yet reconstructed`}>
            {memory.type === 'image' && memory.dataUrl ? <img src={memory.dataUrl} alt="" /> : <Icon name={memory.type === 'audio' ? 'audio' : memory.type === 'letter' ? 'letter' : 'archive'} />}
            <span>{memory.title}</span>
          </button>)}
          {selectedMemories.length === 0 && <p className="empty-state">No preserved objects yet. Upload the first memory.</p>}
        </div>
        {reconstructedRoomIds.has(selected.id)
          ? <button className={`primary wide enter-memory ${selected.id === 'mara' ? 'featured' : ''}`} onClick={() => enterMemory(selected.id)}><span><small>STEP BEYOND THE ARCHIVE</small>ENTER {selected.name.split(' ')[0].toUpperCase()}'S MEMORY</span> <Icon name="arrow" /></button>
          : <div className="room-unavailable-note"><button className="secondary wide" disabled><Icon name="archive" /> MEMORY ROOM NOT YET RECONSTRUCTED</button><p>{selected.name}’s memories are preserved in the archive, but an immersive reconstruction is not yet available.</p></div>}
      </aside>
      {upload && <UploadMemory initialPerson={selected.id} onClose={() => setUpload(false)} onSave={(memory) => { addMemory(memory); setSelected(family.find((p) => p.id === memory.personId) || selected) }} />}
    </section>
  )
}

function UploadMemory({ initialPerson, onClose, onSave }: { initialPerson: string; onClose: () => void; onSave: (m: StoredMemory) => void }) {
  const [personId, setPersonId] = useState(initialPerson)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<MemoryType>('image')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const chooseFile = (next: File | null) => {
    setError(''); setFile(next); setPreview('')
    if (!next) return
    if (next.size > 2_000_000) { setError('This local prototype accepts files up to 2 MB to protect browser storage.'); setFile(null); return }
    const allowed = type === 'image' ? next.type.startsWith('image/') : type === 'audio' ? next.type.startsWith('audio/') : next.type.startsWith('video/')
    if (!allowed) { setError(`Choose a valid ${type} file.`); setFile(null); return }
    const reader = new FileReader()
    reader.onerror = () => setError('The browser could not read this file.')
    reader.onload = () => setPreview(String(reader.result))
    reader.readAsDataURL(next)
  }
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!title.trim() || !description.trim()) return setError('Add both a title and a description.')
    if (type !== 'letter' && (!file || !preview)) return setError(`Choose a ${type} file before saving.`)
    onSave({ id: `memory-${Date.now()}`, personId, title: title.trim(), description: description.trim(), type, fileName: file?.name, dataUrl: preview || undefined, createdAt: new Date().toISOString(), tags: description.toLowerCase().split(/\W+/).filter((tag) => ['boston', 'harbor', 'evacuation', 'ocean', 'svalbard', 'surface'].includes(tag)) })
    setSaved(true)
  }
  return <Modal title="Add to the bloodline" onClose={onClose} large>
    {saved ? <div className="form-success"><span><Icon name="spark" size={28} /></span><Kicker>MEMORY PRESERVED LOCALLY</Kicker><h3>{title}</h3><p>It now appears in {family.find((p) => p.id === personId)?.name}’s archive on this device.</p><button className="primary" onClick={onClose}>RETURN TO CONSTELLATION <Icon name="arrow" /></button></div>
    : <form className="archive-form" onSubmit={submit}>
      <p className="local-note"><b>LOCAL PROTOTYPE</b> Files are saved in this browser only. Cloud preservation and cross-device access require a backend.</p>
      <div className="form-grid">
        <label>FAMILY MEMBER<select value={personId} onChange={(e) => setPersonId(e.target.value)}>{family.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>MEDIA TYPE<select value={type} onChange={(e) => { setType(e.target.value as MemoryType); setFile(null); setPreview('') }}><option value="image">Photograph</option><option value="audio">Audio</option><option value="video">Video</option><option value="letter">Written record</option></select></label>
      </div>
      <label>MEMORY TITLE<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={70} placeholder="e.g. The last summer rain" /></label>
      <label>DESCRIPTION<textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="What should future generations know?" /></label>
      {type !== 'letter' && <label className="file-field"><input type="file" accept={`${type}/*`} onChange={(e) => chooseFile(e.target.files?.[0] || null)} /><span><Icon name="upload" /><b>{file ? file.name : `CHOOSE ${type.toUpperCase()} FILE`}</b><small>Maximum 2 MB · stored only on this device</small></span></label>}
      {preview && type === 'image' && <img className="upload-preview" src={preview} alt="Selected file preview" />}
      {preview && type === 'audio' && <audio className="upload-media" src={preview} controls />}
      {preview && type === 'video' && <video className="upload-media" src={preview} controls />}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary wide" type="submit">PRESERVE MEMORY <Icon name="archive" /></button>
    </form>}
  </Modal>
}

const hotspotData = {
  photo: { icon: 'camera' as IconName, label: 'The Voss family photograph', hint: 'A spring afternoon in 2041', meta: 'FABRICATED DEMO PHOTOGRAPH · 18 APR 2041', title: 'The afternoon the rain stopped', image: oldPhotosImage, text: 'Three-year-old Mara sits between her mother, Elena, and grandfather Tomas outside their harbor apartment. Years later, Mara wrote on the reverse: “I remember the wet pavement more than the faces.”' },
  letter: { icon: 'letter' as IconName, label: 'Mara’s unsent letter', hint: 'Written hours before evacuation', meta: 'FABRICATED DEMO LETTER · 22 MAR 2058', title: 'To whoever finds this', image: paperImage, text: 'Twenty-year-old Mara wrote this while Elena packed their evacuation cases. It records harbor alarms beginning before the Directorate’s public warning.' },
  audio: { icon: 'audio' as IconName, label: 'Kitchen tape recorder', hint: 'Mara’s voice at age twenty', meta: 'FABRICATED DEMO RECORDING · 21 MAR 2058', title: 'Rain against the kitchen glass', image: recorderImage, text: 'Recorded the evening before evacuation, Mara hums a song Jonas taught her, then describes unmarked vehicles moving toward the north gate.' },
  keepsake: { icon: 'spark' as IconName, label: 'Brass seed locket', hint: 'A gift from Elena to Mara', meta: 'FABRICATED DEMO KEEPSAKE · 2056–2080', title: 'The seed she carried below', image: scrapbookImage, text: 'Inside the locket is a pressed calendula seed from Elena’s greenhouse. Mara wore it through the evacuation and later gave it to Lia on her eighteenth birthday.' },
  window: { icon: 'earth' as IconName, label: 'The harbor window', hint: 'Look toward the evacuation route', meta: 'RECONSTRUCTED ENVIRONMENT · 89% CONFIDENCE', title: 'The convoy before the warning', image: oceanImage, text: 'This reconstructed view combines Mara’s photographs, municipal geometry, and her 2058 letter. At 04:51, lights appear on the north bridge—fifty-one minutes before the official warning.' },
}

function Room({ go, ancestor, memories }: { go: (s: Screen) => void; ancestor: FamilyMember; memories: StoredMemory[] }) {
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
      {open && <MemoryObject objectKey={open} go={go} onClose={() => setOpen(null)} />}
      {archiveOpen && <Modal title={`${ancestor.name}'s archive`} onClose={() => setArchiveOpen(false)} large>
        <div className="object-list">{ancestorMemories.map((memory) => <article key={memory.id}>
          <div>{memory.type === 'image' && memory.dataUrl ? <img src={memory.dataUrl} alt="" /> : <Icon name={memory.type === 'audio' ? 'audio' : memory.type === 'letter' ? 'letter' : 'archive'} size={24} />}</div>
          <span><small>{memory.type.toUpperCase()} · {new Date(memory.createdAt).getFullYear()}</small><b>{memory.title}</b><p>{memory.description}</p></span>
          {memory.type === 'audio' && memory.dataUrl?.startsWith('data:audio') && <audio controls src={memory.dataUrl} />}
        </article>)}</div>
      </Modal>}
      {complete && !open && <div className="memory-complete" role="status"><span><Icon name="spark" size={24} /></span><div><Kicker>MARA’S STORY · PRIMARY MEMORIES EXPLORED</Kicker><h3>You found what she wanted Lia to remember.</h3><p>The room remains open. Follow the window memory into the Human Legacy archive, or return to the family constellation.</p></div><button className="primary" onClick={() => go('earth')}>FOLLOW THE HARBOR EVIDENCE <Icon name="arrow" /></button><button className="text-button" onClick={() => go('family')}>RETURN TO FAMILY</button></div>}
    </section>
  )
}

function MemoryObject({ objectKey, go, onClose }: { objectKey: keyof typeof hotspotData; go: (s: Screen) => void; onClose: () => void }) {
  const item = hotspotData[objectKey]
  return <Modal title={item.title} onClose={onClose} large variant="memory">
    <div className={`memory-object memory-object-${objectKey}`}>
      {objectKey === 'photo' && <><div className="polaroid"><img src={item.image} alt="Fabricated demo photograph representing Mara Voss with her family" /><span>18 APR 2041 · VOSS FAMILY HOME</span></div><div className="object-story"><Kicker>{item.meta}</Kicker><h3>Before Mara could remember <em>the sky.</em></h3><p>{item.text}</p><div className="archive-context"><b>CURATOR’S NOTE</b><p>This fabricated demo image represents a photograph Lia preserved with Mara’s effects. The people shown are illustrative, not real historical subjects.</p></div></div></>}
      {objectKey === 'letter' && <><div className="letter-sheet"><small>22 March 2058 · 05:29</small><p>To whoever finds this,</p><p>They moved the departure forward. The public bulletin says weather, but we heard the harbor alarms before dawn.</p><p>Mother put my blue coat by the door. She says we are going to see the trains. I don’t think that is true.</p><b>— Mara Voss, age 20</b></div><div className="object-story"><Kicker>{item.meta}</Kicker><h3>The letter Mara <em>hid.</em></h3><p>{item.text}</p><div className="archive-context"><b>RECOVERY</b><p>Fictional demo record: found inside Elena Voss’s cookbook in 2080. The narrative connects to the Boston Harbor evacuation case.</p></div><button className="primary" onClick={() => go('earth')}>OPEN HUMAN LEGACY RECORD <Icon name="arrow" /></button></div></>}
      {objectKey === 'audio' && <><div className="recorder-display"><img src={item.image} alt="Example vintage recording device representing Mara's recorder" /><div className="tape-reels"><i /><i /></div><span className="demo-stamp">FABRICATED DEMO DEVICE</span></div><div className="object-story"><Kicker>{item.meta}</Kicker><h3>Mara’s voice, in the <em>kitchen.</em></h3><p>{item.text}</p><DemoAudioPlayer /><div className="transcript"><b>TRANSCRIPT · 00:31–00:46</b><p>“Jonas says they’re weather trucks. They aren’t. No markings, no headlights. Seventeen, maybe eighteen, all going north.”</p></div></div></>}
      {objectKey === 'keepsake' && <><div className="keepsake-display"><img src={item.image} alt="Fabricated demo arrangement representing Mara's brass seed locket" /><div className="locket"><i /></div><span>FABRICATED DEMO KEEPSAKE</span></div><div className="object-story"><Kicker>{item.meta}</Kicker><h3>A small piece of the <em>surface.</em></h3><p>{item.text}</p><div className="archive-context"><b>FAMILY PROVENANCE</b><p>Elena Voss → Mara Voss → Lia Vale. The locket represents the family’s connection to Elena’s forbidden seed work.</p></div></div></>}
      {objectKey === 'window' && <><div className="window-memory"><img src={item.image} alt="Reconstructed demo view of Boston Harbor from Mara Voss's window" /><span>RECONSTRUCTED ENVIRONMENT · COLOR INTERPRETIVE</span></div><div className="object-story"><Kicker>{item.meta}</Kicker><h3>What Mara saw <em>before the warning.</em></h3><p>{item.text}</p><div className="evidence-link"><span>04:51</span><div><b>NORTH BRIDGE CONVOY</b><p>Matches recovered Gate Transit Log 17-B in Human Legacy.</p></div></div><button className="primary" onClick={() => go('reconstruction')}>FOLLOW EVIDENCE TO HUMAN LEGACY <Icon name="arrow" /></button></div></>}
    </div>
  </Modal>
}

function DemoAudioPlayer() {
  const [playing, setPlaying] = useState(false)
  const transcript = 'Jonas says they are weather trucks. They are not. No markings, no headlights. Seventeen, maybe eighteen, all going north.'
  useEffect(() => () => window.speechSynthesis?.cancel(), [])
  const toggle = () => {
    if (playing) {
      window.speechSynthesis?.cancel()
      return setPlaying(false)
    }
    if (!('speechSynthesis' in window)) return
    const utterance = new SpeechSynthesisUtterance(transcript)
    utterance.rate = .82
    utterance.pitch = .88
    utterance.onend = () => setPlaying(false)
    utterance.onerror = () => setPlaying(false)
    setPlaying(true)
    window.speechSynthesis.speak(utterance)
  }
  return <div className={`narrated-demo ${playing ? 'playing' : ''}`}><button onClick={toggle} aria-label={playing ? 'Stop fabricated demo transcript' : 'Play fabricated demo transcript'}><Icon name={playing ? 'pause' : 'play'} /></button><div><b>{playing ? 'PLAYING TRANSCRIPT' : 'PLAY FABRICATED DEMO TRANSCRIPT'}</b><span>Browser-generated narration · not Mara’s real voice</span></div><i /></div>
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

const locations = [
  { id: 'boston', name: 'BOSTON HARBOR', x: 28, y: 38, count: 147, event: 'LAST DEPARTURE', date: '22 MAR 2058', coords: '42.3601° N', image: cityImage, tags: ['boston', 'harbor', 'evacuation'], description: 'The final civilian ships departed beneath a sky obscured by ash. Public records describe an orderly evacuation; witnesses remember sealed gates and a priority convoy.', records: ['05:10 · Harbor alarms begin', '05:42 · Directorate bulletin transmitted', '06:18 · North gate sealed'] },
  { id: 'svalbard', name: 'SVALBARD', x: 52, y: 20, count: 83, event: 'SEED VAULT', date: '02 NOV 2057', coords: '78.2232° N', image: oceanImage, tags: ['svalbard', 'seeds', 'surface'], description: 'Botanists moved the last viable surface seed libraries into deep storage. Elena Voss appears in a damaged personnel manifest recovered in 2081.', records: ['18:06 · Vault climate failure', '19:12 · ORPHEUS convoy arrives', '21:40 · Final inventory sealed'] },
  { id: 'kyoto', name: 'KYOTO', x: 79, y: 45, count: 221, event: 'FINAL BLOOM', date: '11 APR 2056', coords: '35.0116° N', image: portraitImage, tags: ['kyoto', 'flowers', 'surface'], description: 'Citizens documented the last public cherry blossom season. These images became contraband after natural-world media was restricted underground.', records: ['06:30 · Gardens opened', '12:14 · Public archive captured', '20:02 · Preservation order issued'] },
  { id: 'patagonia', name: 'PATAGONIA', x: 35, y: 76, count: 64, event: 'SOUTHERN SIGNAL', date: '14 JUN 2055', coords: '50.9423° S', image: oceanImage, tags: ['patagonia', 'ocean', 'surface'], description: 'A remote weather station broadcast ocean and wind recordings for three years after evacuation. The origin of its final human voice remains unknown.', records: ['03:20 · Weather telemetry normal', '03:24 · Human voice detected', '03:26 · Transmission ends'] },
]

function Earth({ go }: { go: (s: Screen) => void }) {
  const [location, setLocation] = useState(locations[0])
  const [experience, setExperience] = useState<typeof locations[number] | null>(null)
  const enterLocation = (next: typeof locations[number]) => { setLocation(next); setExperience(next) }
  return (
    <section className="inner-screen earth-screen">
      <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Human Legacy' }]} />
      <div className="section-heading compact"><div><Kicker>CIVILIZATION ARCHIVE</Kicker><h2>The <em>Lost Earth</em></h2><p>Not a map of territory. A map of what remains.</p></div><div className="archive-count"><b>08,214,605</b><span>VERIFIED FRAGMENTS</span></div></div>
      <div className="earth-layout">
        <div className="map">
          <div className="map-grid" /><div className="world-shape shape-1" /><div className="world-shape shape-2" /><div className="world-shape shape-3" />
          {locations.map((l) => <button key={l.id} style={{ left: `${l.x}%`, top: `${l.y}%` }} className={`location ${location.id === l.id ? 'active' : ''}`} onClick={() => enterLocation(l)} aria-label={`Enter historical archive for ${l.name}`}><i /><span>{l.name}<small>{l.count} FRAGMENTS · OPEN</small></span></button>)}
          <div className="map-scan" />
          <div className="map-label">SURFACE CARTOGRAPHY / LAST UPDATE 2058</div>
        </div>
        <aside className="location-panel">
          <div className="location-visual"><img src={location.image} alt={`Example archival landscape for ${location.name}`} /><span>ARCHIVE 41–B</span></div>
          <Kicker>SELECTED LOCATION · {location.coords}</Kicker><h3>{location.name}</h3><p className="event-title">{location.event} · {location.date}</p>
          <p>{location.description}</p>
          <div className="source-legend">
            <span><i className="cyan-dot" /><b>ORIGINAL</b> 61</span><span><i className="amber-dot" /><b>CONTRIBUTED</b> 73</span><span><i className="white-dot" /><b>RECONSTRUCTED</b> 13</span>
          </div>
          <div className="timeline-fragments">{location.records.map((record) => { const [time, text] = record.split(' · '); return <span key={record}>{time} <b>{text}</b></span> })}</div>
          <button className="primary wide" onClick={() => setExperience(location)}>ENTER LOCATION ARCHIVE <Icon name="arrow" /></button>
        </aside>
      </div>
      {experience && <Modal title={`${experience.name} history experience`} onClose={() => setExperience(null)} large>
        <div className="history-hero"><img src={experience.image} alt={`Historical example from ${experience.name}`} /><span>ARCHIVAL PHOTOGRAPH · EXAMPLE</span></div>
        <div className="history-heading"><div><Kicker>{experience.date} · {experience.coords}</Kicker><h3>{experience.event}</h3></div><b>{experience.count}<small>RECORDS</small></b></div>
        <p className="history-copy">{experience.description}</p>
        <div className="history-records">{experience.records.map((record, index) => <article key={record}><span>0{index + 1}</span><p>{record}</p><small>{index === 1 ? 'CONTRIBUTED TESTIMONY' : 'ORIGINAL ARCHIVE'}</small></article>)}</div>
        <div className="modal-actions"><button className="secondary" onClick={() => { setExperience(null); go('echoes') }}>FIND FAMILY ECHOES <Icon name="spark" /></button>{experience.id === 'boston' && <button className="primary" onClick={() => { setExperience(null); go('reconstruction') }}>INVESTIGATE MISSING RECORD <Icon name="arrow" /></button>}</div>
      </Modal>}
    </section>
  )
}

function Echoes({ go, memories }: { go: (s: Screen) => void; memories: StoredMemory[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const suggestions = memories.flatMap((memory) => locations.map((location) => {
    const shared = memory.tags.filter((tag) => location.tags.includes(tag))
    return { memory, location, shared, score: Math.min(94, 52 + shared.length * 14) }
  })).filter((match) => match.shared.length > 0).sort((a, b) => b.score - a.score)
  const active = suggestions.find((suggestion) => `${suggestion.memory.id}-${suggestion.location.id}` === selected)
  return <section className="inner-screen echoes-screen">
    <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Memory Echoes' }]} />
    <div className="section-heading compact"><div><Kicker>DETERMINISTIC DISCOVERY FIELD</Kicker><h2>Memory <em>Echoes</em></h2><p>Potential links surfaced from shared dates, places, and archive tags.</p></div><div className="case-status"><span>{suggestions.length}</span> POTENTIAL LINKS</div></div>
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
        {active ? <><Kicker>POTENTIAL CONNECTION · NOT CONFIRMED</Kicker><h3>{active.memory.title}</h3><div className="echo-line"><span>{family.find((p) => p.id === active.memory.personId)?.name}</span><i /><span>{active.location.name}</span></div><p>Both records share {active.shared.map((tag) => `“${tag}”`).join(' and ')}. This rule-based match suggests where to investigate; it does not prove the records describe the same event.</p><div className="caution"><b>HOW THIS WAS MATCHED</b><p>Exact overlap of seeded tags, location names, and dates. No AI inference is presented as fact.</p></div><button className="primary wide" onClick={() => go(active.location.id === 'boston' ? 'reconstruction' : 'earth')}>INVESTIGATE CONNECTION <Icon name="arrow" /></button></>
        : <div className="locked-discovery"><span><Icon name="spark" size={26} /></span><h3>Select an echo</h3><p>Inspect why a family memory may relate to a historical record.</p></div>}
      </aside>
    </div>
  </section>
}

const evidence = [
  { id: 1, type: 'ORIGINAL ARCHIVE', time: '05:42', title: 'Directorate Bulletin', quote: '“Evacuation commenced at first warning. All citizens were given equal passage.”', source: 'PUBLIC TRANSMISSION 6A', tone: 'cyan' },
  { id: 2, type: 'CONTRIBUTED MEMORY', time: '05:17', title: 'Elena’s Letter', quote: '“The convoy had already gone. I watched their lights cross the bridge before the sirens.”', source: 'VOSS FAMILY ARCHIVE', tone: 'amber' },
  { id: 3, type: 'ORIGINAL ARCHIVE', time: '04:51', title: 'Gate Transit Log', quote: 'DIRECTORATE PRIORITY · 17 VEHICLES · CLEARANCE: ORPHEUS', source: 'RECOVERED SYSTEM LOG', tone: 'cyan' },
]

function Reconstruction({ go }: { go: (s: Screen) => void }) {
  const [selected, setSelected] = useState<number[]>([])
  const [solved, setSolved] = useState(false)
  const toggle = (id: number) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  return (
    <section className="inner-screen reconstruction-screen">
      <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Lost Earth', action: () => go('earth') }, { label: 'Historical Mystery' }]} />
      <div className="section-heading compact">
        <div><Kicker>MEMORY RECONSTRUCTION · CASE 07</Kicker><h2>The <em>First Convoy</em></h2><p>Connect the fragments. Preserve the contradictions.</p></div>
        <div className="case-status"><span>{selected.length}/3</span> EVIDENCE SELECTED</div>
      </div>
      <div className="evidence-workspace">
        <div className="evidence-field">
          <div className="field-label">{solved ? 'CONNECTION COMPLETE' : 'INSPECT AND SELECT ALL THREE FRAGMENTS'}</div>
          {evidence.map((item) => (
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
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [letter, setLetter] = useState('I want you to know that before the shelters, your family stood beneath an open sky. We kept asking questions, even when answers were hidden.')
  const [created, setCreated] = useState(false)
  const [recipient, setRecipient] = useState('My descendants')
  const [unlockYears, setUnlockYears] = useState(30)
  const [attachment, setAttachment] = useState<{ name: string; url: string; type: string } | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!recording) return
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [recording])
  const format = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
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
    saveCapsule({ id: `capsule-${Date.now()}`, message: letter.trim(), recipient, unlockYear: 2087 + unlockYears, attachmentName: attachment?.name, attachmentUrl: attachment?.url, createdAt: new Date().toISOString() })
    setCreated(true)
  }
  if (created) return <section className="capsule-complete"><div className="capsule-object"><span /><i /></div><Kicker>CAPSULE ECHO–7A–2087 SEALED LOCALLY</Kicker><h2>For those who come <em>after us.</em></h2><p>Your capsule is stored on this device and simulates an unlock in {2087 + unlockYears}. Real scheduled delivery and identity verification require a secure backend.</p><button className="secondary" onClick={() => { setCreated(false); setStep(0) }}>CREATE ANOTHER</button></section>
  return (
    <section className="inner-screen capsule-screen">
      <Breadcrumbs items={[{ label: 'Memory Vault', action: () => go('vault') }, { label: 'Time Capsules' }]} />
      <div className="section-heading compact"><div><Kicker>FUTURE ARCHIVE</Kicker><h2>Time <em>Capsule</em></h2><p>Leave more than a record. Leave a voice they can recognize.</p></div><span className="autosave"><i /> SAVED LOCALLY · {capsules.length} SEALED</span></div>
      <div className="capsule-layout">
        <nav className="capsule-steps" aria-label="Capsule creation steps">
          {['Voice message', 'Photographs', 'Written letter', 'Recipients', 'Preview capsule'].map((s, i) => <button className={step === i ? 'active' : ''} onClick={() => setStep(i)} key={s}><span>0{i + 1}</span><b>{s}</b><i /></button>)}
        </nav>
        <div className="capsule-editor">
          {step === 0 && <div className="editor-section"><Kicker>01 · YOUR VOICE</Kicker><h3>Speak to someone you may never meet.</h3><p>This prototype demonstrates the recording state. Your microphone is not accessed and no audio is captured.</p>
            <div className={`recorder ${recording ? 'recording' : ''}`}><button onClick={() => setRecording(!recording)} aria-label={recording ? 'Stop recording demonstration' : 'Start recording demonstration'}><Icon name={recording ? 'pause' : 'record'} size={24} /></button><div className="wave">{[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((n) => <i key={n} style={{ height: recording ? `${10 + ((n * 13) % 35)}px` : '2px' }} />)}</div><b>{format}</b></div>
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
  const selectedAncestor = family.find((person) => person.id === selectedAncestorId) ?? family[0]
  const go = (s: Screen) => { setScreen(s); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const enterMemory = (ancestorId: string) => {
    const ancestor = family.find((person) => person.id === ancestorId)
    if (!ancestor || !reconstructedRoomIds.has(ancestor.id)) return
    setSelectedAncestorId(ancestor.id)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return go('room')
    setTransitioning(true)
    window.setTimeout(() => setScreen('room'), 520)
    window.setTimeout(() => setTransitioning(false), 1250)
  }
  return <Shell screen={screen} setScreen={go}>
    {transitioning && <div className="memory-transition" role="status" aria-live="polite"><div className="transition-stars">{Array.from({ length: 22 }, (_, index) => <i key={index} />)}</div><span>ENTERING {selectedAncestor.name.toUpperCase()}'S MEMORY</span></div>}
    {screen === 'vault' && <Vault go={go} />}
    {screen === 'family' && <Family go={go} enterMemory={enterMemory} selected={selectedAncestor} setSelected={(ancestor) => setSelectedAncestorId(ancestor.id)} memories={memories} addMemory={(memory) => setMemories((current) => [...current, memory])} />}
    {screen === 'room' && (reconstructedRoomIds.has(selectedAncestor.id) ? <Room go={go} ancestor={selectedAncestor} memories={memories} /> : <MemoryRoomUnavailable ancestor={selectedAncestor} memories={memories} go={go} />)}
    {screen === 'earth' && <Earth go={go} />}
    {screen === 'echoes' && <Echoes go={go} memories={memories} />}
    {screen === 'reconstruction' && <Reconstruction go={go} />}
    {screen === 'capsule' && <Capsule go={go} capsules={capsules} saveCapsule={(capsule) => setCapsules((current) => [capsule, ...current])} />}
  </Shell>
}
