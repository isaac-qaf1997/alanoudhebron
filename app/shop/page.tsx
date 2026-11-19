import Link from 'next/link'
import Image from 'next/image'
import { Truck, Search, UserRound, ShoppingCart, Mail, ShieldCheck, RefreshCw } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth/session'
import { getStoreProducts } from '@/lib/queries'
import { cloudinaryImageUrl } from '@/lib/images'
import { ProductGrid } from '@/components/store/product-grid'
import { StorefrontHero } from '@/components/store/storefront-hero'

export const metadata = {
  title: 'العنود للزي الشرعي | الخليل',
  description: 'العنود للزي الشرعي من الخليل — أثواب فلسطينية وعبايات وفساتين مطرزة.',
}

const socialLinks = [
  { href: 'https://www.facebook.com/Alanoudhebron/', label: 'فيسبوك', mark: 'f' },
  { href: 'https://www.instagram.com/alanoudhebron/', label: 'إنستغرام', mark: '◎' },
  { href: 'https://wa.me/970569388780', label: 'واتساب', mark: 'واتساب' },
]

function Logo() {
  return <div aria-label="شعار العنود للزي الشرعي" role="img" className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden sm:h-14 sm:w-14">
    <Image src={cloudinaryImageUrl("https://res.cloudinary.com/genxurzp/image/upload/v1794181046/alanoud/inventory/image_ee910985-ebde-4d84-b448-11a4b3d04e76.webp", 180)!} alt="شعار العنود" width={180} height={180} className="h-full w-full object-contain" />
  </div>
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams
  const [userResult, productsResult] = await Promise.allSettled([getCurrentUser(), getStoreProducts()])
  const currentUser = userResult.status === 'fulfilled' ? userResult.value : null
  const products = productsResult.status === 'fulfilled' ? productsResult.value : []
  const available = products.map((product) => {
    const variants = product.colors.filter((color) => color.sizes.length ? color.sizes.some((size) => size.stock === null || size.stock > 0) : color.stock === null || color.stock > 0)
    return { ...product, imageUrl: cloudinaryImageUrl(variants.find((variant) => variant.imageUrl)?.imageUrl || product.imageUrl, 640), variants, stock: variants.reduce((sum, variant) => sum + (variant.sizes.length ? variant.sizes.reduce((n, size) => n + (size.stock ?? 1), 0) : (variant.stock ?? 1)), 0) }
  }).filter((product) => product.stock > 0)

  return <main dir="rtl" className="min-h-dvh overflow-hidden bg-[#f7f1e9] text-[#30251c]">
    <div className="flex items-center justify-center gap-2 bg-[#211710] px-3 py-2 text-center text-[11px] font-medium text-[#f3e4cf] sm:text-xs"><Truck className="size-4 text-[#d9b98c]" /> شحن لجميع مناطق فلسطين</div>
    <header className="relative z-30 bg-[#f8f3ec] text-[#35271d] shadow-sm">
      <div className="mx-auto flex max-w-[1450px] items-center justify-between gap-3 px-4 py-3 sm:px-7">
        <Link href="/shop" aria-label="الرئيسية" className="flex shrink-0 items-center gap-2">
          <Logo />
          <span className="leading-tight"><span className="block text-2xl font-semibold text-[#3b291e] sm:text-3xl">العنود</span><span className="mt-0.5 block text-[9px] tracking-wide text-[#92734f] sm:text-[10px]">للزي الشرعي · الخليل</span></span>
        </Link>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link href="/shop#products" aria-label="البحث عن منتج" className="flex h-9 min-w-0 items-center gap-2 rounded-full bg-[#e9dfd3] px-3 text-[11px] text-[#756657] sm:w-56 sm:px-4 sm:text-xs"><Search className="size-4 shrink-0" /><span className="truncate">ابحث عن منتج...</span></Link>
          <Link href={currentUser ? (currentUser.role === 'admin' ? '/admin' : '/staff') : '/login'} aria-label="حسابي" className="grid size-9 shrink-0 place-items-center rounded-full text-[#463528] transition hover:bg-[#e9dfd3]"><UserRound className="size-5" /></Link>
          <Link href="/cart" aria-label="سلة التسوق" className="relative grid size-9 shrink-0 place-items-center rounded-full text-[#463528] transition hover:bg-[#e9dfd3]"><ShoppingCart className="size-5" /><span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[#a94435] text-[9px] font-bold text-white">0</span></Link>
        </div>
      </div>
      <nav aria-label="القائمة الرئيسية" className="bg-[#38271d] text-[#f4e8d8]">
        <div className="mx-auto flex max-w-[1450px] items-center justify-center gap-5 overflow-x-auto whitespace-nowrap px-4 py-3 text-[11px] sm:gap-8 sm:px-7 sm:text-xs">
          <Link href="/shop" className="border-b border-[#e2c39b] pb-1 font-semibold">الرئيسية</Link>
          <Link href="/shop?category=عبايات" className="transition hover:text-[#e4c39a]">العبايات</Link>
          <Link href="/shop?category=أثواب" className="transition hover:text-[#e4c39a]">الأثواب الفلسطينية</Link>
          <Link href="/shop?category=فستان%20تطريز" className="transition hover:text-[#e4c39a]">فساتين تطريز</Link>
          <Link href="/shop?category=شالات%20تطريز" className="transition hover:text-[#e4c39a]">شالات تطريز</Link>
          <Link href="/shop?category=جاكيت%20تطريز" className="transition hover:text-[#e4c39a]">جاكيت تطريز</Link>
          <Link href="/policies" className="transition hover:text-[#e4c39a]">المزيد</Link>
          {currentUser?.role === 'admin' ? <Link href="/admin" className="transition hover:text-[#e4c39a]">الإدارة</Link> : null}
        </div>
      </nav>
    </header>
    <StorefrontHero />
    <section id="products" className="mx-auto max-w-[1450px] px-4 pb-10 pt-2 sm:px-7 sm:pb-14">
      <div className="mb-6 flex items-center justify-center gap-3 text-center"><span className="h-px w-12 bg-[#b18b60]" /><div><p className="text-[9px] tracking-[.2em] text-[#a2825e]">AL ANOUD COLLECTION</p><h2 className="mt-1 text-2xl font-bold text-[#30251c]">أحدث المنتجات</h2></div><span className="h-px w-12 bg-[#b18b60]" /></div>
      <ProductGrid products={available.map(({ id, name, category, price, imageUrl, variants }) => ({ id, name, category, price, imageUrl, variants: variants.map((variant) => ({ color: variant.color })) }))} initialCategory={typeof params.category === 'string' ? params.category : ''} />
    </section>
    <section className="border-y border-[#d9cbbb] bg-[#f1e8dc] px-4 py-6 sm:px-7">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 text-center sm:grid-cols-3 sm:divide-x sm:divide-x-reverse sm:divide-[#d5c5b2]">
        <div className="flex items-center justify-center gap-3"><ShieldCheck className="size-7 text-[#74553a]" /><span className="text-xs font-semibold text-[#4b392b]">دفع عند الاستلام</span></div>
        <div className="flex items-center justify-center gap-3"><RefreshCw className="size-7 text-[#74553a]" /><span className="text-xs font-semibold text-[#4b392b]">إمكانية الاستبدال خلال 24 ساعة</span></div>
        <div className="flex items-center justify-center gap-3"><Truck className="size-7 text-[#74553a]" /><span className="text-xs font-semibold text-[#4b392b]">شحن سريع لكل مناطق فلسطين</span></div>
      </div>
    </section>
    <footer className="relative mt-0 overflow-hidden bg-[#211710] px-5 py-10 text-center text-[#f0e2d0]">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 opacity-25" style={{backgroundImage:'repeating-linear-gradient(45deg, transparent 0 8px, #b64c3e 8px 10px, transparent 10px 18px)'}} />
      <div className="relative mx-auto max-w-4xl">
        <p className="text-xl font-bold text-[#f0d8b8]">كوني دائماً على اطلاع</p><p className="mt-2 text-sm text-[#ddcbb5]">بأحدث التصاميم والعروض</p>
        <form action="mailto:info@alanoudhebron.ps" method="post" encType="text/plain" className="mx-auto mt-5 flex max-w-md flex-col gap-2 rounded-full border border-[#b89a76]/70 bg-[#f8f1e8] p-1.5 sm:flex-row">
          <label className="sr-only" htmlFor="newsletter-email">البريد الإلكتروني</label><input id="newsletter-email" name="email" type="email" required placeholder="أدخلي بريدك الإلكتروني" className="h-10 min-w-0 flex-1 bg-transparent px-4 text-right text-xs text-[#392a20] outline-none placeholder:text-[#988675]" />
          <button type="submit" className="h-10 rounded-full bg-[#dfc09a] px-6 text-xs font-bold text-[#342317] transition hover:bg-[#edcfaa]">اشتركي الآن</button>
        </form>
        <div className="mt-7 flex items-center justify-center gap-3">{socialLinks.map(({ href, label, mark }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-full border border-[#796344] px-3 py-2 text-xs text-[#e5cba8] transition hover:bg-[#383025]">{mark}</a>)}</div>
        <Link href="/policies" className="mt-5 inline-block text-xs text-[#d8bd99] underline underline-offset-4">سياسة التبديل والترجيع</Link>
        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-[#b8a38a]"><Mail className="size-3" /> العنود للزي الشرعي · الخليل</div>
      </div>
    </footer>
  </main>
}
