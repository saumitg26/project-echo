export type ArtifactKey = 'photo' | 'letter' | 'audio' | 'keepsake' | 'window'

export interface ArtifactInfo {
  key: ArtifactKey
  icon: 'camera' | 'letter' | 'audio' | 'spark' | 'earth'
  label: string
  hint: string
  meta: string
  title: string
  image: string
  text: string
  position: [number, number, number] // 3D coordinates in room
  cameraPosition: [number, number, number] // Camera focus position
  cameraTarget: [number, number, number] // Camera focus target
}

export interface MemoryRoomProps {
  ancestor: {
    id: string
    name: string
    years: string
    gen: string
    memories: number
    image?: string
    biography?: string
  }
  memories: Array<{
    id: string
    personId: string
    title: string
    description: string
    type: 'image' | 'audio' | 'video' | 'letter' | 'document'
    fileName?: string
    dataUrl?: string
    createdAt: string
    tags: string[]
  }>
  go: (screen: 'vault' | 'family' | 'room' | 'earth' | 'echoes' | 'reconstruction' | 'capsule') => void
  openHumanLegacy: (locationSlug: string, recordSlug?: string) => void
}
