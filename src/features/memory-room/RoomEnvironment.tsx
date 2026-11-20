import { useMemo } from 'react'
import * as THREE from 'three'
import { ProceduralTextures } from './ProceduralTextures'

export function RoomEnvironment() {
  const woodTexture = useMemo(() => ProceduralTextures.getWoodTexture(), [])
  const stoneTexture = useMemo(() => ProceduralTextures.getStoneTexture(), [])
  const vistaTexture = useMemo(() => ProceduralTextures.getWindowVistaTexture(), [])
  const blueprintTexture = useMemo(() => ProceduralTextures.getBlueprintTexture(), [])

  return (
    <group>
      {/* ================= FLOOR & WOVEN RUG ================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[8.0, 7.0]} />
        <meshStandardMaterial
          map={stoneTexture}
          roughness={0.65}
          metalness={0.08}
          color="#9e8770"
        />
      </mesh>

      {/* Decorative Woven Floor Rug Beneath Desk & Chair (Rich Dimensional Terracotta & Gold) */}
      <group position={[0.05, 0, 0.48]}>
        {/* Main Rug Body - Dimensional Box with subtle shadow */}
        <mesh position={[0, 0.007, 0]} receiveShadow>
          <boxGeometry args={[3.2, 0.014, 2.4]} />
          <meshStandardMaterial
            roughness={0.82}
            metalness={0.04}
            color="#8b321f"
          />
        </mesh>
        {/* Rug Woven Border - Antique Woven Gold */}
        <mesh position={[0, 0.015, 0]}>
          <boxGeometry args={[3.06, 0.002, 2.26]} />
          <meshStandardMaterial
            roughness={0.78}
            color="#c48a46"
          />
        </mesh>
        {/* Rug Inner Medallion Pattern - Deep Wine Ruby */}
        <mesh position={[0, 0.0165, 0]}>
          <boxGeometry args={[2.5, 0.002, 1.7]} />
          <meshStandardMaterial
            roughness={0.85}
            color="#542013"
          />
        </mesh>
        {/* Woven Fringe Threads at Ends */}
        {[-1.6, 1.6].map((fx, i) => (
          <mesh key={i} position={[fx, 0.007, 0]}>
            <boxGeometry args={[0.06, 0.01, 2.38]} />
            <meshStandardMaterial color="#d4b584" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* ================= BACK WALL WITH WINDOW CUTOUT (Warm Architectural Sandstone) ================= */}
      {/* Left section of back wall */}
      <mesh position={[-1.75, 1.4, -1.8]} receiveShadow>
        <planeGeometry args={[2.5, 2.8]} />
        <meshStandardMaterial
          map={stoneTexture}
          roughness={0.72}
          color="#d4c3af"
        />
      </mesh>

      {/* Wall section above window */}
      <mesh position={[0.75, 2.55, -1.8]} receiveShadow>
        <planeGeometry args={[2.5, 0.5]} />
        <meshStandardMaterial
          map={stoneTexture}
          roughness={0.72}
          color="#d4c3af"
        />
      </mesh>

      {/* Wall section below window */}
      <mesh position={[0.75, 0.45, -1.8]} receiveShadow>
        <planeGeometry args={[2.5, 0.9]} />
        <meshStandardMaterial
          map={stoneTexture}
          roughness={0.72}
          color="#d4c3af"
        />
      </mesh>

      {/* Right section of back wall */}
      <mesh position={[2.75, 1.4, -1.8]} receiveShadow>
        <planeGeometry args={[1.5, 2.8]} />
        <meshStandardMaterial
          map={stoneTexture}
          roughness={0.72}
          color="#d4c3af"
        />
      </mesh>

      {/* Baseboards along back wall - Polished Rich Chestnut */}
      <mesh position={[0, 0.05, -1.78]}>
        <boxGeometry args={[6.0, 0.1, 0.04]} />
        <meshStandardMaterial map={woodTexture} roughness={0.45} color="#6e3f22" />
      </mesh>

      {/* ================= HARBOR WINDOW & VISTA (Crisp, Detailed, Layered) ================= */}
      {/* Luminous City Vista Backdrop */}
      <mesh position={[0.75, 1.5, -1.81]}>
        <planeGeometry args={[2.24, 1.68]} />
        <meshBasicMaterial map={vistaTexture} toneMapped={false} />
      </mesh>

      {/* Window Outer Steel Framing Border (Open Aperture to reveal city vista) */}
      <mesh position={[0.75, 2.33, -1.77]}>
        <boxGeometry args={[2.28, 0.05, 0.06]} />
        <meshStandardMaterial color="#3a4752" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh position={[0.75, 0.67, -1.77]}>
        <boxGeometry args={[2.28, 0.05, 0.06]} />
        <meshStandardMaterial color="#3a4752" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh position={[-0.37, 1.5, -1.77]}>
        <boxGeometry args={[0.06, 1.68, 0.06]} />
        <meshStandardMaterial color="#3a4752" roughness={0.45} metalness={0.65} />
      </mesh>
      <mesh position={[1.87, 1.5, -1.77]}>
        <boxGeometry args={[0.06, 1.68, 0.06]} />
        <meshStandardMaterial color="#3a4752" roughness={0.45} metalness={0.65} />
      </mesh>

      {/* Window Sill Shelf */}
      <mesh position={[0.75, 0.65, -1.73]}>
        <boxGeometry args={[2.3, 0.06, 0.18]} />
        <meshStandardMaterial color="#4a5560" roughness={0.4} metalness={0.55} />
      </mesh>

      {/* Window Structural Cross Mullions */}
      <mesh position={[0.75, 1.5, -1.74]}>
        <boxGeometry args={[2.14, 0.035, 0.04]} />
        <meshStandardMaterial color="#3f4d59" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0.05, 1.5, -1.74]}>
        <boxGeometry args={[0.035, 1.6, 0.04]} />
        <meshStandardMaterial color="#3f4d59" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[1.45, 1.5, -1.74]}>
        <boxGeometry args={[0.035, 1.6, 0.04]} />
        <meshStandardMaterial color="#3f4d59" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Window Glass Pane with subtle cyan reflection (Zero glare overlays to ensure crisp outside city view) */}
      <mesh position={[0.75, 1.5, -1.75]}>
        <planeGeometry args={[2.14, 1.6]} />
        <meshStandardMaterial
          transparent
          opacity={0.06}
          roughness={0.05}
          metalness={0.2}
          color="#67e8f9"
          depthWrite={false}
        />
      </mesh>

      {/* Window Sill Potted Calendula Seedling (Elena's heritage) */}
      <group position={[1.5, 0.74, -1.72]}>
        {/* Clay Pot */}
        <mesh castShadow>
          <cylinderGeometry args={[0.05, 0.038, 0.1, 16]} />
          <meshStandardMaterial color="#944d2d" roughness={0.7} />
        </mesh>
        {/* Pot Soil */}
        <mesh position={[0, 0.045, 0]}>
          <cylinderGeometry args={[0.047, 0.047, 0.01, 16]} />
          <meshStandardMaterial color="#331e10" roughness={0.95} />
        </mesh>
        {/* Green Calendula Plant Leaves */}
        <mesh position={[0, 0.08, 0]} rotation={[0.2, 0.4, 0.1]}>
          <coneGeometry args={[0.045, 0.09, 5]} />
          <meshStandardMaterial color="#65b84c" roughness={0.35} />
        </mesh>
        <mesh position={[0.02, 0.07, -0.01]} rotation={[-0.2, -0.5, -0.2]}>
          <coneGeometry args={[0.035, 0.07, 5]} />
          <meshStandardMaterial color="#7ecc60" roughness={0.35} />
        </mesh>
      </group>

      {/* ================= LEFT & RIGHT WALLS & CEILING (Warm Sandstone Architecture) ================= */}
      {/* Left Wall */}
      <mesh position={[-3.0, 1.4, 0.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[5.5, 2.8]} />
        <meshStandardMaterial map={stoneTexture} roughness={0.75} color="#d4c3af" />
      </mesh>
      {/* Left Wall Baseboard */}
      <mesh position={[-2.98, 0.05, 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[5.5, 0.1, 0.04]} />
        <meshStandardMaterial map={woodTexture} roughness={0.45} color="#6e3f22" />
      </mesh>

      {/* Right Wall */}
      <mesh position={[3.0, 1.4, 0.5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[5.5, 2.8]} />
        <meshStandardMaterial map={stoneTexture} roughness={0.75} color="#d4c3af" />
      </mesh>

      {/* Ceiling - Warm Cedar Beam Structure */}
      <mesh position={[0, 2.8, 0.5]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6.5, 5.5]} />
        <meshStandardMaterial map={stoneTexture} roughness={0.85} color="#5e4936" />
      </mesh>

      {/* Overhead Timber Crossbeams for Architectural Depth & Shadow Separation */}
      {[-1.1, 0.45, 2.0].map((bz, i) => (
        <mesh key={i} position={[0, 2.74, bz]} castShadow receiveShadow>
          <boxGeometry args={[6.1, 0.14, 0.2]} />
          <meshStandardMaterial map={woodTexture} roughness={0.6} color="#3b2b1e" />
        </mesh>
      ))}

      {/* ================= ENVIRONMENTAL STORYTELLING: LEFT WALL ================= */}
      {/* 1. Mara's Blue Winter Coat on Coat Rack */}
      {/* Reference from letter: "Mother put my blue coat by the door..." */}
      <group position={[-2.94, 1.5, 1.8]}>
        {/* Wooden Wall Coat Peg Backing Strip */}
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.14, 0.65, 0.03]} />
          <meshStandardMaterial map={woodTexture} roughness={0.5} color="#693c1d" />
        </mesh>
        {/* Three Brass Coat Hooks (Center holds Mara's coat, two empty for Elena & Tomas) */}
        {[-0.2, 0, 0.2].map((hz, i) => (
          <mesh key={i} position={[0.04, 0.12, hz]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.01, 0.01, 0.08, 8]} />
            <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.92} />
          </mesh>
        ))}
        {/* Mara's Blue Coat - Rich Prussian Teal/Navy with Dimensional Folds */}
        <group position={[0.08, -0.15, 0]} rotation={[0, 0.1, 0.05]}>
          {/* Coat Collar & Shoulders */}
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.11, 0.16, 0.38]} />
            <meshStandardMaterial color="#24587d" roughness={0.65} />
          </mesh>
          {/* Coat Torso Body */}
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.13, 0.54, 0.4]} />
            <meshStandardMaterial color="#1c486a" roughness={0.7} />
          </mesh>
          {/* Coat Sleeves Hanging Folds */}
          <mesh position={[0, 0.05, -0.18]} rotation={[0, 0, 0.05]}>
            <boxGeometry args={[0.09, 0.42, 0.09]} />
            <meshStandardMaterial color="#1a4160" roughness={0.72} />
          </mesh>
          <mesh position={[0, 0.05, 0.18]} rotation={[0, 0, -0.05]}>
            <boxGeometry args={[0.09, 0.42, 0.09]} />
            <meshStandardMaterial color="#1a4160" roughness={0.72} />
          </mesh>
          {/* Polished Brass Buttons Catching Wall Wash */}
          {[-0.08, 0.04, 0.16].map((by, i) => (
            <mesh key={i} position={[0.07, by, 0]}>
              <sphereGeometry args={[0.009, 10, 10]} />
              <meshStandardMaterial color="#ffd056" roughness={0.15} metalness={0.96} />
            </mesh>
          ))}
        </group>
      </group>

      {/* 2. Left Wall Bookshelf / Archival Shelving Unit (Warm Golden Oak) */}
      <group position={[-2.85, 1.25, -0.4]}>
        {/* Shelving Frame */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.26, 1.8, 0.95]} />
          <meshStandardMaterial map={woodTexture} roughness={0.55} color="#5e391e" />
        </mesh>
        {/* Shelf Planks */}
        {[-0.6, -0.15, 0.3, 0.75].map((sy, i) => (
          <mesh key={i} position={[0.01, sy, 0]}>
            <boxGeometry args={[0.27, 0.03, 0.93]} />
            <meshStandardMaterial map={woodTexture} roughness={0.5} color="#734726" />
          </mesh>
        ))}

        {/* Books on Tier 1 (Vibrant Botanical & Geological Folios with Gold Foil Accents) */}
        <group position={[0.02, 0.42, -0.2]}>
          {[
            { w: 0.042, h: 0.22, c: '#b93828', t: 0.05 }, // Crimson
            { w: 0.052, h: 0.25, c: '#2e6945', t: -0.04 }, // Forest green
            { w: 0.034, h: 0.20, c: '#276082', t: 0.08 }, // Cyan navy
            { w: 0.062, h: 0.24, c: '#d99436', t: 0.0 },  // Golden amber
            { w: 0.045, h: 0.21, c: '#bf5832', t: -0.06 }, // Terracotta
          ].map((bk, i) => (
            <group key={i} position={[0, 0, i * 0.058]} rotation={[bk.t, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.18, bk.h, bk.w]} />
                <meshStandardMaterial color={bk.c} roughness={0.55} />
              </mesh>
              {/* Gold foil spine band */}
              <mesh position={[0.091, 0, 0]}>
                <boxGeometry args={[0.002, 0.02, bk.w * 0.9]} />
                <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.9} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Tier 2: Rolled Transit Blueprints & Brass Navigational Instrument */}
        <group position={[0.02, -0.06, 0.15]}>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.035, 0.035, 0.22, 12]} />
            <meshStandardMaterial color="#d4e4ea" roughness={0.7} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.06, -0.1]}>
            <cylinderGeometry args={[0.028, 0.028, 0.2, 12]} />
            <meshStandardMaterial color="#ede3d1" roughness={0.7} />
          </mesh>
          {/* Brass Astrolabe / Navigational Compass Stand */}
          <group position={[0, 0.04, 0.14]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.045, 0.02, 16]} />
              <meshStandardMaterial color="#4d2f19" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.06, 0]}>
              <torusGeometry args={[0.04, 0.004, 8, 24]} />
              <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.94} />
            </mesh>
          </group>
        </group>

        {/* Tier 3: Geological Amber Mineral Specimen Jar */}
        <group position={[0.02, -0.48, -0.1]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.15, 16]} />
            <meshPhysicalMaterial
              transparent
              opacity={0.7}
              roughness={0.1}
              transmission={0.88}
              color="#e2f5fa"
            />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <dodecahedronGeometry args={[0.024]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.2} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.03, 12]} />
            <meshStandardMaterial color="#6e4222" roughness={0.7} />
          </mesh>
        </group>
      </group>

      {/* 3. Wall Pinned Blueprint (Transit Gate 17-B) */}
      <mesh position={[-1.6, 1.85, -1.78]} rotation={[0, 0, 0.03]}>
        <planeGeometry args={[0.74, 0.5]} />
        <meshStandardMaterial map={blueprintTexture} roughness={0.68} />
      </mesh>
      {/* Corner pushpins */}
      {[
        [-0.35, 0.23],
        [0.35, 0.23],
        [-0.35, -0.23],
        [0.35, -0.23],
      ].map(([px, py], i) => (
        <mesh key={i} position={[-1.6 + px, 1.85 + py, -1.77]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.92} />
        </mesh>
      ))}

      {/* Elena's Pressed Botanical Field Card pinned beside blueprint */}
      <mesh position={[-1.12, 1.76, -1.78]} rotation={[0, 0, -0.06]}>
        <planeGeometry args={[0.22, 0.3]} />
        <meshStandardMaterial color="#f7f0df" roughness={0.85} />
      </mesh>
      <mesh position={[-1.12, 1.88, -1.77]}>
        <sphereGeometry args={[0.007, 8, 8]} />
        <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.92} />
      </mesh>

      {/* ================= PRESERVED WORK DESK (Rich Polished Honey Walnut) ================= */}
      {/* Main Desk Tabletop */}
      <mesh position={[0, 0.82, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 0.05, 0.98]} />
        <meshStandardMaterial
          map={woodTexture}
          roughness={0.32}
          metalness={0.08}
          color="#8c5225"
        />
      </mesh>

      {/* Desk Front Trim */}
      <mesh position={[0, 0.815, 0.54]}>
        <boxGeometry args={[2.22, 0.04, 0.02]} />
        <meshStandardMaterial color="#5c3417" roughness={0.5} />
      </mesh>

      {/* Desk Legs (Warm Dark Bronze) */}
      {[
        [-1.0, 0.4, -0.36],
        [1.0, 0.4, -0.36],
        [-1.0, 0.4, 0.46],
        [1.0, 0.4, 0.46],
      ].map((pos, idx) => (
        <mesh key={idx} position={pos as [number, number, number]} castShadow>
          <cylinderGeometry args={[0.026, 0.026, 0.8, 12]} />
          <meshStandardMaterial color="#4a3e35" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* Desk Drawer Unit (under right side of desk) */}
      <group position={[0.78, 0.52, 0.05]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.42, 0.54, 0.86]} />
          <meshStandardMaterial map={woodTexture} roughness={0.55} color="#6e3f1e" />
        </mesh>
        {/* Brass Drawer Pull Handles */}
        {[0.16, 0.0, -0.16].map((dy, i) => (
          <mesh key={i} position={[0, dy, 0.44]}>
            <boxGeometry args={[0.1, 0.02, 0.02]} />
            <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.92} />
          </mesh>
        ))}
      </group>

      {/* Desk Back Riser Shelf */}
      <mesh position={[-0.45, 0.92, -0.32]} castShadow receiveShadow>
        <boxGeometry args={[0.96, 0.15, 0.24]} />
        <meshStandardMaterial map={woodTexture} roughness={0.55} color="#6e3f1e" />
      </mesh>

      {/* ================= MARA'S DESK CHAIR (Warm Crafted Chestnut with Leather Cushion) ================= */}
      <group position={[-0.06, 0, 1.16]} rotation={[0, 0.28, 0]}>
        {/* Chair Seat Base */}
        <mesh position={[0, 0.47, 0]} castShadow>
          <boxGeometry args={[0.52, 0.04, 0.5]} />
          <meshStandardMaterial map={woodTexture} roughness={0.45} color="#784724" />
        </mesh>
        {/* Upholstered Terracotta Leather Seat Cushion */}
        <mesh position={[0, 0.505, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.48, 0.04, 0.46]} />
          <meshStandardMaterial roughness={0.65} color="#853620" />
        </mesh>
        {/* Brass Upholstery Tack Details */}
        {[-0.23, 0.23].map((tx, i) => (
          <mesh key={i} position={[tx, 0.495, 0.23]}>
            <sphereGeometry args={[0.005, 8, 8]} />
            <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.95} />
          </mesh>
        ))}
        {/* Chair Backrest Crest Rail */}
        <mesh position={[0, 0.91, 0.22]}>
          <boxGeometry args={[0.48, 0.12, 0.04]} />
          <meshStandardMaterial map={woodTexture} roughness={0.45} color="#784724" />
        </mesh>
        {/* Lived-in Personal Touch: Mara's Woolen Throw Blanket Draped Over Chair */}
        <group position={[0.16, 0.72, 0.21]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.16, 0.36, 0.07]} />
            <meshStandardMaterial color="#26445c" roughness={0.88} />
          </mesh>
          {/* Blanket fringe detail */}
          <mesh position={[0, -0.19, 0]}>
            <boxGeometry args={[0.15, 0.025, 0.065]} />
            <meshStandardMaterial color="#3d6382" roughness={0.92} />
          </mesh>
        </group>
        {/* Turned Chair Back Slats */}
        {[-0.18, -0.06, 0.06, 0.18].map((sx, i) => (
          <mesh key={i} position={[sx, 0.68, 0.22]}>
            <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
            <meshStandardMaterial color="#5c3417" roughness={0.55} />
          </mesh>
        ))}
        {/* Chair Turned Legs */}
        {[
          [-0.21, 0.235, -0.2],
          [0.21, 0.235, -0.2],
          [-0.21, 0.235, 0.2],
          [0.21, 0.235, 0.2],
        ].map((cpos, i) => (
          <mesh key={i} position={cpos as [number, number, number]} castShadow>
            <cylinderGeometry args={[0.018, 0.014, 0.47, 8]} />
            <meshStandardMaterial color="#5c3417" roughness={0.55} />
          </mesh>
        ))}
        {/* Chair Leg Stretchers */}
        <mesh position={[0, 0.16, -0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.42, 8]} />
          <meshStandardMaterial color="#5c3417" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.16, 0.2]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.42, 8]} />
          <meshStandardMaterial color="#5c3417" roughness={0.6} />
        </mesh>
      </group>

      {/* ================= ARCHIVAL STORYTELLING PROPS ON DESK ================= */}
      {/* 1. Desk Reading Lamp (Warm Polished Brass) */}
      <group position={[-0.88, 0.85, -0.25]}>
        {/* Heavy Brass Base */}
        <mesh position={[0, 0.015, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.085, 0.03, 16]} />
          <meshStandardMaterial color="#7d5926" roughness={0.25} metalness={0.88} />
        </mesh>
        {/* Articulated Brass Arm */}
        <mesh position={[0.02, 0.2, 0.04]} rotation={[0.2, 0, -0.15]}>
          <cylinderGeometry args={[0.009, 0.009, 0.4, 8]} />
          <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.92} />
        </mesh>
        {/* Lamp Shade (Warm aged golden brass cone) */}
        <mesh position={[0.1, 0.38, 0.12]} rotation={[0.55, 0, -0.4]}>
          <coneGeometry args={[0.098, 0.15, 16, 1, true]} />
          <meshStandardMaterial color="#9c6f28" roughness={0.25} metalness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* Glowing bulb interior */}
        <mesh position={[0.1, 0.36, 0.12]}>
          <sphereGeometry args={[0.035, 12, 12]} />
          <meshBasicMaterial color="#fff8db" />
        </mesh>
      </group>

      {/* 2. Stack of Archival Dossiers (Left side of desk) */}
      <group position={[-0.72, 0.85, 0.28]}>
        <mesh position={[0, 0.025, 0]} rotation={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.24, 0.05, 0.3]} />
          <meshStandardMaterial color="#705238" roughness={0.75} />
        </mesh>
        <mesh position={[0.01, 0.065, -0.01]} rotation={[0, -0.08, 0]} castShadow>
          <boxGeometry args={[0.22, 0.035, 0.28]} />
          <meshStandardMaterial color="#8c6847" roughness={0.7} />
        </mesh>
      </group>

      {/* 3. Ceramic Mug with Spoon (Mara's tea on desk) */}
      <group position={[-0.45, 0.85, 0.32]}>
        <mesh position={[0, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.038, 0.032, 0.1, 16]} />
          <meshStandardMaterial color="#c4ad93" roughness={0.35} />
        </mesh>
        <mesh position={[0.01, 0.08, 0.01]} rotation={[0.3, 0, 0.2]}>
          <cylinderGeometry args={[0.003, 0.003, 0.11, 6]} />
          <meshStandardMaterial color="#e0d9cf" roughness={0.15} metalness={0.9} />
        </mesh>
      </group>

      {/* 4. Elena's Specimen Seed Jar on shelf */}
      <group position={[-0.32, 0.87, -0.3]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <cylinderGeometry args={[0.036, 0.036, 0.14, 16]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.75}
            roughness={0.1}
            transmission={0.88}
            color="#bfe89e"
          />
        </mesh>
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.03, 12]} />
          <meshStandardMaterial color="#945f32" roughness={0.7} />
        </mesh>
      </group>

      {/* 5. Brass Stylus / Fountain Pen resting beside letter */}
      <mesh position={[0.08, 0.855, 0.14]} rotation={[0, 0.45, Math.PI / 2]}>
        <cylinderGeometry args={[0.004, 0.004, 0.16, 8]} />
        <meshStandardMaterial color="#ffd056" roughness={0.2} metalness={0.95} />
      </mesh>

      {/* Overhead Conduits & Ventilation Pipes (Ceiling) */}
      <mesh position={[-2.95, 2.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 5.2, 12]} />
        <meshStandardMaterial color="#505e6b" roughness={0.35} metalness={0.75} />
      </mesh>
      <mesh position={[0, 2.7, -1.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.045, 0.045, 6.2, 12]} />
        <meshStandardMaterial color="#4a5763" roughness={0.35} metalness={0.75} />
      </mesh>
    </group>
  )
}
