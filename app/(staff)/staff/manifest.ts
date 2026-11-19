import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/staff',
    name: 'تطبيق العنود للموظفين',
    short_name: 'العنود',
    description: 'تطبيق العمل الداخلي لمتجر العنود',
    start_url: '/staff',
    scope: '/staff',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'ar',
    dir: 'rtl',
    background_color: '#f6f3ee',
    theme_color: '#35291d',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  }
}
