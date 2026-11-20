import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

export function Lighting() {
  const deskLampTarget = useMemo(() => {
    const obj = new THREE.Object3D()
    obj.position.set(0.0, 0.82, 0.1)
    return obj
  }, [])

  const windowLightTarget = useMemo(() => {
    const obj = new THREE.Object3D()
    obj.position.set(-0.3, 0.8, 0.6)
    return obj
  }, [])

  return (
    <group>
      {/* Balanced Warm Ambient Fill: preserves shadow detail without flattening the scene */}
      <ambientLight color="#fae7cc" intensity={0.78} />

      {/* Directional Ceiling Hemisphere Light: gives rich top-to-bottom surface modeling */}
      <hemisphereLight
        color="#ffe4bc"
        groundColor="#3e2515"
        intensity={0.88}
      />

      {/* Primary Key Light: Warm Archival Reading Lamp Spotlight on Desk */}
      <primitive object={deskLampTarget} />
      <spotLight
        position={[-0.85, 1.38, -0.1]}
        target={deskLampTarget}
        color="#ffe69e"
        intensity={5.2}
        distance={4.4}
        angle={0.78}
        penumbra={0.68}
        castShadow
        shadow-bias={-0.0001}
        shadow-mapSize={[1024, 1024]}
      />

      {/* Practical Warm Amber Glow at Desk Lamp Head */}
      <pointLight
        position={[-0.78, 1.25, -0.15]}
        color="#ffaa3b"
        intensity={1.5}
        distance={2.0}
      />

      {/* Atmospheric Cool Cyan Directional Beam from Harbor Window (Controlled, not blown out) */}
      <primitive object={windowLightTarget} />
      <spotLight
        position={[0.75, 2.0, -2.4]}
        target={windowLightTarget}
        color="#38bdf8"
        intensity={2.0}
        distance={5.8}
        angle={0.75}
        penumbra={0.7}
      />

      {/* Subtle Cyan Window Sill Accent Light (Preserves crisp outside city vista) */}
      <pointLight
        position={[0.75, 1.55, -1.5]}
        color="#22d3ee"
        intensity={0.8}
        distance={2.2}
      />

      {/* Warm Golden Room Center Bounce Fill (Dimensional depth for Chair, Rug & Floor) */}
      <pointLight
        position={[0.08, 1.35, 0.7]}
        color="#f59e0b"
        intensity={1.35}
        distance={3.5}
      />

      {/* Warm Golden Wall Wash (Left Wall) to highlight Bookshelf, Blue Coat & Blueprint */}
      <pointLight
        position={[-2.0, 1.7, 0.4]}
        color="#fcd34d"
        intensity={1.45}
        distance={3.2}
      />

      {/* Subtle Floating Archival Dust Particles */}
      <DustParticles />
    </group>
  )
}

function DustParticles() {
  const count = 42
  const pointsRef = useRef<THREE.Points>(null)

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.2
      pos[i * 3 + 1] = 0.82 + Math.random() * 1.4
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.2

      spd[i * 3] = (Math.random() - 0.5) * 0.035
      spd[i * 3 + 1] = 0.015 + Math.random() * 0.035
      spd[i * 3 + 2] = (Math.random() - 0.5) * 0.035
    }
    return [pos, spd]
  }, [])

  useFrame((_state, delta) => {
    if (!pointsRef.current) return
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array

    for (let i = 0; i < count; i++) {
      arr[i * 3] += speeds[i * 3] * delta
      arr[i * 3 + 1] += speeds[i * 3 + 1] * delta
      arr[i * 3 + 2] += speeds[i * 3 + 2] * delta

      if (arr[i * 3 + 1] > 2.5) {
        arr[i * 3 + 1] = 0.82
        arr[i * 3] = (Math.random() - 0.5) * 3.2
        arr[i * 3 + 2] = (Math.random() - 0.5) * 2.2
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        color="#ffe6b8"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
