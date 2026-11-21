import { Component, useEffect, useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { isLand } from './landMask'
import { isPlaced, latLonToXYZ, type Placed } from './geo'
import type { HistoricalLocation } from './types'

export type GlobeApi = { nudge: (azimuth: number, polar: number, zoom: number) => void }

type Props = {
  locations: HistoricalLocation[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  reduced: boolean
  /** Fractions of the viewport to shift the globe (positive = left / up), to make room for the dossier. */
  offset: { x: number; y: number }
  /** Increment to fly back to the default overview. */
  resetSignal: number
  onFail: () => void
  apiRef: MutableRefObject<GlobeApi | null>
}

type SceneProps = Omit<Props, 'onFail'> & {
  onHover: (slug: string | null) => void
  labelRefs: MutableRefObject<Record<string, HTMLDivElement | null>>
}

const HOME_DIST = 4.35
const SELECTED_DIST = 3.85
const MIN_DIST = 2.2
const MAX_DIST = 6.2
const HOME_DIR = new THREE.Vector3(...latLonToXYZ(38, -25, 1)).normalize()
const CYAN = '#7ff3f7'
const AMBER = '#ffbe5c'

function dotTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 32
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.6, 'rgba(255,255,255,.85)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 32, 32)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

const OCEAN_VERT = `
varying vec3 vN; varying vec3 vV;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`
const OCEAN_FRAG = `
uniform vec3 uBase; uniform vec3 uRim;
varying vec3 vN; varying vec3 vV;
void main(){
  float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.2);
  float lift = 0.5 + 0.5 * normalize(vN).y;
  vec3 c = mix(uBase, uBase * 1.5, lift * 0.4);
  c = mix(c, uRim, f * 0.6);
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`
const ATMOS_FRAG = `
uniform vec3 uColor;
varying vec3 vN; varying vec3 vV;
void main(){
  float c = clamp(-dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  float i = pow(c, 2.4) * 0.8;
  gl_FragColor = vec4(uColor * i, i);
  #include <colorspace_fragment>
}`

function Ocean() {
  const uniforms = useMemo(() => ({ uBase: { value: new THREE.Color('#0d3e4b') }, uRim: { value: new THREE.Color('#44d6e2') } }), [])
  return <mesh>
    <sphereGeometry args={[1, 72, 54]} />
    <shaderMaterial uniforms={uniforms} vertexShader={OCEAN_VERT} fragmentShader={OCEAN_FRAG} />
  </mesh>
}

function Atmosphere() {
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#3fd3e0') } }), [])
  return <mesh scale={1.12}>
    <sphereGeometry args={[1, 48, 36]} />
    <shaderMaterial uniforms={uniforms} vertexShader={OCEAN_VERT} fragmentShader={ATMOS_FRAG}
      side={THREE.BackSide} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
  </mesh>
}

function Land() {
  const geometry = useMemo(() => {
    // Fibonacci spiral: evenly spaced samples, so dots do not bunch into rows near the poles.
    const total = 24000
    const golden = Math.PI * (3 - Math.sqrt(5))
    const points: number[] = []
    for (let i = 0; i < total; i++) {
      const lat = (Math.asin(1 - (2 * (i + 0.5)) / total) * 180) / Math.PI
      const lon = ((((i * golden * 180) / Math.PI) % 360) + 360) % 360 - 180
      if (isLand(lat, lon)) points.push(...latLonToXYZ(lat, lon, 1.004))
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3))
    return g
  }, [])
  const map = useMemo(dotTexture, [])
  return <points geometry={geometry}>
    <pointsMaterial size={0.024} sizeAttenuation color="#8bf1f5" map={map} transparent alphaTest={0.06} depthWrite={false} />
  </points>
}

function Graticule() {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    const add = (a: number[], b: number[]) => points.push(new THREE.Vector3(...(a as [number, number, number])), new THREE.Vector3(...(b as [number, number, number])))
    for (const lat of [-60, -30, 0, 30, 60]) {
      for (let i = 0; i < 128; i++) add(latLonToXYZ(lat, (i / 128) * 360 - 180, 1.0015), latLonToXYZ(lat, ((i + 1) / 128) * 360 - 180, 1.0015))
    }
    for (let lon = -180; lon < 180; lon += 30) {
      for (let i = 0; i < 64; i++) add(latLonToXYZ(-90 + (i / 64) * 180, lon, 1.0015), latLonToXYZ(-90 + ((i + 1) / 64) * 180, lon, 1.0015))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])
  return <lineSegments geometry={geometry}><lineBasicMaterial color="#58d3dd" transparent opacity={0.2} depthWrite={false} /></lineSegments>
}

