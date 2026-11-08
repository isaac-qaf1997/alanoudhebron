import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/session'
import { getStoreProducts } from '@/lib/queries'
import { cloudinaryImageUrl } from '@/lib/images'

export const metadata = {
  title: 'العنود للزي الشرعي | الخليل',
  description: 'العنود للزي الشرعي من الخليل — أثواب فلسطينية وعبايات وفساتين مطرزة.',
}

const socialLinks = [
  { href: 'https://www.facebook.com/Alanoudhebron/', label: 'فيسبوك', mark: 'f' },
  { href: 'https://www.instagram.com/alanoudhebron/', label: 'إنستغرام', mark: '◎' },
  { href: 'https://wa.me/970569388780', label: 'واتساب', mark: 'واتساب' },
]

const modelImages: Record<number, string> = {
  0: 'https://res.cloudinary.com/genxurzp/image/upload/v1793931422/alanoud/inventory/image_dbfca2b9-2439-4dc2-8dd9-b0829f8d2b2c.jpg',
  1: 'https://res.cloudinary.com/genxurzp/image/upload/v1794062248/alanoud/inventory/image_83fd64b8-73f5-480d-a29f-12b12e35f2ad.jpg',
  2: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179205/alanoud/inventory/image_a251fbcc-36f7-4779-a9f2-19fb2641076e.webp',
  3: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179072/alanoud/inventory/image_7a846c8a-2c20-4a21-8bce-2843d704e4f4.webp',
  4: 'https://res.cloudinary.com/genxurzp/image/upload/v1794178894/alanoud/inventory/image_8b7a9fd2-4a24-4b62-a075-5b7bb07b327c.webp',
}

function PhotoTile({ cell, className = '', label }: { cell: number; className?: string; label: string }) {
  return <img src={modelImages[cell]} alt={label} className={className + ' object-contain'} loading="eager" decoding="async" />
}

function Logo() {
  return (
    <div aria-label="شعار العنود للزي الشرعي" role="img" className="flex h-[70px] w-[60px] shrink-0 items-center justify-center rounded-xl border border-[#c5a46d] bg-[#120d09] shadow-[0_5px_20px_rgba(40,30,18,.25)] sm:h-[82px] sm:w-[70px]">
      <span className="font-serif text-3xl text-[#d8b477]">ع</span>
    </div>
  )
}

