import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans_Arabic } from 'next/font/google'
import './globals.css'
export const dynamic = 'force-dynamic'
// Keep server-side work close to the Neon database in Frankfurt.
export const preferredRegion = 'fra1'
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
})

const brandImage =
  'https://res.cloudinary.com/genxurzp/image/upload/v1794181046/alanoud/inventory/image_ee910985-ebde-4d84-b448-11a4b3d04e76.webp'

export const metadata: Metadata = {
  metadataBase: new URL('https://alanoudhebron.ps'),
  title: 'العنود للزي الشرعي | الخليل',
  description: 'متجر العنود للزي الشرعي والأثواب الفلسطينية – أناقتكِ من تراثنا وجمالكِ في تفاصيلنا',
  openGraph: {
    title: 'العنود للزي الشرعي | الخليل',
    description: 'تسوّقي الأثواب الفلسطينية والعبايات من متجر العنود',
    url: 'https://alanoudhebron.ps',
    siteName: 'العنود للزي الشرعي',
    locale: 'ar_PS',
    type: 'website',
    images: [{ url: brandImage, width: 1200, height: 630, alt: 'شعار متجر العنود للزي الشرعي' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'العنود للزي الشرعي | الخليل',
    description: 'تسوّقي الأثواب الفلسطينية والعبايات من متجر العنود',
    images: [brandImage],
  },
  icons: {
    icon: [{ url: brandImage, type: 'image/webp' }],
    shortcut: [brandImage],
    apple: [{ url: brandImage, type: 'image/webp' }],
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
  return (
    <html lang="ar" dir="rtl" className={arabic.variable}>
      <body className="min-h-dvh antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