const circle = (segments = 160) => new THREE.BufferGeometry().setFromPoints(
  Array.from({ length: segments }, (_, i) => new THREE.Vector3(Math.cos((i / segments) * Math.PI * 2), 0, Math.sin((i / segments) * Math.PI * 2))),
)

/** A single band of light that sweeps the globe, like a scanner pass. */
function ScanRing({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const geometry = useMemo(() => circle(), [])
  useFrame(({ clock }) => {
    const g = group.current
    if (!g) return
    const t = (clock.elapsedTime * 0.1) % 1
    const y = -0.94 + t * 1.88
    const r = Math.sqrt(Math.max(0, 1 - y * y)) * 1.012
    g.position.y = y
    g.scale.set(r, 1, r)
  })
  if (reduced) return null
  return <group ref={group}><lineLoop geometry={geometry}><lineBasicMaterial color="#9ff6fa" transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} /></lineLoop></group>
}

/** Faint orbital rings give the projection some depth and a sense of scale. */
function OrbitRings({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const geometry = useMemo(() => circle(220), [])
  useFrame((_, dt) => { if (group.current && !reduced) group.current.rotation.y += dt * 0.05 })
  return <group ref={group}>
    <lineLoop geometry={geometry} scale={1.42} rotation={[0.35, 0, 0.18]}><lineBasicMaterial color="#4fc9d4" transparent opacity={0.16} depthWrite={false} /></lineLoop>
    <lineLoop geometry={geometry} scale={1.72} rotation={[-0.5, 0, -0.3]}><lineBasicMaterial color="#d8a65d" transparent opacity={0.1} depthWrite={false} /></lineLoop>
  </group>
}

function Particles({ reduced }: { reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const geometry = useMemo(() => {
    const count = 380
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const radius = 2.2 + Math.random() * 3.6
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions.set([radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])
  const map = useMemo(dotTexture, [])
  useFrame((_, dt) => { if (group.current && !reduced) group.current.rotation.y += dt * 0.012 })
  return <group ref={group}><points geometry={geometry}>
    <pointsMaterial size={2.6} sizeAttenuation={false} color="#a7eff3" map={map} transparent opacity={0.6} alphaTest={0.05} depthWrite={false} />
  </points></group>
}

type MarkerProps = {
  location: Placed
  selected: boolean
  reduced: boolean
  onHover: (slug: string | null) => void
  onSelect: (slug: string) => void
}

function Marker({ location, selected, reduced, onHover, onSelect }: MarkerProps) {
  const ring = useRef<THREE.Mesh>(null)
  const { camera } = useThree()
  const normal = useMemo(() => new THREE.Vector3(...latLonToXYZ(location.latitude, location.longitude, 1)), [location.latitude, location.longitude])
  const quaternion = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal), [normal])
  const phase = useMemo(() => (location.latitude * 7.13 + location.longitude * 3.31) % 1, [location.latitude, location.longitude])
  const color = selected ? AMBER : CYAN
  // A marker is on the visible hemisphere when the camera is above its tangent plane.
  const facing = () => normal.dot(camera.position) > 1.02

  useFrame(({ clock }) => {
    if (!ring.current) return
    const t = reduced ? 0.4 : (clock.elapsedTime * 0.55 + Math.abs(phase)) % 1
    ring.current.scale.setScalar(1 + t * 1.9)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = reduced ? 0.5 : (1 - t) * 0.75
  })
  useEffect(() => () => { document.body.style.cursor = '' }, [])

  return <group position={normal.toArray()} quaternion={quaternion}>
    <mesh position={[0, 0, 0.004]}><sphereGeometry args={[selected ? 0.03 : 0.022, 20, 14]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
    <mesh position={[0, 0, 0.055]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.0022, 0.0022, 0.11, 6]} /><meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} /></mesh>
    <mesh ref={ring} position={[0, 0, 0.003]}><ringGeometry args={[0.032, 0.039, 48]} /><meshBasicMaterial color={color} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
    {selected && <mesh position={[0, 0, 0.003]}><ringGeometry args={[0.062, 0.066, 48]} /><meshBasicMaterial color={AMBER} transparent opacity={0.9} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>}
    <mesh
      position={[0, 0, 0.03]}
      onPointerOver={(event) => { if (!facing()) return; event.stopPropagation(); onHover(location.slug); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { onHover(null); document.body.style.cursor = '' }}
      onClick={(event) => { if (!facing()) return; event.stopPropagation(); onSelect(location.slug) }}
    >
      <sphereGeometry args={[0.09, 12, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  </group>
}

type RigProps = {
  target: THREE.Vector3 | null
  reduced: boolean
  offset: { x: number; y: number }
  resetSignal: number
  apiRef: MutableRefObject<GlobeApi | null>
}

/** Flies the camera between the overview and a selected location, and offsets the view to make room for the dossier. */
function CameraRig({ target, reduced, offset, resetSignal, apiRef }: RigProps) {
  const { camera, size, invalidate } = useThree()
  const controls = useThree((state) => state.controls) as unknown as { update: () => void } | null
  const goal = useRef<{ dir: THREE.Vector3 | null; dist: number } | null>(null)
  const shift = useRef({ x: 0, y: 0 })
  const firstReset = useRef(resetSignal)
  const scratch = useMemo(() => ({ dir: new THREE.Vector3(), q: new THREE.Quaternion(), qk: new THREE.Quaternion() }), [])

  useEffect(() => {
    goal.current = target ? { dir: target.clone().normalize(), dist: SELECTED_DIST } : { dir: null, dist: HOME_DIST }
    invalidate()
  }, [target, invalidate])

  useEffect(() => {
    if (resetSignal === firstReset.current) return
    goal.current = { dir: HOME_DIR.clone(), dist: HOME_DIST }
    invalidate()
  }, [resetSignal, invalidate])

  useEffect(() => {
    apiRef.current = {
      nudge: (azimuth, polar, zoom) => {
        const spherical = new THREE.Spherical().setFromVector3(camera.position)
        spherical.theta += azimuth
        spherical.phi = THREE.MathUtils.clamp(spherical.phi + polar, 0.15, Math.PI - 0.15)
        spherical.radius = THREE.MathUtils.clamp(spherical.radius * zoom, MIN_DIST, MAX_DIST)
        camera.position.setFromSpherical(spherical)
        goal.current = null
        controls?.update()
        invalidate()
      },
    }
    return () => { apiRef.current = null }
  }, [apiRef, camera, controls, invalidate])

  useFrame((_, dt) => {
    const g = goal.current
    if (g) {
      const k = reduced ? 1 : 1 - Math.exp(-dt * 3.4)
      const dist = camera.position.length()
      const dir = scratch.dir.copy(camera.position).normalize()
      if (g.dir) {
        if (dir.angleTo(g.dir) > 0.0015) {
          scratch.q.setFromUnitVectors(dir, g.dir)
          scratch.qk.identity().slerp(scratch.q, k)
          dir.applyQuaternion(scratch.qk)
        } else dir.copy(g.dir)
      }
      const nextDist = dist + (g.dist - dist) * k
      camera.position.copy(dir).multiplyScalar(nextDist)
      controls?.update()
      const arrived = (!g.dir || dir.angleTo(g.dir) < 0.002) && Math.abs(nextDist - g.dist) < 0.004
      if (arrived || reduced) goal.current = null
      else invalidate()
    }

    const perspective = camera as THREE.PerspectiveCamera
    const tx = offset.x * size.width
    const ty = offset.y * size.height
    const ease = reduced ? 1 : 1 - Math.exp(-dt * 4)
    const s = shift.current
    const nx = Math.abs(tx - s.x) < 0.5 ? tx : s.x + (tx - s.x) * ease
    const ny = Math.abs(ty - s.y) < 0.5 ? ty : s.y + (ty - s.y) * ease
    const moving = nx !== s.x || ny !== s.y
    s.x = nx; s.y = ny
    if (nx !== 0 || ny !== 0) perspective.setViewOffset(size.width, size.height, nx, ny, size.width, size.height)
    else if (perspective.view?.enabled) perspective.clearViewOffset()
    if (moving) invalidate()
  })
  return null
}

/** Keeps the DOM name labels glued to their markers and hides the ones on the far side of the globe. */
function LabelTracker({ placed, labelRefs }: { placed: Placed[]; labelRefs: SceneProps['labelRefs'] }) {
  const normals = useMemo(() => placed.map((location) => ({ slug: location.slug, normal: new THREE.Vector3(...latLonToXYZ(location.latitude, location.longitude, 1)) })), [placed])
  const point = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    for (const { slug, normal } of normals) {
      const element = labelRefs.current[slug]
      if (!element) continue
      point.copy(normal).multiplyScalar(1.13).project(camera)
      const x = (point.x * 0.5 + 0.5) * size.width
      const y = (-point.y * 0.5 + 0.5) * size.height
      const half = element.offsetWidth / 2
      const clampedX = Math.min(Math.max(x, half + 6), size.width - half - 6)
      element.style.transform = `translate(${clampedX.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`
      element.style.opacity = normal.dot(camera.position) > 1.02 && point.z < 1 ? '1' : '0'
    }
  })
  return null
}

function Scene({ locations, selectedSlug, onSelect, reduced, offset, resetSignal, apiRef, onHover, labelRefs }: SceneProps) {
  const [idle, setIdle] = useState(true)
  const idleTimer = useRef<number | undefined>(undefined)
  const invalidate = useThree((state) => state.invalidate)
  const placed = useMemo(() => locations.filter(isPlaced), [locations])
  const selected = placed.find((location) => location.slug === selectedSlug)
  const target = useMemo(
    () => (selected ? new THREE.Vector3(...latLonToXYZ(selected.latitude, selected.longitude, 1)) : null),
    [selected],
  )
  useEffect(() => () => window.clearTimeout(idleTimer.current), [])
  useEffect(() => { invalidate() }, [selectedSlug, invalidate])

  return <>
    <group>
      <Atmosphere /><Ocean /><Land /><Graticule /><ScanRing reduced={reduced} /><OrbitRings reduced={reduced} />
      {placed.map((location) => <Marker key={location.id} location={location} reduced={reduced}
        selected={location.slug === selectedSlug} onHover={onHover} onSelect={onSelect} />)}
    </group>
    <LabelTracker placed={placed} labelRefs={labelRefs} />
    <Particles reduced={reduced} />
    <CameraRig target={target} reduced={reduced} offset={offset} resetSignal={resetSignal} apiRef={apiRef} />
    <OrbitControls makeDefault enablePan={false} enableDamping dampingFactor={0.08} rotateSpeed={0.5} zoomSpeed={0.6}
      minDistance={MIN_DIST} maxDistance={MAX_DIST} minPolarAngle={0.15} maxPolarAngle={Math.PI - 0.15}
      autoRotate={!reduced && !selected && idle} autoRotateSpeed={0.5}
      onStart={() => { window.clearTimeout(idleTimer.current); setIdle(false) }}
      onEnd={() => { window.clearTimeout(idleTimer.current); idleTimer.current = window.setTimeout(() => setIdle(true), 2500) }}
      onChange={() => invalidate()} />
  </>
}

class GlobeBoundary extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFail() }
  render() { return this.state.failed ? null : this.props.children }
}

