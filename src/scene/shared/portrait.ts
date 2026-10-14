import * as THREE from 'three'

export const PORTRAIT = {
  color: '/portrait/color.webp',
  depth: '/portrait/depth.webp',
  /** plane size in world units (image is 1024 x 948) */
  width: 2.4,
  height: 2.4 * (948 / 1024),
  depthScale: 0.46,
}

export type PortraitData = {
  color: THREE.Texture
  depth: THREE.Texture
  /** sample alpha 0..1 at uv */
  alpha: (u: number, v: number) => number
  /** sample depth 0..1 at uv */
  depthAt: (u: number, v: number) => number
  /** bilinear depth 0..1 from the 512 px depth map (used to bake the relief geometry) */
  depthFine: (u: number, v: number) => number
  /** local position on the relief surface for uv */
  surface: (u: number, v: number, out?: THREE.Vector3) => THREE.Vector3
}

let cache: Promise<PortraitData> | null = null

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function readPixels(img: HTMLImageElement, w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h).data
}

export function loadPortrait(): Promise<PortraitData> {
  if (cache) return cache
  cache = Promise.all([loadImage(PORTRAIT.color), loadImage(PORTRAIT.depth)]).then(([ci, di]) => {
    const color = new THREE.Texture(ci)
    color.colorSpace = THREE.SRGBColorSpace
    color.anisotropy = 4
    color.needsUpdate = true
    const depth = new THREE.Texture(di)
    depth.needsUpdate = true
    const SW = 256
    const SH = Math.round((256 * 948) / 1024)
    const cp = readPixels(ci, SW, SH)
    const dp = readPixels(di, SW, SH)
    const idx = (u: number, v: number) => {
      const x = Math.min(SW - 1, Math.max(0, Math.round(u * (SW - 1))))
      const y = Math.min(SH - 1, Math.max(0, Math.round((1 - v) * (SH - 1))))
      return (y * SW + x) * 4
    }
    const alpha = (u: number, v: number) => cp[idx(u, v) + 3] / 255
    const depthAt = (u: number, v: number) => dp[idx(u, v)] / 255
    const FW = 512
    const FH = Math.round((512 * 948) / 1024)
    const fp = readPixels(di, FW, FH)
    const depthFine = (u: number, v: number) => {
      const x = Math.min(FW - 1.001, Math.max(0, u * (FW - 1)))
      const y = Math.min(FH - 1.001, Math.max(0, (1 - v) * (FH - 1)))
      const x0 = Math.floor(x)
      const y0 = Math.floor(y)
      const tx = x - x0
      const ty = y - y0
      const at = (xx: number, yy: number) => fp[(yy * FW + xx) * 4] / 255
      const a = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx
      const b = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx
      return a * (1 - ty) + b * ty
    }
    const surface = (u: number, v: number, out = new THREE.Vector3()) =>
      out.set((u - 0.5) * PORTRAIT.width, v * PORTRAIT.height, depthAt(u, v) * PORTRAIT.depthScale)
    return { color, depth, alpha, depthAt, depthFine, surface }
  })
  return cache
}
