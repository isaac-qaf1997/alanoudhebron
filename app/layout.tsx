import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import { AppHeader } from '@/components/app-header'
import { getCouriers } from '@/lib/queries'
import './globals.css'

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
})

export const metadata: Metadata = {
  title: 'العنود للزي الشرعي | نظام المخزون والتوصيل',
  description: 'نظام إدارة الطلبات والمخزون والشحن والتوصيل لمتجر العنود للزي الشرعي',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#121110',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const couriers = await getCouriers()
  const activeCouriers = couriers.filter((c) => c.active).length

  return (
    <html lang="ar" dir="rtl" className={arabic.variable}>
      <body className="min-h-dvh antialiased">
        <AppHeader activeCouriers={activeCouriers} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</main>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
