import { Suspense, Component, type ErrorInfo, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import type { ArtifactKey } from './types'
import { RoomEnvironment } from './RoomEnvironment'
import { Artifacts } from './Artifacts'
import { Lighting } from './Lighting'
import { CameraController, FIXED_OBSERVER_POS_DESKTOP } from './CameraController'

interface SceneProps {
  selected: ArtifactKey | null
  explored: ArtifactKey[]
  showMarkers?: boolean
  onSelect: (key: ArtifactKey) => void
  onFirstInteraction?: () => void
  onWebGLFailure?: () => void
}

class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode; onError?: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('3D Canvas encountered an error, falling back:', error, errorInfo)
    this.props.onError?.()
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

export function Scene({
  selected,
  explored,
  showMarkers = false,
  onSelect,
  onFirstInteraction,
  onWebGLFailure,
}: SceneProps) {
  return (
    <CanvasErrorBoundary
      fallback={<div className="canvas-fallback-notice">3D scene unavailable. Showing archival view.</div>}
      onError={onWebGLFailure}
    >
      <div className="canvas-container" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{
            position: FIXED_OBSERVER_POS_DESKTOP,
            fov: 55,
            near: 0.1,
            far: 20,
          }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            alpha: false,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#140f0a')
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.15
          }}
        >
          <Suspense fallback={null}>
            <Lighting />
            <RoomEnvironment />
            <Artifacts
              selected={selected}
              explored={explored}
              showMarkers={showMarkers}
              onSelect={onSelect}
            />
            <CameraController
              selected={selected}
              onFirstInteraction={onFirstInteraction}
            />
          </Suspense>
        </Canvas>
      </div>
    </CanvasErrorBoundary>
  )
}
