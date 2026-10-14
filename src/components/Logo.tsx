import { getLogo, logoSvg } from '#/content/logos'

function lum(hex: string) {
  const n = parseInt(hex, 16)
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
}

/** Brand logo as inline SVG. Very dark brand colours switch to ink so they read on steel. */
export function Logo({ icon, size = 22, mono = false }: { icon: string; size?: number; mono?: boolean }) {
  const logo = getLogo(icon)
  const color = mono ? '#ECEAE4' : lum(logo.hex) < 0.22 ? '#ECEAE4' : undefined
  return (
    <span
      aria-hidden="true"
      className="inline-block shrink-0 [&>svg]:h-full [&>svg]:w-full"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: logoSvg(icon, color) }}
    />
  )
}
