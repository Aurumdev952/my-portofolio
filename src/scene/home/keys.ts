import { chapters, featured } from '#/content/site'
import { STATION, stationX } from './Stations'

type V3 = [number, number, number]
export type Placement = { id: string; pos: V3; scale: number }
export type Key = {
  name: string
  cam: V3
  tgt: V3
  /** horizontal lens shift, fraction of the viewport width (+ moves the subject right) */
  shift: number
  fig: Placement
  forge: number
  /** control point for the camera path that arrives at this key */
  via?: V3
}

const PLATFORM: Placement = { id: 'platform', pos: [0, 0.55, 0], scale: 1 }
export const GATE_PLINTH = { x: 0, z: -26.4, h: 0.85 }
const GATE: Placement = { id: 'gate', pos: [GATE_PLINTH.x, GATE_PLINTH.h, GATE_PLINTH.z], scale: 0.72 }

const station = (i: number): Placement => ({
  id: `station-${i}`,
  pos: [stationX(i) + STATION.pedestal.x, STATION.pedestal.h, STATION.z],
  scale: STATION.pedestal.scale,
})

const chapterCams: { cam: V3; tgt: V3; shift: number }[] = [
  { cam: [2.3, 2.0, 6.0], tgt: [0, 1.7, 0], shift: 0.2 },
  { cam: [-2.4, 1.55, 5.7], tgt: [0, 1.75, 0], shift: -0.2 },
  { cam: [1.3, 2.9, 5.4], tgt: [0, 1.6, 0], shift: 0.2 },
  { cam: [-1.5, 1.8, 5.2], tgt: [0, 1.75, 0], shift: -0.2 },
  { cam: [0.6, 1.9, 4.9], tgt: [0, 1.8, 0], shift: 0.2 },
]

const pad = (n: number) => String(n).padStart(2, '0')

export const KEYS: Key[] = [
  {
    name: `${pad(1)} Hangar`,
    cam: [0.5, 1.75, 7.4],
    tgt: [0.2, 1.75, 0],
    shift: 0.14,
    fig: PLATFORM,
    forge: 0,
  },
  ...chapters.map((c, i) => ({
    name: `${pad(i + 2)} ${c.title} · ${c.year}`,
    ...chapterCams[i],
    fig: PLATFORM,
    forge: c.forge,
  })),
  {
    name: `${pad(chapters.length + 2)} Toolbox`,
    cam: [0, 1.82, -3.5],
    tgt: [0, 1.74, -8],
    shift: 0,
    fig: PLATFORM,
    forge: 1,
    via: [0, 5.2, 1.4],
  },
  ...featured.map((p, i) => ({
    name: `${pad(chapters.length + 3 + i)} ${p.title}`,
    cam: [stationX(i) + 0.55, 1.75, -10.6] as V3,
    tgt: [stationX(i) + 0.55, 1.5, -16] as V3,
    shift: 0.17,
    fig: station(i),
    forge: 1,
    via: i === 0 ? ([-7, 4.4, -6.2] as V3) : undefined,
  })),
  {
    name: `${pad(chapters.length + 3 + featured.length)} Contact`,
    cam: [0, 1.85, -19.6],
    tgt: [0, 1.85, -27],
    shift: 0.24,
    fig: GATE,
    forge: 1,
    via: [11, 3.8, -13.2],
  },
  {
    name: `${pad(chapters.length + 4 + featured.length)} The gate`,
    cam: [0, 1.8, -22.4],
    tgt: [0, 2.3, -30],
    shift: 0,
    fig: GATE,
    forge: 1,
  },
]

export const KEY_INDEX = {
  hero: 0,
  firstChapter: 1,
  stack: chapters.length + 1,
  firstStation: chapters.length + 2,
  contact: chapters.length + 2 + featured.length,
  gate: chapters.length + 3 + featured.length,
}
