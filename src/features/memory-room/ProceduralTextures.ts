import * as THREE from 'three'

/**
 * Creates canvas-based procedural textures with high visual fidelity and zero external network latency.
 */
export class ProceduralTextures {
  private static cache = new Map<string, THREE.CanvasTexture>()

  /**
   * Rich warm walnut wood texture with organic grain and satin specular highlights.
   */
  static getWoodTexture(): THREE.CanvasTexture {
    if (this.cache.has('wood')) return this.cache.get('wood')!

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Base rich warm golden walnut tone
    ctx.fillStyle = '#6e4424'
    ctx.fillRect(0, 0, 512, 512)

    // Wood rings and organic warm grain
    for (let y = 0; y < 512; y += 2) {
      const noise = Math.sin(y * 0.05) * 16 + Math.cos(y * 0.02) * 8
      const lightness = 62 + Math.floor(Math.sin((y + noise) * 0.12) * 18)
      ctx.fillStyle = `rgb(${lightness + 50}, ${lightness + 26}, ${lightness + 8})`
      ctx.fillRect(0, y, 512, 2)
    }

    // Wood pores and fibrous grain
    ctx.fillStyle = 'rgba(55, 30, 15, 0.35)'
    for (let i = 0; i < 70; i++) {
      const rx = Math.random() * 512
      const rw = Math.random() * 3 + 1
      ctx.fillRect(rx, 0, rw, 512)
    }

    // Warm golden satin sheen gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512)
    grad.addColorStop(0, 'rgba(255, 225, 160, 0.22)')
    grad.addColorStop(0.5, 'rgba(240, 180, 110, 0.08)')
    grad.addColorStop(1, 'rgba(60, 30, 12, 0.25)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 512, 512)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    this.cache.set('wood', texture)
    return texture
  }

  /**
   * Warm architectural sandstone wall and floor texture with visible mortar joints.
   */
  static getStoneTexture(): THREE.CanvasTexture {
    if (this.cache.has('stone')) return this.cache.get('stone')!

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Base warm architectural sandstone / umber tone
    ctx.fillStyle = '#947e68'
    ctx.fillRect(0, 0, 512, 512)

    // Warm stone speckles and tactile mineral variation
    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * 512
      const y = Math.random() * 512
      const lum = Math.floor(100 + Math.random() * 55)
      ctx.fillStyle = `rgba(${lum + 30}, ${lum + 14}, ${lum}, 0.22)`
      ctx.fillRect(x, y, 2, 2)
    }

    // Warm mortar joints
    ctx.strokeStyle = '#4e3d30'
    ctx.lineWidth = 4
    ctx.strokeRect(0, 0, 512, 512)
    ctx.beginPath()
    ctx.moveTo(0, 256)
    ctx.lineTo(512, 256)
    ctx.moveTo(256, 0)
    ctx.lineTo(256, 512)
    ctx.stroke()

    // Warm stone bevel highlights along seams
    ctx.strokeStyle = '#c2a890'
    ctx.lineWidth = 1.5
    ctx.strokeRect(2, 2, 508, 508)

    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(3, 3)
    this.cache.set('stone', texture)
    return texture
  }

  /**
   * Aged letter sheet texture with handwriting lines and tea stain aging.
   */
  static getLetterTexture(): THREE.CanvasTexture {
    if (this.cache.has('letter')) return this.cache.get('letter')!

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Cream aged parchment
    ctx.fillStyle = '#f4ebd4'
    ctx.fillRect(0, 0, 512, 512)

    // Subtle tea-stain wash
    const stain = ctx.createRadialGradient(220, 240, 50, 256, 256, 300)
    stain.addColorStop(0, 'rgba(240, 220, 180, 0.4)')
    stain.addColorStop(0.7, 'rgba(200, 170, 125, 0.35)')
    stain.addColorStop(1, 'rgba(150, 115, 70, 0.55)')
    ctx.fillStyle = stain
    ctx.fillRect(0, 0, 512, 512)

    // Ruled notebook lines
    ctx.strokeStyle = 'rgba(170, 150, 120, 0.28)'
    ctx.lineWidth = 1
    for (let y = 110; y < 460; y += 28) {
      ctx.beginPath()
      ctx.moveTo(35, y)
      ctx.lineTo(475, y)
      ctx.stroke()
    }

    // Faded handwriting lines
    ctx.fillStyle = 'rgba(45, 32, 18, 0.88)'
    ctx.font = 'italic 16px "Playfair Display", Georgia, serif'
    ctx.fillText('22 March 2058 · 05:29', 40, 65)

    ctx.font = 'italic bold 20px "Playfair Display", Georgia, serif'
    ctx.fillText('To whoever finds this,', 40, 115)

    ctx.font = 'italic 16px "Playfair Display", Georgia, serif'
    const lines = [
      'They moved the departure forward. The public bulletin says',
      'weather, but we heard the harbor alarms before dawn.',
      'Mother put my blue coat by the door. She says we are',
      'going to see the trains. I don’t think that is true.',
      'If you ever forget the color of morning, look through the north glass.',
      'Seventeen unmarked vehicles crossed the bridge at 04:51.',
    ]
    lines.forEach((line, i) => {
      ctx.fillText(line, 40, 160 + i * 38)
    })

    ctx.font = 'italic bold 18px "Playfair Display", Georgia, serif'
    ctx.fillText('— Mara Voss, age 20', 270, 440)

    const texture = new THREE.CanvasTexture(canvas)
    this.cache.set('letter', texture)
    return texture
  }

