import type { ArtifactInfo, ArtifactKey } from './types'

export const oldPhotosImage = 'https://images.unsplash.com/photo-1453828423292-392a660a502f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200'
export const paperImage = 'https://images.unsplash.com/photo-1447069387593-a5de0862481e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200'
export const recorderImage = 'https://images.unsplash.com/photo-1781354771866-0bdd0cc09ea9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=900'
export const scrapbookImage = 'https://images.unsplash.com/photo-1781775795345-cdc2ce3feedb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1400'
export const oceanImage = 'https://images.unsplash.com/photo-1747182922993-9c7dde01c97f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1600'
export const roomImage = 'https://images.unsplash.com/photo-1773098587088-f0a3aaab48a8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=88&w=2000'

export const DEFAULT_CAMERA_POS: [number, number, number] = [0, 1.62, 2.35]
export const DEFAULT_CAMERA_TARGET: [number, number, number] = [0.08, 1.12, -0.2]

export const artifactData: Record<ArtifactKey, ArtifactInfo> = {
  photo: {
    key: 'photo',
    icon: 'camera',
    label: 'The Voss family photograph',
    hint: 'A spring afternoon in 2041',
    meta: 'FABRICATED DEMO PHOTOGRAPH · 18 APR 2041',
    title: 'The afternoon the rain stopped',
    image: oldPhotosImage,
    text: 'Three-year-old Mara sits between her mother, Elena, and grandfather Tomas outside their harbor apartment. Years later, Mara wrote on the reverse: “I remember the wet pavement more than the faces.”',
    position: [-0.65, 0.98, -0.05],
    cameraPosition: [-0.65, 1.25, 0.6],
    cameraTarget: [-0.65, 1.0, -0.05],
  },
  letter: {
    key: 'letter',
    icon: 'letter',
    label: 'Mara’s unsent letter',
    hint: 'Written hours before evacuation',
    meta: 'FABRICATED DEMO LETTER · 22 MAR 2058',
    title: 'To whoever finds this',
    image: paperImage,
    text: 'Twenty-year-old Mara wrote this while Elena packed their evacuation cases. It records harbor alarms beginning before the Directorate’s public warning.',
    position: [-0.15, 0.86, 0.08],
    cameraPosition: [-0.15, 1.45, 0.45],
    cameraTarget: [-0.15, 0.86, 0.08],
  },
  audio: {
    key: 'audio',
    icon: 'audio',
    label: 'Kitchen tape recorder',
    hint: 'Mara’s voice at age twenty',
    meta: 'FABRICATED DEMO RECORDING · 21 MAR 2058',
    title: 'Rain against the kitchen glass',
    image: recorderImage,
    text: 'Recorded the evening before evacuation, Mara hums a song Jonas taught her, then describes unmarked vehicles moving toward the north gate.',
    position: [0.62, 0.89, -0.02],
    cameraPosition: [0.62, 1.28, 0.55],
    cameraTarget: [0.62, 0.9, -0.02],
  },
  keepsake: {
    key: 'keepsake',
    icon: 'spark',
    label: 'Brass seed locket',
    hint: 'A gift from Elena to Mara',
    meta: 'FABRICATED DEMO KEEPSAKE · 2056–2080',
    title: 'The seed she carried below',
    image: scrapbookImage,
    text: 'Inside the locket is a pressed calendula seed from Elena’s greenhouse. Mara wore it through the evacuation and later gave it to Lia on her eighteenth birthday.',
    position: [0.18, 0.865, 0.18],
    cameraPosition: [0.18, 1.22, 0.52],
    cameraTarget: [0.18, 0.865, 0.18],
  },
  window: {
    key: 'window',
    icon: 'earth',
    label: 'The harbor window',
    hint: 'Look toward the evacuation route',
    meta: 'RECONSTRUCTED ENVIRONMENT · 89% CONFIDENCE',
    title: 'The convoy before the warning',
    image: oceanImage,
    text: 'This reconstructed view combines Mara’s photographs, municipal geometry, and her 2058 letter. At 04:51, lights appear on the north bridge—fifty-one minutes before the official warning.',
    position: [0.8, 1.75, -1.74],
    cameraPosition: [0.8, 1.75, -0.4],
    cameraTarget: [0.8, 1.75, -3.8],
  },
}
