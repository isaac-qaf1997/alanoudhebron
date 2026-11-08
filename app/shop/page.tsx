import Link from 'next/link'
import { asc, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { models, modelColors, modelSizes } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth/session'

export const metadata = {
  title: 'العنود للزي شرعي | أثواب وعبايات وفساتين تطريز',
  description: 'العنود للزي شرعي من الخليل: أثواب فلسطينية مطرزة، فساتين تطريز، عبايات ودشاديش.',
}

const socialLinks = [
  { href: 'https://www.facebook.com/Alanoudhebron/', label: 'فيسبوك', mark: 'f' },
  { href: 'https://www.instagram.com/alanoudhebron/', label: 'إنستغرام', mark: '◎' },
  { href: 'https://wa.me/970569388780', label: 'واتساب', mark: 'واتساب' },
]

function BrandMark() {
  return (
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#c6a36d] bg-[#211d18] text-[#d9bd8b] shadow-[0_0_0_4px_rgba(198,163,109,.12)]" aria-hidden="true">
      <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
        <path d="M24 4 29 15 40 10 35 21 46 24 35 29 40 40 29 35 24 46 19 35 8 40 13 29 2 24 13 19 8 8 19 13 24 4Z" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M24 13 29 19 35 24 29 29 24 35 19 29 13 24 19 19 24 13Z" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="24" cy="24" r="3" fill="currentColor"/>
      </svg>
    </span>
  )
}

export default async function ShopPage() {
  const currentUser = await getCurrentUser()
  const products = await db.select({
    id: models.id, name: models.name, price: models.price, imageUrl: models.imageUrl,
  }).from(models).where(eq(models.isPublished, true)).orderBy(desc(models.createdAt))

  const colors = products.length
    ? await db.select().from(modelColors).where(inArray(modelColors.modelId, products.map((product) => product.id))).orderBy(asc(modelColors.id))
    : []
  const sizes = colors.length
    ? await db.select().from(modelSizes).where(inArray(modelSizes.modelColorId, colors.map((color) => color.id))).orderBy(asc(modelSizes.id))
    : []

  const sizesByColor = new Map<number, typeof sizes>()
  const colorsByModel = new Map<number, typeof colors>()
  for (const size of sizes) {
    const list = sizesByColor.get(size.modelColorId) ?? []
    list.push(size)
    sizesByColor.set(size.modelColorId, list)
  }
  for (const color of colors) {
    const list = colorsByModel.get(color.modelId) ?? []
    list.push(color)
    colorsByModel.set(color.modelId, list)
  }

  const available = products.map((product) => {
    const variants = (colorsByModel.get(product.id) ?? []).map((color) => ({
      ...color,
      sizes: sizesByColor.get(color.id) ?? [],
    })).filter((color) => color.sizes.length
      ? color.sizes.some((size) => size.stock === null || size.stock > 0)
      : color.stock === null || color.stock > 0)
    return {
      ...product,
      imageUrl: variants.find((variant) => variant.imageUrl)?.imageUrl || product.imageUrl,
      variants,
      stock: variants.reduce((sum, variant) => sum + (variant.sizes.length
        ? variant.sizes.reduce((n, size) => n + (size.stock ?? 1), 0)
        : (variant.stock ?? 1)), 0),
    }
  }).filter((product) => product.stock > 0)

  return (
    <main className="min-h-dvh bg-[#f7f2e9] text-[#29251f]" dir="rtl">
      <header className="sticky top-0 z-20 border-b border-[#d9cbb5] bg-[#fbf8f2]/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-3 text-xs text-[#62584c] sm:gap-5 sm:text-sm">
            <Link href="/shop" className="transition hover:text-[#9b7745]">المتجر</Link>
            <Link href="/cart" className="transition hover:text-[#9b7745]">السلة</Link>
            {currentUser?.role === 'admin' ? <Link href="/admin" className="transition hover:text-[#9b7745]">لوحة الإدارة</Link> : null}
          </nav>
          <Link href="/shop" aria-label="العنود للزي شرعي - الصفحة الرئيسية" className="text-center">
            <span className="block text-xl font-bold tracking-wide text-[#211d18] sm:text-2xl">العنود</span>
            <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.12em] text-[#9a774b] sm:text-xs">للزي شرعي</span>
          </Link>
          <div className="flex items-center justify-end gap-1 text-[#8a6841] sm:gap-2">
            {socialLinks.map(({ href, label, mark }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="rounded-full p-2 transition hover:bg-[#eee4d5]"><span className="text-sm font-bold">{mark}</span></a>)}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
        <div className="relative isolate grid min-h-[470px] overflow-hidden rounded-[1.8rem] border border-[#b99a68]/50 bg-[#211d18] text-[#fbf5e9] shadow-[0_20px_60px_rgba(48,36,22,.18)] md:grid-cols-[1.05fr_.95fr]">
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-30" style={{backgroundImage:'radial-gradient(circle at 15% 20%, rgba(196,158,96,.35), transparent 32%), radial-gradient(circle at 85% 80%, rgba(196,158,96,.2), transparent 35%)'}}/>
          <div className="relative flex flex-col items-center justify-center px-6 py-12 text-center md:items-start md:px-12 md:text-right lg:px-16">
            <BrandMark />
            <p className="mt-5 text-[10px] font-semibold tracking-[.35em] text-[#d7b77e] sm:text-xs">ALANOUD HEBRON</p>
            <h1 className="mt-4 max-w-xl text-3xl font-bold leading-[1.7] sm:text-4xl lg:text-5xl">أناقتكِ من تراثنا…<br/>وجمالكِ في تفاصيلنا</h1>
            <p className="mt-4 max-w-lg text-sm leading-8 text-[#e6d9c5] sm:text-base">أثواب فلسطينية مطرّزة، فساتين تطريز، عبايات ودشاديش… أناقة تجمع بين الأصالة والعصرية.</p>
            <a href="#products" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full border border-[#d7b77e] bg-[#c5a16b] px-9 py-3 text-sm font-bold text-[#211d18] transition hover:bg-[#dfc394]">تسوّقي الآن</a>
            <div className="mt-7 flex flex-wrap justify-center gap-3 text-xs text-[#d7c6aa] md:justify-start sm:text-sm"><span>أثواب فلسطينية</span><span>✦</span><span>تطريز تراثي</span><span>✦</span><span>عبايات</span></div>
          </div>
          <div className="relative flex min-h-[270px] items-center justify-center overflow-hidden border-t border-[#c7a36b]/20 bg-[radial-gradient(ellipse_at_center,rgba(173,135,79,.22),transparent_65%)] md:min-h-full md:border-r md:border-t-0">
            <div aria-hidden="true" className="absolute inset-5 rounded-[48%] border border-[#c7a36b]/30 md:inset-10"/>
            <div aria-hidden="true" className="absolute inset-10 rounded-[48%] border border-dashed border-[#c7a36b]/25 md:inset-16"/>
            <svg viewBox="0 0 360 390" className="relative h-[290px] w-full max-w-[360px] sm:h-[350px]" fill="none" role="img" aria-label="زخرفة مستوحاة من التطريز الفلسطيني">
              <path d="M180 25 202 70 250 50 230 98 278 120 230 142 250 190 202 170 180 215 158 170 110 190 130 142 82 120 130 98 110 50 158 70 180 25Z" stroke="#c9aa73" strokeWidth="2" opacity=".8"/>
              <path d="M180 65 198 100 235 120 198 140 180 175 162 140 125 120 162 100 180 65Z" stroke="#e1c99e" strokeWidth="1.5"/>
              <path d="M180 105 195 120 180 135 165 120 180 105Z" fill="#c9aa73"/>
              <path d="M95 230 115 250 95 270 75 250 95 230ZM265 230 285 250 265 270 245 250 265 230Z" stroke="#c9aa73" strokeWidth="2"/>
              <path d="M180 225V340M125 250H235M145 285H215M160 315H200" stroke="#c9aa73" strokeWidth="1.5" opacity=".65"/>
              <path d="M180 235 205 260 180 285 155 260 180 235Z" stroke="#e1c99e" strokeWidth="2"/>
              <path d="M180 285 200 305 180 325 160 305 180 285Z" stroke="#e1c99e" strokeWidth="2"/>
              <circle cx="180" cy="120" r="55" stroke="#c9aa73" strokeDasharray="3 7" opacity=".6"/>
            </svg>
            <span className="absolute bottom-5 text-[10px] tracking-[.28em] text-[#c9aa73]">PALESTINIAN HERITAGE · HEBRON</span>
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-7 flex items-end justify-between">
          <div><p className="text-sm font-semibold text-[#9a774b]">اختاري إطلالتك</p><h2 className="mt-1 text-2xl font-bold text-[#30291f]">تشكيلتنا</h2></div>
          <span className="text-sm text-[#766d62]">{available.length} منتج</span>
        </div>
        {available.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {available.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#e4d8c7] bg-white transition hover:-translate-y-1 hover:shadow-lg">
            <div className="aspect-[3/4] overflow-hidden bg-[#eee5d8]">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <div className="flex h-full flex-col items-center justify-center gap-3 text-[#9a876c]"><span className="text-4xl">✦</span><span className="text-sm">أضيفي صورة المنتج</span></div>}</div>
            <div className="p-4"><h3 className="font-semibold">{product.name}</h3><p className="mt-2 font-bold text-[#8a6841]">{product.price.toFixed(2)} ₪</p><p className="mt-1 text-xs text-[#8b8175]">{product.variants.length} ألوان متاحة</p></div>
          </Link>)}
        </div> : <div className="rounded-2xl border border-dashed border-[#cdbb9f] bg-white/80 p-12 text-center text-[#766d62]"><span className="mb-3 block text-3xl text-[#b08c58]">✦</span><p className="font-semibold text-[#514536]">قريباً… تشكيلتكِ الخاصة</p><p className="mt-2 text-sm">ستظهر منتجاتكِ هنا بعد إضافتها وتحديث مخزونها من لوحة الإدارة.</p></div>}
      </section>

      <footer className="border-t border-[#d9cbb5] bg-[#211d18] px-5 py-9 text-center text-sm text-[#d8c8ad]">
        <BrandMark/>
        <p className="mt-4 font-semibold text-[#e0c18a]">العنود للزي شرعي · الخليل</p>
        <div className="mt-4 flex items-center justify-center gap-4">{socialLinks.map(({href,label,mark})=><a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-full border border-[#8f754f] p-2 text-[#e0c18a] transition hover:bg-[#3a3023]"><span className="text-sm font-bold">{mark}</span></a>)}</div>
        <Link href="/policies" className="mt-4 inline-block text-[#e0c18a] underline underline-offset-4">سياسة التبديل والترجيع</Link>
      </footer>
    </main>
  )
}