  /**
   * Cassette recorder body texture with labeled faceplate and reel markings.
   */
  static getCassetteTexture(): THREE.CanvasTexture {
    if (this.cache.has('cassette')) return this.cache.get('cassette')!

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Vintage brushed graphite chassis
    ctx.fillStyle = '#2d2b26'
    ctx.fillRect(0, 0, 512, 512)

    // Brushed metal horizontal lines
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
    for (let y = 0; y < 512; y += 4) {
      ctx.fillRect(0, y, 512, 1)
    }

    // Speaker grille section (left side)
    ctx.fillStyle = '#171511'
    ctx.fillRect(25, 60, 160, 390)
    ctx.fillStyle = '#423d35'
    for (let y = 75; y < 440; y += 12) {
      for (let x = 35; x < 175; x += 12) {
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Tape compartment (right side)
    ctx.fillStyle = '#3a362e'
    ctx.strokeStyle = '#706552'
    ctx.lineWidth = 4
    ctx.strokeRect(210, 70, 275, 230)
    ctx.fillRect(210, 70, 275, 230)

    // Tape cassette window
    ctx.fillStyle = '#12110e'
    ctx.fillRect(235, 110, 225, 120)

    // Twin spool holes
    ctx.fillStyle = '#f0d7ab'
    ctx.beginPath()
    ctx.arc(285, 170, 26, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(410, 170, 26, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#171512'
    ctx.beginPath()
    ctx.arc(285, 170, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(410, 170, 14, 0, Math.PI * 2)
    ctx.fill()

    // Label text
    ctx.fillStyle = '#f0c78b'
    ctx.font = 'bold 12px "DM Mono", monospace'
    ctx.fillText('PROJECT ECHO · TAPE 04 · 2058', 235, 260)
    ctx.font = '10px "DM Mono", monospace'
    ctx.fillText('MARA VOSS · KITCHEN NOTES', 235, 280)

    // Active red power LED
    ctx.fillStyle = '#ff3d2e'
    ctx.beginPath()
    ctx.arc(465, 90, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 61, 46, 0.45)'
    ctx.beginPath()
    ctx.arc(465, 90, 14, 0, Math.PI * 2)
    ctx.fill()

    // Control buttons at bottom right
    ctx.fillStyle = '#4c453a'
    ctx.fillRect(210, 340, 275, 70)
    const buttons = ['REC', 'PLAY', 'REV', 'FWD', 'STOP']
    buttons.forEach((btn, i) => {
      ctx.fillStyle = btn === 'REC' ? '#b53c2e' : '#6b6152'
      ctx.fillRect(220 + i * 53, 350, 46, 50)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px monospace'
      ctx.fillText(btn, 228 + i * 53, 380)
    })

    const texture = new THREE.CanvasTexture(canvas)
    this.cache.set('cassette', texture)
    return texture
  }

  /**
   * Rich, luminous stylized panorama outside Mara's window:
   * Evocative underground city vista overlooking the submerged harbor,
   * lit bridge, distant infrastructure, and the 04:51 convoy headlights.
   */
  static getWindowVistaTexture(): THREE.CanvasTexture {
    if (this.cache.has('vista')) return this.cache.get('vista')!

    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Atmospheric subterranean cavern gradient with deep twilight tone separation
    const sky = ctx.createLinearGradient(0, 0, 0, 512)
    sky.addColorStop(0, '#020b10')
    sky.addColorStop(0.3, '#051b24')
    sky.addColorStop(0.65, '#0a3242')
    sky.addColorStop(0.85, '#0c495e')
    sky.addColorStop(1, '#072b38')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, 1024, 512)

    // Layer 1: Cavern roof support arches & industrial hanging gantries
    ctx.fillStyle = '#081f2a'
    for (let x = 20; x < 1024; x += 140) {
      ctx.fillRect(x, 0, 28, 210)
      ctx.beginPath()
      ctx.arc(x + 14, 210, 48, 0, Math.PI)
      ctx.fill()

      // Cyan / Amber marker beacons on arches
      ctx.fillStyle = x % 280 === 20 ? '#fbbf24' : '#38bdf8'
      ctx.beginPath()
      ctx.arc(x + 14, 214, 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#081f2a'
    }

    // Layer 2: Distant Subterranean Habitation Megastructures (Soft Atmospheric Layer)
    const distantTowers = [
      { x: 90, w: 80, h: 220 },
      { x: 230, w: 95, h: 260 },
      { x: 420, w: 110, h: 280 },
      { x: 620, w: 85, h: 240 },
      { x: 800, w: 90, h: 210 },
    ]
    distantTowers.forEach((t) => {
      ctx.fillStyle = '#0b2835'
      ctx.fillRect(t.x, 340 - t.h, t.w, t.h)
      // Soft cyan window haze
      for (let wy = 350 - t.h + 15; wy < 330; wy += 22) {
        for (let wx = t.x + 8; wx < t.x + t.w - 8; wx += 16) {
          if (Math.random() > 0.45) {
            ctx.fillStyle = 'rgba(103, 232, 249, 0.45)'
            ctx.fillRect(wx, wy, 5, 7)
          }
        }
      }
    })

    // Layer 3: Main Subterranean Habitation Megastructures (Foreground Spire Layer)
    const towers = [
      { x: 30, w: 100, h: 280 },
      { x: 145, w: 130, h: 340 },
      { x: 295, w: 95, h: 260 },
      { x: 720, w: 125, h: 320 },
      { x: 865, w: 115, h: 290 },
    ]
    towers.forEach((t) => {
      ctx.fillStyle = '#071c26'
      ctx.fillRect(t.x, 350 - t.h, t.w, t.h)

      // Densely illuminated window grids with electric cyan and warm amber tungsten squares
      for (let wy = 360 - t.h + 14; wy < 335; wy += 14) {
        for (let wx = t.x + 10; wx < t.x + t.w - 10; wx += 11) {
          if (Math.random() > 0.28) {
            const isCyan = Math.random() > 0.35
            ctx.fillStyle = isCyan ? '#67e8f9' : '#fde047'
            ctx.fillRect(wx, wy, 6, 8)

            // Occasional bright bloom square
            if (Math.random() > 0.85) {
              ctx.fillStyle = isCyan ? '#a5f3fc' : '#ffffff'
              ctx.fillRect(wx + 1, wy + 1, 4, 6)
            }
          }
        }
      }
    })

    // Layer 4: Submerged Boston Harbor Waterline
    const water = ctx.createLinearGradient(0, 340, 0, 512)
    water.addColorStop(0, '#104d5c')
    water.addColorStop(0.35, '#0a2a36')
    water.addColorStop(1, '#04141c')
    ctx.fillStyle = water
    ctx.fillRect(0, 340, 1024, 172)

    // Vibrant water ripple reflections
    ctx.fillStyle = 'rgba(56, 189, 248, 0.38)'
    for (let y = 345; y < 510; y += 6) {
      const rw = 55 + (y - 345) * 3.2
      ctx.fillRect(380 - rw / 2, y, rw, 2.5)
      ctx.fillRect(680 - rw / 3, y, rw * 0.9, 2.5)
    }

    // Layer 5: The North Bridge (Arch & Truss Structure)
    ctx.fillStyle = '#113b4c'
    ctx.fillRect(80, 324, 864, 18) // Roadway deck
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2.5

    // Suspension bridge piers & stay cables
    for (let x = 140; x <= 880; x += 135) {
      ctx.fillStyle = '#0b2633'
      ctx.fillRect(x - 9, 240, 18, 104)

      // Bridge pier safety beacons
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(x, 242, 4, 0, Math.PI * 2)
      ctx.fill()

      // Suspension cables
      ctx.beginPath()
      ctx.moveTo(x, 242)
      ctx.lineTo(x + 68, 324)
      ctx.moveTo(x, 242)
      ctx.lineTo(x - 68, 324)
      ctx.stroke()
    }

    // Bridge roadway string lights (amber safety lamps along roadway deck)
    ctx.fillStyle = '#fef08a'
    for (let bx = 90; bx < 940; bx += 22) {
      ctx.fillRect(bx, 322, 3, 3)
    }

    // Layer 6: The 17-Vehicle Evacuation Convoy Headlights (At 04:51)
    for (let i = 0; i < 17; i++) {
      const cx = 270 + i * 29
      const cy = 321

      // Glowing headlight halo
      const halo = ctx.createRadialGradient(cx, cy, 1, cx, cy, 16)
      halo.addColorStop(0, '#ffffff')
      halo.addColorStop(0.3, '#fde047')
      halo.addColorStop(0.65, 'rgba(245, 158, 11, 0.45)')
      halo.addColorStop(1, 'rgba(245, 158, 11, 0)')
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(cx, cy, 16, 0, Math.PI * 2)
      ctx.fill()

      // Twin core headlights
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(cx - 3, cy, 3, 0, Math.PI * 2)
      ctx.arc(cx + 3, cy, 3, 0, Math.PI * 2)
      ctx.fill()

      // Golden headlight vertical reflection streaks on water
      ctx.fillStyle = 'rgba(253, 224, 71, 0.65)'
      ctx.fillRect(cx - 3, 342, 6, 55)
    }

    // Layer 7: Atmospheric Cyan Volumetric Mist
    const fog = ctx.createLinearGradient(0, 150, 0, 360)
    fog.addColorStop(0, 'rgba(34, 211, 238, 0)')
    fog.addColorStop(0.55, 'rgba(34, 211, 238, 0.45)')
    fog.addColorStop(1, 'rgba(16, 77, 92, 0.22)')
    ctx.fillStyle = fog
    ctx.fillRect(0, 150, 1024, 210)

    // Red high-altitude broadcast tower beacon
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(205, 18, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'
    ctx.beginPath()
    ctx.arc(205, 18, 18, 0, Math.PI * 2)
    ctx.fill()

    const texture = new THREE.CanvasTexture(canvas)
    this.cache.set('vista', texture)
    return texture
  }

  /**
   * Photo texture for the framed family photograph.
   */
  static getFamilyPhotoTexture(): THREE.CanvasTexture {
    if (this.cache.has('family_photo')) return this.cache.get('family_photo')!

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!

    // Vintage warm sepia photographic portrait
    const sepia = ctx.createLinearGradient(0, 0, 512, 512)
    sepia.addColorStop(0, '#755c46')
    sepia.addColorStop(0.5, '#9a7c5b')
    sepia.addColorStop(1, '#53402e')
    ctx.fillStyle = sepia
    ctx.fillRect(0, 0, 512, 512)

    // Silhouettes of Elena, Tomas, and three-year-old Mara
    ctx.fillStyle = '#3a2b1d'
    // Elena (left)
    ctx.beginPath()
    ctx.arc(190, 190, 50, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(185, 340, 75, 110, 0, 0, Math.PI * 2)
    ctx.fill()

    // Tomas (right)
    ctx.beginPath()
    ctx.arc(330, 175, 55, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(335, 340, 85, 120, 0, 0, Math.PI * 2)
    ctx.fill()

    // Young Mara (center front)
    ctx.beginPath()
    ctx.arc(260, 280, 36, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(260, 400, 50, 80, 0, 0, Math.PI * 2)
    ctx.fill()

    // Photographic white archival matte border
    ctx.lineWidth = 26
    ctx.strokeStyle = '#f8f1e2'
    ctx.strokeRect(0, 0, 512, 512)

    // Handwritten caption at bottom
    ctx.fillStyle = '#6e543c'
    ctx.font = 'italic 16px "Playfair Display", Georgia, serif'
    ctx.fillText('Boston Harbor · 18 April 2041', 135, 492)

    const texture = new THREE.CanvasTexture(canvas)
    this.cache.set('family_photo', texture)
    return texture
  }

  /**
   * Blueprint / sketch pinned on the wall (Boston Harbor Gates).
   */
  static getBlueprintTexture(): THREE.CanvasTexture {
    if (this.cache.has('blueprint')) return this.cache.get('blueprint')!

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 384
    const ctx = canvas.getContext('2d')!

    // Cyan blueprint paper
    ctx.fillStyle = '#0d2c38'
    ctx.fillRect(0, 0, 512, 384)

    // Grid lines
    ctx.strokeStyle = 'rgba(78, 226, 236, 0.2)'
    ctx.lineWidth = 1
    for (let x = 0; x < 512; x += 24) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 384)
      ctx.stroke()
    }
    for (let y = 0; y < 384; y += 24) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(512, y)
      ctx.stroke()
    }

    // Architectural schematic lines
    ctx.strokeStyle = '#6feaf0'
    ctx.lineWidth = 2
    ctx.strokeRect(48, 48, 416, 288)

    // Harbor gate schematics
    ctx.beginPath()
    ctx.arc(256, 192, 70, 0, Math.PI * 2)
    ctx.moveTo(120, 192)
    ctx.lineTo(392, 192)
    ctx.moveTo(256, 100)
    ctx.lineTo(256, 284)
    ctx.stroke()

    // Text label
    ctx.fillStyle = '#a8f2f6'
    ctx.font = 'bold 12px "DM Mono", monospace'
    ctx.fillText('DIRECTORATE TRANSIT GATE 17-B · SUB-LEVEL', 60, 80)
    ctx.font = '10px "DM Mono", monospace'
    ctx.fillText('RECONSTRUCTION ELEVATION · MARA VOSS 2058', 60, 310)

    const texture = new THREE.CanvasTexture(canvas)
    this.cache.set('blueprint', texture)
    return texture
  }
}
