// Generated from simple-icons by hand-run script; edit the list in site.ts and regenerate.
import {
  siPython,
  siTypescript,
  siJavascript,
  siOpenjdk,
  siGo,
  siPhp,
  siCplusplus,
  siC,
  siNodedotjs,
  siNestjs,
  siExpress,
  siFastify,
  siSpringboot,
  siSpringsecurity,
  siFastapi,
  siDjango,
  siLaravel,
  siGin,
  siGraphql,
  siSocketdotio,
  siPrisma,
  siPostgresql,
  siMysql,
  siMongodb,
  siRedis,
  siPolars,
  siApacheparquet,
  siApachekafka,
  siRabbitmq,
  siJson,
  siHuggingface,
  siLangchain,
  siPytorch,
  siMilvus,
  siOnnx,
  siDocker,
  siKubernetes,
  siK3s,
  siDigitalocean,
  siCloudflareworkers,
  siTerraform,
  siAnsible,
  siArgo,
  siIstio,
  siGithubactions,
  siGit,
  siUbuntu,
  siReact,
  siNextdotjs,
  siExpo,
  siVuedotjs,
  siTailwindcss,
  siUnity,
  siEthereum,
} from 'simple-icons'
import awsSvg from './logos/aws.svg?raw'

export type Logo = { title: string; hex: string; path?: string; svg?: string; mono?: string }

const icons: Record<string, Logo> = {
  "python": siPython,
  "typescript": siTypescript,
  "javascript": siJavascript,
  "openjdk": siOpenjdk,
  "go": siGo,
  "php": siPhp,
  "cplusplus": siCplusplus,
  "c": siC,
  "nodedotjs": siNodedotjs,
  "nestjs": siNestjs,
  "express": siExpress,
  "fastify": siFastify,
  "springboot": siSpringboot,
  "springsecurity": siSpringsecurity,
  "fastapi": siFastapi,
  "django": siDjango,
  "laravel": siLaravel,
  "gin": siGin,
  "graphql": siGraphql,
  "socketdotio": siSocketdotio,
  "prisma": siPrisma,
  "postgresql": siPostgresql,
  "mysql": siMysql,
  "mongodb": siMongodb,
  "redis": siRedis,
  "polars": siPolars,
  "apacheparquet": siApacheparquet,
  "apachekafka": siApachekafka,
  "rabbitmq": siRabbitmq,
  "json": siJson,
  "huggingface": siHuggingface,
  "langchain": siLangchain,
  "pytorch": siPytorch,
  "milvus": siMilvus,
  "onnx": siOnnx,
  "docker": siDocker,
  "kubernetes": siKubernetes,
  "k3s": siK3s,
  "digitalocean": siDigitalocean,
  "cloudflareworkers": siCloudflareworkers,
  "terraform": siTerraform,
  "ansible": siAnsible,
  "argo": siArgo,
  "istio": siIstio,
  "githubactions": siGithubactions,
  "git": siGit,
  "ubuntu": siUbuntu,
  "react": siReact,
  "nextdotjs": siNextdotjs,
  "expo": siExpo,
  "vuedotjs": siVuedotjs,
  "tailwindcss": siTailwindcss,
  "unity": siUnity,
  "ethereum": siEthereum,
}

// Tools without a simple-icons entry: AWS uses the devicon wordmark, the rest get an honest
// monogram plate in the same style instead of an invented logo.
const custom: Record<string, Logo> = {
  'custom:aws': { title: 'AWS', hex: 'FF9900', svg: awsSvg },
  'custom:sql': { title: 'SQL', hex: 'ECEAE4', mono: 'SQL' },
  'custom:postgis': { title: 'PostGIS', hex: '4169E1', mono: 'GIS' },
  'custom:unsloth': { title: 'Unsloth', hex: '13B57B', mono: 'Us' },
  'custom:llamacpp': { title: 'llama.cpp', hex: 'ECEAE4', mono: 'll' },
  'custom:pinecone': { title: 'Pinecone', hex: 'ECEAE4', mono: 'Pc' },
  'custom:hyperledger': { title: 'Hyperledger Fabric', hex: '2F3134', mono: 'HF' },
}

export function getLogo(key: string): Logo {
  return custom[key] ?? icons[key] ?? { title: key, hex: 'ECEAE4', mono: key.slice(0, 2) }
}

/** Full SVG markup for a logo, filled with `color` (defaults to brand colour). */
export function logoSvg(key: string, color?: string): string {
  const logo = getLogo(key)
  const fill = color ?? `#${logo.hex}`
  if (logo.path) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${fill}" d="${logo.path}"/></svg>`
  }
  if (logo.svg) return color ? logo.svg.replace(/fill="[^"]*"/g, `fill="${fill}"`) : logo.svg
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text x="12" y="16.5" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="${(logo.mono ?? '').length > 2 ? 8 : 11}" font-weight="500" fill="${fill}">${logo.mono}</text></svg>`
}
