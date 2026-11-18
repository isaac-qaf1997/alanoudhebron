import Link from 'next/link'
import Image from 'next/image'
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
  return (
    <div aria-label="شعار العنود للزي الشرعي" role="img" className="flex h-[70px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#c5a46d] bg-[#120d09] shadow-[0_5px_20px_rgba(40,30,18,.25)] sm:h-[82px] sm:w-[70px]">
      <Image src={cloudinaryImageUrl("https://res.cloudinary.com/genxurzp/image/upload/v1794181046/alanoud/inventory/image_ee910985-ebde-4d84-b448-11a4b3d04e76.webp", 180)!} alt="شعار العنود" width={180} height={180} className="h-full w-full object-contain p-1" />
    </div>
  )
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams
  const [userResult, productsResult] = await Promise.allSettled([getCurrentUser(), getStoreProducts()])
  const currentUser = userResult.status === 'fulfilled' ? userResult.value : null
  const products = productsResult.status === 'fulfilled' ? productsResult.value : []
  const available = products.map((product) => {
    const variants = product.colors.filter((color) => color.sizes.length
      ? color.sizes.some((size) => size.stock === null || size.stock > 0)
      : color.stock === null || color.stock > 0)
    return {
      ...product,
      imageUrl: cloudinaryImageUrl(variants.find((variant) => variant.imageUrl)?.imageUrl || product.imageUrl, 640),
      variants,
      stock: variants.reduce((sum, variant) => sum + (variant.sizes.length
        ? variant.sizes.reduce((n, size) => n + (size.stock ?? 1), 0)
        : (variant.stock ?? 1)), 0),
    }
  }).filter((product) => product.stock > 0)

  return (
    <main dir="rtl" className="min-h-dvh overflow-hidden bg-[#100b08] text-[#f3dfbd]">
      <div className="border-b border-[#8f6a39] bg-[#100c09] px-4 py-2 text-center text-[10px] tracking-wide text-[#e6d3ae] sm:text-xs">
        العنود للزي الشرعي · الخليل <span className="mx-2 text-[#bd9b62]">✦</span> أناقة من روح التراث
      </div>

      <header className="sticky top-0 z-30 border-b border-[#8f6a39]/70 bg-[#17110d]/95 text-[#f1d8ae] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-7">
          <nav className="flex items-center gap-3 text-xs text-[#e2c89e] sm:gap-6 sm:text-sm">
            <Link href="/shop" className="transition hover:text-[#a17b43]">الرئيسية</Link>
            <a href="#collections" className="hidden transition hover:text-[#a17b43] sm:inline">تشكيلاتنا</a>
            <a href="#products" className="transition hover:text-[#a17b43]">المنتجات</a>
            {currentUser?.role === 'admin' ? <Link href="/admin" className="hidden transition hover:text-[#a17b43] sm:inline">الإدارة</Link> : null}
          </nav>

          <Link href="/shop" aria-label="العنود للزي الشرعي" className="flex items-center gap-2.5">
            <Logo />
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-wide text-[#f1d8ae] sm:text-xl">العنود</span>
              <span className="mt-1 block text-[9px] font-semibold tracking-[.12em] text-[#c9a36b] sm:text-[11px]">للزي الشرعي · الخليل</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 text-[#8c6a3d]">
            <Link href="/cart" aria-label="السلة" className="rounded-full border border-[#8f6a39] p-2.5 text-[#f1d8ae] transition hover:bg-[#3b2a19]">♡</Link>
            <a href="https://wa.me/970569388780" aria-label="واتساب" className="hidden rounded-full bg-[#c99b5c] px-4 py-2.5 text-xs font-semibold text-[#21170e] transition hover:bg-[#e4c38e] sm:inline-flex">تواصلي معنا</a>
          </div>
        </div>
      </header>

      <StorefrontHero />

      <section id="products" className="mx-auto max-w-7xl bg-[#100b08] px-4 py-10 text-[#f2dfbd] sm:px-7 sm:py-14">
        <div className="mb-7 flex items-end justify-between border-b border-[#8f6a39] pb-4">
          <div><p className="text-[10px] font-semibold tracking-[.22em] text-[#a17b48]">THE LATEST</p><h2 className="mt-2 text-2xl font-semibold text-[#f1d8ae]">تشكيلة العنود</h2></div>
          <span className="text-xs text-[#c7aa7d]">{available.length} منتج</span>
        </div>
        <ProductGrid products={available.map(({ id, name, category, price, imageUrl, variants }) => ({ id, name, category, price, imageUrl, variants: variants.map((variant) => ({ color: variant.color })) }))} initialCategory={typeof params.category === 'string' ? params.category : ''} />
      </section>

      <footer className="mt-8 bg-[#211d19] px-5 py-10 text-center text-sm text-[#e1d2b8]">
        <div className="mx-auto flex max-w-7xl flex-col items-center">
          <Logo/>
          <p className="mt-4 text-base font-semibold text-[#e5c991]">العنود للزي الشرعي</p>
          <p className="mt-1 text-xs text-[#b9aa91]">الخليل · فلسطين</p>
          <div className="mt-5 flex items-center justify-center gap-3">{socialLinks.map(({ href, label, mark }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-full border border-[#796344] px-3 py-2 text-xs text-[#e5c991] transition hover:bg-[#383025]">{mark}</a>)}</div>
          <Link href="/policies" className="mt-5 text-xs text-[#e5c991] underline underline-offset-4">سياسة التبديل والترجيع</Link>
        </div>
      </footer>
    </main>
  )
}
