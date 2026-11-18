import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/admin',
    name: 'العنود | إدارة المتجر',
    short_name: 'إدارة العنود',
    description: 'تطبيق إدارة متجر العنود للزي الشرعي',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/admin',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    background_color: '#f8f6f1',
    theme_color: '#17130f',
    icons: [
      { src: '/alanoud-app-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
    ],
    categories: ['business', 'productivity']
  }
}
