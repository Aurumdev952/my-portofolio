import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { stack } from '#/content/site'
import { getLogo, logoSvg } from '#/content/logos'
import { story } from '#/motion/story'
import { sparks } from '../shared/Sparks'

export const CONVEYOR = { z: -8, y: 1.72, spacing: 1.3, size: 1.04 }
export const stackItems = stack.flatMap((g) => g.items.map((it) => ({ ...it, group: g.label })))

const CELL = 256
const COLS = 8

function luminance(hex: string) {
  const n = parseInt(hex, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
}

async function buildAtlas(): Promise<THREE.CanvasTexture> {
  const rows = Math.ceil(stackItems.length / COLS)
  const c = document.createElement('canvas')
  c.width = CELL * COLS
  c.height = CELL * rows
  const g = c.getContext('2d')!
  await document.fonts.ready
  await Promise.all(
    stackItems.map(
      (item, i) =>
        new Promise<void>((resolve) => {
          const x = (i % COLS) * CELL
          const y = Math.floor(i / COLS) * CELL
          // brushed steel plate
          const grd = g.createLinearGradient(x, y, x + CELL, y + CELL)
          grd.addColorStop(0, '#2b2d33')
          grd.addColorStop(0.5, '#1d1f23')
          grd.addColorStop(1, '#25272c')
          g.fillStyle = grd
          g.fillRect(x, y, CELL, CELL)
          g.globalAlpha = 0.06
          for (let k = 0; k < 60; k++) {
            g.fillStyle = k % 2 ? '#ffffff' : '#000000'
            g.fillRect(x, y + Math.random() * CELL, CELL, 1)
          }
          g.globalAlpha = 1
          g.strokeStyle = 'rgba(236,234,228,0.18)'
          g.lineWidth = 3
          g.strokeRect(x + 6, y + 6, CELL - 12, CELL - 12)
          g.fillStyle = 'rgba(236,234,228,0.28)'
          for (const [rx, ry] of [
            [18, 18],
            [CELL - 18, 18],
            [18, CELL - 18],
            [CELL - 18, CELL - 18],
          ]) {
            g.beginPath()
            g.arc(x + rx, y + ry, 4, 0, Math.PI * 2)
            g.fill()
          }
          g.fillStyle = '#9a9da3'
          g.font = '500 15px "JetBrains Mono", monospace'
          g.textAlign = 'center'
          g.fillText(item.name.toUpperCase(), x + CELL / 2, y + CELL - 30)
          const logo = getLogo(item.icon)
          const color = luminance(logo.hex) < 0.22 ? '#ECEAE4' : undefined
          const svg = logoSvg(item.icon, color)
          const img = new Image()
          img.onload = () => {
            const s = 112
            g.drawImage(img, x + (CELL - s) / 2, y + 52, s, s)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
        }),
    ),
  )
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

export function Conveyor() {
  const [atlas, setAtlas] = useState<THREE.CanvasTexture | null>(null)
  const plates = useRef<(THREE.Group | null)[]>([])
  const mats = useRef<THREE.MeshStandardMaterial[]>([])
  const press = useRef<THREE.Group>(null)
  const offset = useRef(0)
  const heat = useRef(new Float32Array(stackItems.length))
  const lastCenter = useRef(-1)

  useEffect(() => {
    let alive = true
    buildAtlas().then((t) => alive && setAtlas(t))
    return () => {
      alive = false
    }
  }, [])

  const geoms = useMemo(() => {
    const rows = Math.ceil(stackItems.length / COLS)
    return stackItems.map((_, i) => {
      const geo = new THREE.PlaneGeometry(CONVEYOR.size, CONVEYOR.size)
      const uv = geo.attributes.uv as THREE.BufferAttribute
      const cx = i % COLS
      const cy = Math.floor(i / COLS)
      for (let k = 0; k < uv.count; k++) {
        const u = uv.getX(k)
        const v = uv.getY(k)
        uv.setXY(k, (cx + u) / COLS, 1 - (cy + 1 - v) / rows)
      }
      return geo
    })
  }, [])

  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    const t = state.clock.elapsedTime
    const N = stackItems.length
    const target = story.stack * (N - 1) * CONVEYOR.spacing
    const prev = offset.current
    offset.current += (target - offset.current) * (1 - Math.exp(-dt * 5))
    const speed = (offset.current - prev) / Math.max(dt, 1e-3)
    let nearest = Infinity
    let nearestI = -1
    for (let i = 0; i < N; i++) {
      const g = plates.current[i]
      if (!g) continue
      const x = i * CONVEYOR.spacing - offset.current
      g.visible = Math.abs(x) < 9
      if (!g.visible) continue
      g.position.x = x
      g.rotation.z = Math.sin(t * 1.3 + i) * 0.015 - THREE.MathUtils.clamp(speed * 0.02, -0.25, 0.25)
      if (Math.abs(x) < nearest) {
        nearest = Math.abs(x)
        nearestI = i
      }
      heat.current[i] = Math.max(0, heat.current[i] - dt * 0.6)
      const m = mats.current[i]
      if (m) m.emissiveIntensity = heat.current[i] * 1.6
    }
    // press stamps the plate that settles under it
    const settle = 1 - THREE.MathUtils.smoothstep(nearest, 0.02, 0.4)
    const idle = 0.5 + 0.5 * Math.sin(t * 2.2)
    const drop = settle * (0.75 + 0.25 * idle)
    if (press.current) press.current.position.y = CONVEYOR.y + 1.55 - drop * 0.42
    if (nearestI >= 0 && nearest < 0.06 && lastCenter.current !== nearestI) {
      lastCenter.current = nearestI
      heat.current[nearestI] = 1
      tmp.set(0, CONVEYOR.y + CONVEYOR.size / 2, CONVEYOR.z + 0.05)
      sparks.emit(tmp, 70, new THREE.Vector3(0, 0.4, 1), 3.4)
    }
    if (settle > 0.9 && Math.random() < dt * 3) {
      tmp.set((Math.random() - 0.5) * 0.4, CONVEYOR.y + CONVEYOR.size / 2, CONVEYOR.z + 0.06)
      sparks.emit(tmp, 6, new THREE.Vector3(0, 0.2, 1), 2)
    }
  })

  return (
    <group position={[0, 0, CONVEYOR.z]}>
      {/* overhead rail */}
      <mesh position={[0, CONVEYOR.y + 1.05, 0]}>
        <boxGeometry args={[40, 0.14, 0.22]} />
        <meshStandardMaterial color="#1a1c20" metalness={0.85} roughness={0.35} />
      </mesh>
      <mesh position={[0, CONVEYOR.y + 1.17, 0]}>
        <boxGeometry args={[40, 0.03, 0.08]} />
        <meshBasicMaterial color="#8a3a0c" toneMapped={false} />
      </mesh>
      {atlas &&
        stackItems.map((item, i) => (
          <group
            key={item.name + i}
            ref={(el) => {
              plates.current[i] = el
            }}
            position={[i * CONVEYOR.spacing, CONVEYOR.y, 0]}
          >
            <mesh geometry={geoms[i]}>
              <meshStandardMaterial
                ref={(m) => {
                  if (m) mats.current[i] = m
                }}
                map={atlas}
                metalness={0.55}
                roughness={0.42}
                emissive="#ff6a10"
                emissiveIntensity={0}
              />
            </mesh>
            <mesh position={[0, 0, -0.03]}>
              <boxGeometry args={[CONVEYOR.size + 0.04, CONVEYOR.size + 0.04, 0.04]} />
              <meshStandardMaterial color="#121316" metalness={0.8} roughness={0.4} />
            </mesh>
            <mesh position={[-0.3, CONVEYOR.size / 2 + 0.27, -0.02]}>
              <boxGeometry args={[0.02, 0.56, 0.02]} />
              <meshStandardMaterial color="#5c6068" metalness={1} roughness={0.3} />
            </mesh>
            <mesh position={[0.3, CONVEYOR.size / 2 + 0.27, -0.02]}>
              <boxGeometry args={[0.02, 0.56, 0.02]} />
              <meshStandardMaterial color="#5c6068" metalness={1} roughness={0.3} />
            </mesh>
          </group>
        ))}
      {/* stamping press */}
      <group ref={press} position={[0, CONVEYOR.y + 1.55, 0.42]}>
        <mesh>
          <boxGeometry args={[0.7, 0.32, 0.4]} />
          <meshStandardMaterial color="#b84a12" metalness={0.4} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 1.6, 16]} />
          <meshStandardMaterial color="#9aa0a8" metalness={1} roughness={0.18} />
        </mesh>
      </group>
      <pointLight position={[0, CONVEYOR.y + 0.6, 1.6]} intensity={10} distance={6} color="#ffd2a1" />
    </group>
  )
}
