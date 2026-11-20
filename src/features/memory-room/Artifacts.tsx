import { useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { ArtifactKey } from './types'
import { artifactData } from './data'
import { ProceduralTextures } from './ProceduralTextures'

interface ArtifactProps {
  selected: ArtifactKey | null
  explored: ArtifactKey[]
  showMarkers?: boolean
  onSelect: (key: ArtifactKey) => void
}

export function Artifacts({ selected, explored, showMarkers = false, onSelect }: ArtifactProps) {
  return (
    <group>
      <PhotoFrameArtifact
        isExplored={explored.includes('photo')}
        isSelected={selected === 'photo'}
        showMarker={showMarkers}
        onSelect={() => onSelect('photo')}
      />
      <LetterArtifact
        isExplored={explored.includes('letter')}
        isSelected={selected === 'letter'}
        showMarker={showMarkers}
        onSelect={() => onSelect('letter')}
      />
      <CassetteArtifact
        isExplored={explored.includes('audio')}
        isSelected={selected === 'audio'}
        showMarker={showMarkers}
        onSelect={() => onSelect('audio')}
      />
      <KeepsakeArtifact
        isExplored={explored.includes('keepsake')}
        isSelected={selected === 'keepsake'}
        showMarker={showMarkers}
        onSelect={() => onSelect('keepsake')}
      />
      <HarborWindowArtifact
        isExplored={explored.includes('window')}
        isSelected={selected === 'window'}
        showMarker={showMarkers}
        onSelect={() => onSelect('window')}
      />
    </group>
  )
}

/**
 * 1. Family Photograph (Desk Picture Frame)
 */
function PhotoFrameArtifact({
  isExplored,
  isSelected,
  showMarker,
  onSelect,
}: {
  isExplored: boolean
  isSelected: boolean
  showMarker: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const photoTexture = useMemo(() => ProceduralTextures.getFamilyPhotoTexture(), [])
  const info = artifactData.photo

  useFrame((state) => {
    if (!groupRef.current) return
    if (hovered || isSelected) {
      const t = state.clock.getElapsedTime()
      groupRef.current.position.y = info.position[1] + Math.sin(t * 3) * 0.005
    } else {
      groupRef.current.position.y = info.position[1]
    }
  })

  return (
    <group
      ref={groupRef}
      position={info.position}
      rotation={[0.08, 0.35, -0.05]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Generous Invisible Touch/Pointer Hitbox */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.38, 0.42, 0.14]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Outer Wooden Frame with warm gold highlight on hover */}
      <mesh castShadow>
        <boxGeometry args={[0.3, 0.34, 0.025]} />
        <meshStandardMaterial
          color={hovered || isSelected ? '#d99443' : '#693c1d'}
          roughness={0.35}
          metalness={0.25}
          emissive={hovered || isSelected ? '#ffb95e' : '#000000'}
          emissiveIntensity={hovered || isSelected ? 0.45 : 0}
        />
      </mesh>

      {/* Frame Gold Inner Bezel Lip */}
      <mesh position={[0, 0, 0.013]}>
        <boxGeometry args={[0.26, 0.3, 0.005]} />
        <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.92} />
      </mesh>

      {/* Photo Surface Canvas */}
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[0.24, 0.28]} />
        <meshStandardMaterial
          map={photoTexture}
          roughness={0.4}
          color={hovered || isSelected ? '#fffaf2' : '#ffffff'}
        />
      </mesh>

      {/* Frame Stand Prop at Back */}
      <mesh position={[0, -0.08, -0.06]} rotation={[-0.45, 0, 0]}>
        <boxGeometry args={[0.04, 0.2, 0.01]} />
        <meshStandardMaterial color="#4d2f19" roughness={0.65} />
      </mesh>

      {/* Restrained Object-First Hover Tooltip or Discrete Marker */}
      {(hovered || isSelected || showMarker) && (
        <Html position={[0, 0.23, 0]} center distanceFactor={4} zIndexRange={[10, 0]}>
          <div
            className={`object-tag ${hovered || isSelected ? 'visible' : ''} ${showMarker ? 'discrete-marker' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <span className="tag-icon">📷</span>
            <span className="tag-text">
              <b>{info.label}</b>
              <small>{isExplored ? '✓ Explored' : info.hint}</small>
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * 2. Elena Voss's Letter (Mara's unsent letter on desk)
 */
function LetterArtifact({
  isExplored,
  isSelected,
  showMarker,
  onSelect,
}: {
  isExplored: boolean
  isSelected: boolean
  showMarker: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const letterTexture = useMemo(() => ProceduralTextures.getLetterTexture(), [])
  const info = artifactData.letter

  useFrame((state) => {
    if (!groupRef.current) return
    if (hovered || isSelected) {
      const t = state.clock.getElapsedTime()
      groupRef.current.position.y = info.position[1] + Math.sin(t * 3.5) * 0.005
    } else {
      groupRef.current.position.y = info.position[1]
    }
  })

  return (
    <group
      ref={groupRef}
      position={info.position}
      rotation={[-Math.PI / 2, 0, -0.15]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Generous Touch Hitbox */}
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[0.42, 0.52]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Paper Drop Shadow */}
      <mesh position={[0, 0, -0.003]}>
        <planeGeometry args={[0.34, 0.44]} />
        <meshBasicMaterial color="#0c0704" transparent opacity={0.65} />
      </mesh>

      {/* Main Parchment Sheet */}
      <mesh castShadow receiveShadow>
        <planeGeometry args={[0.32, 0.42]} />
        <meshStandardMaterial
          map={letterTexture}
          roughness={0.88}
          emissive={hovered || isSelected ? '#ffd894' : '#000000'}
          emissiveIntensity={hovered || isSelected ? 0.45 : 0}
        />
      </mesh>

      {/* Folded Corner */}
      <mesh position={[0.14, 0.19, 0.005]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.04, 0.04]} />
        <meshStandardMaterial color="#c7b695" roughness={0.8} />
      </mesh>

      {/* Restrained Object-First Hover Tooltip */}
      {(hovered || isSelected || showMarker) && (
        <Html position={[0, 0.26, 0.05]} center distanceFactor={4} zIndexRange={[10, 0]}>
          <div
            className={`object-tag ${hovered || isSelected ? 'visible' : ''} ${showMarker ? 'discrete-marker' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <span className="tag-icon">✉️</span>
            <span className="tag-text">
              <b>{info.label}</b>
              <small>{isExplored ? '✓ Explored' : info.hint}</small>
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * 3. Kitchen Tape Recorder
 */
function CassetteArtifact({
  isExplored,
  isSelected,
  showMarker,
  onSelect,
}: {
  isExplored: boolean
  isSelected: boolean
  showMarker: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const groupRef = useRef<THREE.Group>(null)
  const reel1Ref = useRef<THREE.Mesh>(null)
  const reel2Ref = useRef<THREE.Mesh>(null)
  const cassetteTexture = useMemo(() => ProceduralTextures.getCassetteTexture(), [])
  const info = artifactData.audio

  useFrame((_state, delta) => {
    if (reel1Ref.current) reel1Ref.current.rotation.z += delta * 1.5
    if (reel2Ref.current) reel2Ref.current.rotation.z += delta * 1.5
  })

  return (
    <group
      ref={groupRef}
      position={info.position}
      rotation={[0, -0.22, 0]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Generous Hitbox */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.46, 0.14, 0.36]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Recorder Body Chassis */}
      <mesh position={[0, 0.035, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.07, 0.28]} />
        <meshStandardMaterial
          color={hovered || isSelected ? '#5c4e3b' : '#332d24'}
          roughness={0.4}
          metalness={0.4}
          emissive={hovered || isSelected ? '#f5b54c' : '#000000'}
          emissiveIntensity={hovered || isSelected ? 0.35 : 0}
        />
      </mesh>

      {/* Top Faceplate with Cassette texture */}
      <mesh position={[0, 0.071, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.37, 0.27]} />
        <meshStandardMaterial map={cassetteTexture} roughness={0.35} metalness={0.35} />
      </mesh>

      {/* Cassette Window Glass Lid */}
      <mesh position={[0.07, 0.073, -0.01]}>
        <boxGeometry args={[0.18, 0.005, 0.1]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.4}
          roughness={0.1}
          metalness={0.1}
          transmission={0.8}
          color="#d2eaf0"
        />
      </mesh>

      {/* Rotating Reel 1 */}
      <mesh ref={reel1Ref} position={[0.03, 0.072, -0.01]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.004, 16]} />
        <meshStandardMaterial color="#eccb97" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Rotating Reel 2 */}
      <mesh ref={reel2Ref} position={[0.11, 0.072, -0.01]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.004, 16]} />
        <meshStandardMaterial color="#eccb97" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Microphone Port on Front */}
      <mesh position={[-0.12, 0.035, 0.141]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.01, 12]} />
        <meshStandardMaterial color="#949494" roughness={0.25} metalness={0.85} />
      </mesh>

      {/* Restrained Object-First Hover Tooltip */}
      {(hovered || isSelected || showMarker) && (
        <Html position={[0, 0.2, 0]} center distanceFactor={4} zIndexRange={[10, 0]}>
          <div
            className={`object-tag ${hovered || isSelected ? 'visible' : ''} ${showMarker ? 'discrete-marker' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <span className="tag-icon">🎙️</span>
            <span className="tag-text">
              <b>{info.label}</b>
              <small>{isExplored ? '✓ Explored' : info.hint}</small>
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * 4. Brass Seed Locket (Personal Keepsake)
 */
function KeepsakeArtifact({
  isExplored,
  isSelected,
  showMarker,
  onSelect,
}: {
  isExplored: boolean
  isSelected: boolean
  showMarker: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const locketRef = useRef<THREE.Group>(null)
  const info = artifactData.keepsake

  useFrame((state) => {
    if (!locketRef.current) return
    const t = state.clock.getElapsedTime()
    if (hovered || isSelected) {
      locketRef.current.rotation.y = 0.35 + Math.sin(t * 2.5) * 0.15
      locketRef.current.position.y = 0.02 + Math.sin(t * 3) * 0.005
    } else {
      locketRef.current.rotation.y = 0.35
      locketRef.current.position.y = 0.02
    }
  })

  return (
    <group
      position={info.position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Generous Hitbox */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.12, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Dark Velvet Presentation Dish */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <cylinderGeometry args={[0.075, 0.08, 0.01, 24]} />
        <meshStandardMaterial color="#362015" roughness={0.88} />
      </mesh>

      {/* Brass Locket Assembly */}
      <group ref={locketRef} position={[0, 0.02, 0]}>
        {/* Locket Oval Body */}
        <mesh castShadow>
          <sphereGeometry args={[0.04, 24, 24]} />
          <meshStandardMaterial
            color={hovered || isSelected ? '#ffe17d' : '#f5be42'}
            roughness={0.2}
            metalness={0.92}
            emissive={hovered || isSelected ? '#ffc24c' : '#000000'}
            emissiveIntensity={hovered || isSelected ? 0.45 : 0}
          />
        </mesh>

        {/* Locket Hinge Loop */}
        <mesh position={[0, 0.048, 0]}>
          <torusGeometry args={[0.008, 0.002, 8, 16]} />
          <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.92} />
        </mesh>

        {/* Embossed Calendula Seed / Leaf Motif */}
        <mesh position={[0, 0, 0.034]} rotation={[0, 0, 0.2]}>
          <coneGeometry args={[0.013, 0.034, 4]} />
          <meshStandardMaterial color="#fff2b2" roughness={0.15} metalness={0.95} />
        </mesh>
      </group>

      {/* Restrained Object-First Hover Tooltip */}
      {(hovered || isSelected || showMarker) && (
        <Html position={[0, 0.18, 0]} center distanceFactor={4} zIndexRange={[10, 0]}>
          <div
            className={`object-tag ${hovered || isSelected ? 'visible' : ''} ${showMarker ? 'discrete-marker' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <span className="tag-icon">✨</span>
            <span className="tag-text">
              <b>{info.label}</b>
              <small>{isExplored ? '✓ Explored' : info.hint}</small>
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * 5. Harbor Window
 */
function HarborWindowArtifact({
  isExplored,
  isSelected,
  showMarker,
  onSelect,
}: {
  isExplored: boolean
  isSelected: boolean
  showMarker: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const info = artifactData.window

  return (
    <group
      position={info.position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Clickable Window Hit Plane */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[2.14, 1.6]} />
        <meshBasicMaterial
          transparent
          opacity={hovered || isSelected ? 0.2 : 0.001}
          color="#6feaf0"
        />
      </mesh>

      {/* Luminous Window Sill Marker Line */}
      <mesh position={[0, -0.74, 0.03]}>
        <boxGeometry args={[2.0, 0.018, 0.018]} />
        <meshBasicMaterial color={hovered || isSelected ? '#8af2f7' : '#4bb3bc'} />
      </mesh>

      {/* Restrained Object-First Hover Tooltip */}
      {(hovered || isSelected || showMarker) && (
        <Html position={[0, 0.1, 0.1]} center distanceFactor={4} zIndexRange={[10, 0]}>
          <div
            className={`object-tag window-tag ${hovered || isSelected ? 'visible' : ''} ${showMarker ? 'discrete-marker' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
          >
            <span className="tag-icon cyan">🌐</span>
            <span className="tag-text cyan">
              <b>{info.label}</b>
              <small>{isExplored ? '✓ Explored' : 'Look toward the evacuation route (04:51)'}</small>
            </span>
          </div>
        </Html>
      )}
    </group>
  )
}
