import * as THREE from 'three'
import type { Project } from '#/content/site'
import { artDataUri } from '#/art/systemArt'

const cache = new Map<string, Promise<THREE.Texture>>()

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
        resolve(t)
      }
      img.onerror = reject
      img.src = src
    })
    cache.set(src, p)
  }
  return p
}

export const projectCover = (p: Project) => p.image?.src ?? artDataUri(p.art, p.title)