export default async function ShopPage() {
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

      <section id="collections" className="relative mx-auto max-w-[1500px] overflow-hidden bg-[#100b08] px-2 pb-8 pt-3 text-[#f8e8c8] sm:px-5 sm:pt-5">
        <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(ellipse at 12% 12%, #b88b4b 0, transparent 32%), radial-gradient(ellipse at 90% 85%, #9e6c32 0, transparent 28%)' }}/>
        <div className="relative overflow-hidden rounded-[1.4rem] border border-[#bd9457]/70 bg-[#100d0b] shadow-[0_25px_80px_rgba(0,0,0,.45)] sm:rounded-[2rem]">
          <div className="grid min-h-[620px] md:min-h-[690px] md:grid-cols-2">
            <div className="relative order-2 min-h-[420px] overflow-hidden md:order-1 md:min-h-[690px]">
              <PhotoTile cell={0} label="الموديل 001 من متجر العنود" className="absolute inset-0 h-full w-full bg-cover bg-[center_22%]"/>
              <div className="absolute inset-0 bg-gradient-to-t from-[#100b08]/80 via-transparent to-[#100b08]/10 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#100b08]/20"/>
              <div className="absolute bottom-5 left-5 rounded-full border border-[#e2c28d]/70 bg-[#17100bd9] px-5 py-2 text-xs tracking-wide text-[#f4dfb8] backdrop-blur-sm sm:bottom-8 sm:left-8">تطريز فلسطيني أصيل</div>
            </div>

            <div className="relative order-1 flex min-h-[470px] flex-col items-center justify-center overflow-hidden px-5 py-9 text-center md:order-2 md:min-h-[690px] md:px-9 lg:px-14">
              <div className="absolute inset-0 bg-cover bg-center opacity-45" style={{ backgroundImage: "linear-gradient(180deg, rgba(13,9,6,.3), rgba(13,9,6,.88)), url('https://commons.wikimedia.org/wiki/Special:FilePath/Ibrahimi_mosque_-Hebron.jpg')" }}/>
              <div className="absolute inset-0 bg-gradient-to-b from-[#120d09]/20 via-[#120d09]/55 to-[#120d09]/95"/>
              <div className="relative flex flex-col items-center">
                <div className="mb-3 w-[118px] overflow-hidden rounded-2xl border border-[#d5ad6b]/80 bg-black shadow-[0_0_38px_rgba(205,163,94,.2)] sm:w-[140px]">
                  <PhotoTile cell={0} label="الموديل 001" className="aspect-[.83] w-full bg-black"/>
                </div>
                <p className="text-[2rem] font-semibold tracking-wide text-[#f2d29a] sm:text-4xl" style={{ fontFamily: 'Georgia, serif' }}>Al Anoud</p>
                <h1 className="mt-2 text-2xl font-bold text-[#f8e3bd] sm:text-3xl">العنود للزي الشرعي</h1>
                <div className="mt-4 flex w-full max-w-sm items-center gap-3 text-[#d9b475]">
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c69b5a]"/>
                  <span className="text-lg">✥ ❖ ✥</span>
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c69b5a]"/>
                </div>
                <p className="mt-5 text-lg leading-relaxed text-[#f4dfbd] sm:text-xl">أناقتكِ من تراثنا ..<br/>وجمالكِ في تفاصيلنا</p>
                <div className="mt-4 text-3xl text-[#d7b477]">♡</div>
              </div>
            </div>
          </div>

          <div className="relative border-t border-[#c39a5d]/80 bg-[#15100d] px-3 pb-5 pt-6 sm:px-6 sm:pb-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#b58a4d]/10 to-transparent"/>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[
                { title: 'عبايات', cell: 2 },
                { title: 'أثواب بناتي', cell: 3 },
                { title: 'أثواب', cell: 4 },
                { title: 'فستان تطريز', cell: 1 },
              ].map((item) => (
                <a key={item.title} href="#products" className="group relative overflow-hidden rounded-t-[48%] rounded-b-xl border border-[#d0a66a]/80 bg-[#201710] shadow-[0_7px_22px_rgba(0,0,0,.35)]">
                  <PhotoTile cell={item.cell} label={item.title} className="aspect-[.82] w-full bg-cover bg-center transition duration-500 group-hover:scale-[1.025]"/>
                  <div className="relative mx-auto -mt-1 w-[90%] rounded-full border border-[#e6c58f] bg-gradient-to-b from-[#f2d8a7] to-[#c99c5d] px-2 py-2 text-center text-sm font-bold text-[#1c140c] shadow-lg sm:text-base">{item.title}</div>
                </a>
              ))}
            </div>
          </div>

          <div className="relative border-t border-[#b88b50]/70 bg-[#100c09] px-4 pb-7 pt-5 text-center sm:px-8 sm:pt-7">
            <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 text-lg font-semibold text-[#f1d5a5] sm:text-xl">
              <span className="text-3xl text-[#d9b77d]">♧</span>
              <span>الدفع عند الاستلام</span>
            </div>
            <a href="#products" className="mx-auto mt-6 inline-flex min-h-14 items-center justify-center gap-3 rounded-full border-2 border-[#f1d29b] bg-gradient-to-b from-[#f5dfb6] to-[#c99b5c] px-10 text-lg font-bold text-[#1c140c] shadow-[0_5px_0_#8e642f,0_12px_28px_rgba(0,0,0,.35)] transition hover:-translate-y-0.5 sm:text-xl">
              <span>تسوّقي الآن</span><span className="text-2xl">🛒</span>
            </a>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a href="https://www.instagram.com/alanoudhebron/" target="_blank" rel="noreferrer" aria-label="إنستغرام" className="flex min-w-[135px] items-center justify-center gap-2 rounded-xl border border-[#d1aa70] px-4 py-2.5 text-xs text-[#f4dfbd] transition hover:bg-[#3b2a19]"><span className="text-xl">◎</span><span><span className="block text-[9px]">تابعونا على</span><span className="font-semibold">Instagram</span></span></a>
              <a href="https://www.facebook.com/Alanoudhebron/" target="_blank" rel="noreferrer" aria-label="فيسبوك" className="flex min-w-[135px] items-center justify-center gap-2 rounded-xl border border-[#d1aa70] px-4 py-2.5 text-xs text-[#f4dfbd] transition hover:bg-[#3b2a19]"><span className="text-2xl font-bold">f</span><span><span className="block text-[9px]">تابعونا على</span><span className="font-semibold">Facebook</span></span></a>
              <a href="https://wa.me/970569388780" target="_blank" rel="noreferrer" aria-label="واتساب" className="flex min-w-[135px] items-center justify-center gap-2 rounded-xl border border-[#d1aa70] px-4 py-2.5 text-xs text-[#f4dfbd] transition hover:bg-[#3b2a19]"><span className="text-xl">◉</span><span><span className="block text-[9px]">تواصلوا معنا</span><span className="font-semibold">WhatsApp</span></span></a>
            </div>
            <div className="pointer-events-none absolute bottom-0 left-0 h-2 w-full bg-gradient-to-r from-transparent via-[#c39a5d] to-transparent opacity-70"/>
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-7xl bg-[#100b08] px-4 py-10 text-[#f2dfbd] sm:px-7 sm:py-14">
        <div className="mb-7 flex items-end justify-between border-b border-[#8f6a39] pb-4">
          <div><p className="text-[10px] font-semibold tracking-[.22em] text-[#a17b48]">THE LATEST</p><h2 className="mt-2 text-2xl font-semibold text-[#f1d8ae]">تشكيلة العنود</h2></div>
          <span className="text-xs text-[#c7aa7d]">{available.length} منتج</span>
        </div>
        {available.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {available.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#8f6a39] bg-[#201710] transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#6d5637]/20">
            <div className="aspect-[3/4] overflow-hidden bg-[#eee8de]">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center text-sm text-[#9a8b77]">صورة المنتج قريباً</div>}</div>
            <div className="p-3 sm:p-4"><h3 className="text-sm font-medium text-[#f1dfc2]">{product.name}</h3><p className="mt-2 font-semibold text-[#e2bc7e]">{product.price.toFixed(2)} ₪</p><p className="mt-1 text-[11px] text-[#c4ad8e]">{product.variants.length} ألوان متاحة</p></div>
          </Link>)}
        </div> : <div className="border-y border-[#e6dccd] py-14 text-center"><Logo/><p className="mt-5 font-semibold text-[#514536]">تشكيلتنا الجديدة قريباً</p><p className="mt-2 text-sm text-[#928675]">ستظهر المنتجات هنا بعد إضافتها ونشرها من لوحة الإدارة.</p></div>}
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
