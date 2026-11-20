import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { ArtifactKey } from './types'
import { artifactData } from './data'

export const FIXED_OBSERVER_POS_DESKTOP: [number, number, number] = [-0.15, 1.52, 2.52]
export const FIXED_OBSERVER_POS_MOBILE: [number, number, number] = [-0.08, 1.60, 2.82]

interface CameraControllerProps {
  selected: ArtifactKey | null
  onFirstInteraction?: () => void
}

export function CameraController({
  selected,
  onFirstInteraction,
}: CameraControllerProps) {
  const { camera, size, pointer, gl } = useThree()

  const isMobile = size.width < 768

  // Rotational state: yaw (left/right) and pitch (up/down)
  // Initial yaw is gently angled (+0.12 rad) to frame both warm desk & glowing harbor window
  const currentYaw = useRef(0.12)
  const currentPitch = useRef(0)
  const targetYaw = useRef(0.12)
  const targetPitch = useRef(0)

  // Drag interaction state
  const isDragging = useRef(false)
  const lastPointerPos = useRef({ x: 0, y: 0 })

  // Position and lookAt vectors for lerping
  const currentCamPos = useRef(new THREE.Vector3(...(isMobile ? FIXED_OBSERVER_POS_MOBILE : FIXED_OBSERVER_POS_DESKTOP)))
  const currentLookAt = useRef(new THREE.Vector3(0.05, 1.08, -0.1))

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selected) return // disabled while modal open
      const step = 0.08
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        targetYaw.current = Math.max(-0.78, targetYaw.current - step)
        onFirstInteraction?.()
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        targetYaw.current = Math.min(0.78, targetYaw.current + step)
        onFirstInteraction?.()
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        targetPitch.current = Math.min(0.28, targetPitch.current + step * 0.7)
        onFirstInteraction?.()
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        targetPitch.current = Math.max(-0.35, targetPitch.current - step * 0.7)
        onFirstInteraction?.()
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'Home') {
        targetYaw.current = 0.12
        targetPitch.current = 0
        onFirstInteraction?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, onFirstInteraction])

  // Mouse & touch drag look-around
  useEffect(() => {
    const dom = gl.domElement

    const onPointerDown = (e: PointerEvent) => {
      if (selected) return
      isDragging.current = true
      lastPointerPos.current = { x: e.clientX, y: e.clientY }
      onFirstInteraction?.()
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current || selected) return
      const dx = e.clientX - lastPointerPos.current.x
      const dy = e.clientY - lastPointerPos.current.y
      lastPointerPos.current = { x: e.clientX, y: e.clientY }

      // Sensitive but controlled yaw/pitch update with strict clamping
      const sensitivity = isMobile ? 0.004 : 0.0032
      targetYaw.current = Math.max(-0.78, Math.min(0.78, targetYaw.current - dx * sensitivity))
      targetPitch.current = Math.max(-0.35, Math.min(0.28, targetPitch.current - dy * sensitivity))
    }

    const onPointerUp = () => {
      isDragging.current = false
    }

    dom.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    return () => {
      dom.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [gl, selected, isMobile, onFirstInteraction])

  useFrame((_state, delta) => {
    const perspCam = camera as THREE.PerspectiveCamera

    if (selected && artifactData[selected]) {
      // Focus Camera on Selected Artifact (Cinematic Inspection Mode)
      const info = artifactData[selected]
      const destPos = new THREE.Vector3(...info.cameraPosition)
      const destTarget = new THREE.Vector3(...info.cameraTarget)

      currentCamPos.current.lerp(destPos, Math.min(1, delta * 4.2))
      currentLookAt.current.lerp(destTarget, Math.min(1, delta * 4.2))

      camera.position.copy(currentCamPos.current)
      camera.lookAt(currentLookAt.current)

      // Tighten FOV slightly for inspection
      if (Math.abs(perspCam.fov - 46) > 0.1) {
        perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, 46, delta * 4)
        perspCam.updateProjectionMatrix()
      }
    } else {
      // Room Overview Mode
      const destPos = new THREE.Vector3(...(isMobile ? FIXED_OBSERVER_POS_MOBILE : FIXED_OBSERVER_POS_DESKTOP))
      currentCamPos.current.lerp(destPos, Math.min(1, delta * 3.5))
      camera.position.copy(currentCamPos.current)

      // Target FOV: 68 on mobile for wide framing, 55 on desktop for cinematic breadth
      const targetFOV = isMobile ? 68 : 55
      if (Math.abs(perspCam.fov - targetFOV) > 0.1) {
        perspCam.fov = THREE.MathUtils.lerp(perspCam.fov, targetFOV, delta * 4)
        perspCam.updateProjectionMatrix()
      }

      // Add gentle subtle mouse parallax when not dragging
      const parallaxYaw = !isDragging.current ? pointer.x * 0.06 : 0
      const parallaxPitch = !isDragging.current ? pointer.y * 0.03 : 0

      // Damped rotational lerp
      const dampSpeed = Math.min(1, delta * 8.0)
      currentYaw.current = THREE.MathUtils.lerp(
        currentYaw.current,
        targetYaw.current + parallaxYaw,
        dampSpeed
      )
      currentPitch.current = THREE.MathUtils.lerp(
        currentPitch.current,
        targetPitch.current + parallaxPitch,
        dampSpeed
      )

      // Calculate forward direction vector from yaw & pitch
      // Default gaze is naturally directed at the desk & room center (-0.14 in y)
      const dirX = Math.sin(currentYaw.current)
      const dirY = Math.sin(currentPitch.current) - 0.14
      const dirZ = -Math.cos(currentYaw.current)

      const targetLook = new THREE.Vector3(
        camera.position.x + dirX * 3.0,
        camera.position.y + dirY * 3.0,
        camera.position.z + dirZ * 3.0
      )

      currentLookAt.current.lerp(targetLook, Math.min(1, delta * 8.0))
      camera.lookAt(currentLookAt.current)
    }
  })

  return null
}
