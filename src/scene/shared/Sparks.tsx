import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Welding sparks: CPU particles drawn as motion streaks (line segments), additive, so bloom
 * turns them into light. Floors are simple planes so sparks bounce and skid.
 */
type Floor = { y: number; minX: number; maxX: number; minZ: number; maxZ: number }

const MAX = 1800
const p = new Float32Array(MAX * 3)
const v = new Float32Array(MAX * 3)
const life = new Float32Array(MAX)
const maxLife = new Float32Array(MAX)
let cursor = 0
const floors: Floor[] = [{ y: 0, minX: -1e9, maxX: 1e9, minZ: -1e9, maxZ: 1e9 }]

export const sparks = {
  budget: 1,
  setFloors(list: Floor[]) {
    floors.length = 0
    floors.push({ y: 0, minX: -1e9, maxX: 1e9, minZ: -1e9, maxZ: 1e9 }, ...list)
  },
  /** emit n sparks at pos, thrown roughly along dir */
  emit(pos: THREE.Vector3, n: number, dir?: THREE.Vector3, speed = 3) {
    const count = Math.floor(n * sparks.budget + Math.random())
    for (let k = 0; k < count; k++) {
      const i = cursor
      cursor = (cursor + 1) % MAX
      p[i * 3] = pos.x
      p[i * 3 + 1] = pos.y
      p[i * 3 + 2] = pos.z
      let x = Math.random() * 2 - 1
      let y = Math.random() * 1.4 - 0.2
      let z = Math.random() * 2 - 1
      if (dir) {
        x += dir.x * 1.2
        y += dir.y * 1.2
        z += dir.z * 1.2
      }
      const len = Math.hypot(x, y, z) || 1
      const s = speed * (0.35 + Math.random() * 0.9)
      v[i * 3] = (x / len) * s
      v[i * 3 + 1] = (y / len) * s
      v[i * 3 + 2] = (z / len) * s
      maxLife[i] = life[i] = 0.5 + Math.random() * 1.1
    }
  },
}

const hot = new THREE.Color('#fff4dc')
const mid = new THREE.Color('#ff8a24')
const cold = new THREE.Color('#5a1200')
const tmp = new THREE.Color()

function floorAt(x: number, z: number, y: number) {
  let best = 0
  for (const f of floors) {
    if (x >= f.minX && x <= f.maxX && z >= f.minZ && z <= f.maxZ && f.y <= y + 0.02 && f.y > best) best = f.y
  }
  return best
}

export function Sparks() {
  const { geom, pos, col } = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const pos = new Float32Array(MAX * 6)
    const col = new Float32Array(MAX * 6)
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage))
    return { geom, pos, col }
  }, [])

  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    // live sparks are packed to the front of the buffer and only those are drawn
    let n = 0
    for (let i = 0; i < MAX; i++) {
      if (life[i] <= 0) continue
      life[i] -= dt
      const j = i * 3
      v[j + 1] -= 9.8 * dt
      v[j] *= 0.992
      v[j + 2] *= 0.992
      p[j] += v[j] * dt
      p[j + 1] += v[j + 1] * dt
      p[j + 2] += v[j + 2] * dt
      const fy = floorAt(p[j], p[j + 2], p[j + 1] - v[j + 1] * dt)
      if (p[j + 1] < fy && v[j + 1] < 0) {
        p[j + 1] = fy
        v[j + 1] *= -0.32
        v[j] *= 0.55
        v[j + 2] *= 0.55
      }
      const t = Math.max(0, life[i] / maxLife[i])
      if (t > 0.6) tmp.copy(mid).lerp(hot, (t - 0.6) / 0.4)
      else tmp.copy(cold).lerp(mid, t / 0.6)
      const k = 0.028
      const o = n * 6
      pos[o] = p[j]
      pos[o + 1] = p[j + 1]
      pos[o + 2] = p[j + 2]
      pos[o + 3] = p[j] - v[j] * k
      pos[o + 4] = p[j + 1] - v[j + 1] * k
      pos[o + 5] = p[j + 2] - v[j + 2] * k
      const br = 1.6 * t
      col[o] = tmp.r * br * 2
      col[o + 1] = tmp.g * br * 2
      col[o + 2] = tmp.b * br * 2
      col[o + 3] = tmp.r * br * 0.4
      col[o + 4] = tmp.g * br * 0.4
      col[o + 5] = tmp.b * br * 0.4
      n++
    }
    geom.setDrawRange(0, n * 2)
    const pa = geom.attributes.position as THREE.BufferAttribute
    const ca = geom.attributes.color as THREE.BufferAttribute
    pa.clearUpdateRanges()
    ca.clearUpdateRanges()
    pa.addUpdateRange(0, n * 6)
    ca.addUpdateRange(0, n * 6)
    pa.needsUpdate = true
    ca.needsUpdate = true
  })

  return <lineSegments geometry={geom} material={mat} frustumCulled={false} />
}