export default function LostEarthGlobe({ onFail, apiRef, ...scene }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({})
  // Disposing the canvas on purpose (for example switching to the 2D map) also fires a context-loss event; that is not a failure.
  const disposed = useRef(false)
  useEffect(() => { disposed.current = false; return () => { disposed.current = true } }, [])
  const placed = useMemo(() => scene.locations.filter(isPlaced), [scene.locations])
  const onKeyDown = (event: React.KeyboardEvent) => {
    const nudge = apiRef.current?.nudge
    if (!nudge) return
    const step = 0.14
    const actions: Record<string, [number, number, number]> = {
      ArrowLeft: [step, 0, 1], ArrowRight: [-step, 0, 1], ArrowUp: [0, step, 1], ArrowDown: [0, -step, 1],
      '+': [0, 0, 0.88], '=': [0, 0, 0.88], '-': [0, 0, 1.14], _: [0, 0, 1.14],
    }
    const action = actions[event.key]
    if (!action) return
    event.preventDefault()
    nudge(...action)
  }
  return <div className="hl-globe" tabIndex={0} role="group" onKeyDown={onKeyDown}
    aria-label="Interactive holographic globe. Use the arrow keys to rotate and plus or minus to zoom. All four locations are also listed below the globe.">
    <GlobeBoundary onFail={onFail}>
      <Canvas frameloop={scene.reduced ? 'demand' : 'always'} dpr={[1, 1.75]}
        camera={{ fov: 38, near: 0.1, far: 60, position: HOME_DIR.clone().multiplyScalar(HOME_DIST).toArray() }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); if (!disposed.current) onFail() })}>
        <Scene {...scene} apiRef={apiRef} onHover={setHovered} labelRefs={labelRefs} />
      </Canvas>
    </GlobeBoundary>
    <div className="hl-pins" aria-hidden="true">
      {placed.map((location) => <div key={location.id} ref={(element) => { labelRefs.current[location.slug] = element }}
        className={`hl-pin ${location.slug === scene.selectedSlug ? 'is-selected' : ''} ${location.slug === hovered ? 'is-hover' : ''}`}>
        <b>{location.name}</b><small>{location.records.length} RECORDS</small>
      </div>)}
    </div>
  </div>
}
