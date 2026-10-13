import * as THREE from 'three'
import type { Project } from '#/content/site'
import { artDataUri } from '#/art/systemArt'

const cache = new Map<string, Promise<THREE.Texture>>()

let uploader: ((t: THREE.Texture) => void) | null = null
/** Stage registers the renderer so textures go to the GPU on load, not on first draw. */
export function setTextureUploader(fn: (t: THREE.Texture) => void) {
  uploader = fn
}

export function loadTexture(src: string): Promise<THREE.Texture> {
  let p = cache.get(src)
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => {
        const t = new THREE.Texture(img)
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 8
        t.generateMipmaps = true
        t.minFilter = THREE.LinearMipmapLinearFilter
        t.needsUpdate = true
        uploader?.(t)
        resolve(t)
      }
      img.onerror = reject
      img.src = src
    })
    cache.set(src, p)
  }
  return p
}

/** 1x1 placeholder so materials keep the same shader program when the real map arrives. */
export const blankTexture = (() => {
  const t = new THREE.DataTexture(new Uint8Array([17, 19, 23, 255]), 1, 1)
  t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
})()

export const projectCover = (p: Project) => p.image?.src ?? artDataUri(p.art, p.title)
