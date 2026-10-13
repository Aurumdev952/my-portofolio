import { create } from 'zustand'

/**
 * The driver. One mutable object written by the scroll feed and read by the 3D scene every
 * frame (no React renders). `k` is a continuous keyframe index along the home story.
 */
export const story = {
  /** continuous keyframe index on the home page */
  k: 0,
  /** smoothed k the camera actually uses */
  kSmooth: 0,
  /** gallery: continuous active index */
  g: 0,
  gSmooth: 0,
  /** pointer in -1..1 */
  px: 0,
  py: 0,
  /** stack section progress 0..1 */
  stack: 0,
  /** gate section progress 0..1 */
  gate: 0,
  /** scroll velocity */
  vel: 0,
  /** fly into the active gallery frame, 0..1 */
  fly: 0,
}

export type Quality = 'high' | 'low'
export type SceneName = 'home' | 'gallery' | 'ambient'

type UI = {
  loaded: boolean
  glReady: boolean
  quality: Quality
  scene: SceneName
  label: string
  galleryIndex: number
  galleryFilter: string
  setLoaded: (v: boolean) => void
  setGlReady: (v: boolean) => void
  setQuality: (q: Quality) => void
  setScene: (s: SceneName) => void
  setLabel: (l: string) => void
  setGalleryIndex: (i: number) => void
  setGalleryFilter: (f: string) => void
}

export const useUI = create<UI>((set) => ({
  loaded: false,
  glReady: false,
  quality: 'high',
  scene: 'home',
  label: '',
  galleryIndex: 0,
  galleryFilter: 'All',
  setLoaded: (loaded) => set({ loaded }),
  setGlReady: (glReady) => set({ glReady }),
  setQuality: (quality) => set({ quality }),
  setScene: (scene) => set({ scene }),
  setLabel: (label) => set((s) => (s.label === label ? s : { label })),
  setGalleryIndex: (galleryIndex) => set((s) => (s.galleryIndex === galleryIndex ? s : { galleryIndex })),
  setGalleryFilter: (galleryFilter) => set({ galleryFilter }),
}))
