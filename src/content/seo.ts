import { site } from './site'

type Share = {
  title: string
  description: string
  /** path on the site, '' for home */
  path?: string
  /** image path on the site, a 1200x630 JPEG */
  image?: string
  imageAlt?: string
  type?: 'website' | 'article' | 'profile'
}

export const HOME_CARD_ALT = `${site.name}, software engineer, as a silhouette being welded by robot arms in a dark hangar`

/** The tags every share preview reads (Open Graph for most apps, twitter:* for X and Slack). */
export function share({ title, description, path = '', image = '/og.jpg', imageAlt = HOME_CARD_ALT, type = 'website' }: Share) {
  const img = `${site.url}${image}`
  return [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: `${site.url}${path}` },
    { property: 'og:type', content: type },
    { property: 'og:image', content: img },
    { property: 'og:image:secure_url', content: img },
    { property: 'og:image:type', content: 'image/jpeg' },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: imageAlt },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: img },
    { name: 'twitter:image:alt', content: imageAlt },
  ]
}
