// Turns assets-src/portrait.jpg into the textures the 3D figure uses:
//   public/portrait/color.webp  RGBA, background removed
//   public/portrait/depth.webp  grayscale depth (white = near), masked
// Run once: node scripts/prepare-portrait.mjs
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const SRC = 'assets-src/portrait.jpg'
const OUT = 'public/portrait'
const W = 1024

await mkdir(OUT, { recursive: true })

const base = sharp(SRC).resize({ width: W })
const { data: rgb, info } = await base
  .clone()
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })
const { width, height } = info
console.log('size', width, height)

const tf = await import('@huggingface/transformers')
tf.env.allowLocalModels = false

const image = new tf.RawImage(new Uint8ClampedArray(rgb), width, height, 3)

let alpha
try {
  const segmenter = await tf.pipeline('background-removal', 'onnx-community/BiRefNet_lite-ONNX', { dtype: 'fp32' })
  const res = await segmenter(image)
  const cut = Array.isArray(res) ? res[0] : res
  // cut is RGBA RawImage
  const rgba = cut.data
  alpha = new Uint8Array(width * height)
  for (let i = 0; i < width * height; i++) alpha[i] = rgba[i * 4 + 3]
  console.log('mask: BiRefNet')
} catch (err) {
  console.warn('segmentation failed, falling back to threshold mask:', err.message)
  alpha = thresholdMask(rgb, width, height)
}

let depth
try {
  const estimator = await tf.pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp32' })
  const out = await estimator(image)
  const d = await out.depth.resize(width, height)
  depth = new Uint8Array(d.data.length / d.channels)
  for (let i = 0; i < depth.length; i++) depth[i] = d.data[i * d.channels]
  console.log('depth: depth-anything-v2')
} catch (err) {
  console.warn('depth model failed, using distance fallback:', err.message)
  depth = distanceDepth(alpha, width, height)
}

// Normalise depth inside the mask so the figure uses the full range.
let lo = 255
let hi = 0
for (let i = 0; i < depth.length; i++) {
  if (alpha[i] > 200) {
    lo = Math.min(lo, depth[i])
    hi = Math.max(hi, depth[i])
  }
}
const span = Math.max(1, hi - lo)
const depthOut = Buffer.alloc(width * height)
for (let i = 0; i < depth.length; i++) {
  const n = Math.min(1, Math.max(0, (depth[i] - lo) / span))
  depthOut[i] = alpha[i] > 127 ? Math.round(n * 255) : 0
}
// Grow the depth a few pixels past the silhouette so the relief has no steep "skirt" at its
// edge: edge triangles stay flat and the alpha cut-out stays clean.
let known = Uint8Array.from(alpha, (a) => (a > 127 ? 1 : 0))
for (let pass = 0; pass < 14; pass++) {
  const next = known.slice()
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      if (known[i]) continue
      let sum = 0
      let n = 0
      for (const j of [i - 1, i + 1, i - width, i + width]) {
        if (known[j]) {
          sum += depthOut[j]
          n++
        }
      }
      if (n) {
        depthOut[i] = Math.round(sum / n)
        next[i] = 1
      }
    }
  }
  known = next
}

const rgba = Buffer.alloc(width * height * 4)
for (let i = 0; i < width * height; i++) {
  rgba[i * 4] = rgb[i * 3]
  rgba[i * 4 + 1] = rgb[i * 3 + 1]
  rgba[i * 4 + 2] = rgb[i * 3 + 2]
  rgba[i * 4 + 3] = alpha[i]
}

await sharp(rgba, { raw: { width, height, channels: 4 } })
  .webp({ quality: 86, alphaQuality: 90 })
  .toFile(`${OUT}/color.webp`)
await sharp(depthOut, { raw: { width, height, channels: 1 } })
  .blur(1.2)
  .webp({ quality: 90 })
  .toFile(`${OUT}/depth.webp`)
// Small cut-out used as the static poster / reduced motion image.
await sharp(rgba, { raw: { width, height, channels: 4 } })
  .resize({ width: 720 })
  .webp({ quality: 80 })
  .toFile(`${OUT}/poster.webp`)
console.log('done')

function thresholdMask(px, w, h) {
  // Background is a soft light grey. Flood from the borders over pixels close to it.
  const out = new Uint8Array(w * h).fill(255)
  const isBg = (i) => {
    const r = px[i * 3]
    const g = px[i * 3 + 1]
    const b = px[i * 3 + 2]
    return r > 175 && g > 175 && b > 175 && Math.abs(r - b) < 30
  }
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const i = stack.pop()
    if (out[i] === 0 || !isBg(i)) continue
    out[i] = 0
    const x = i % w
    const y = (i / w) | 0
    if (x > 0) stack.push(i - 1)
    if (x < w - 1) stack.push(i + 1)
    if (y > 0) stack.push(i - w)
    if (y < h - 1) stack.push(i + w)
  }
  return out
}

function distanceDepth(mask, w, h) {
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x
      if (!mask[i]) continue
      let d = 0
      while (d < 120 && x - d > 0 && x + d < w && mask[i - d] && mask[i + d]) d++
      out[i] = Math.min(255, d * 2)
    }
  }
  return out
}
