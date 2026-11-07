import Link from 'next/link'
import { asc, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { models, modelColors } from '@/lib/db/schema'

export const metadata = {
  title: 'العنود للزي الشرعي | أثواب وعبايات وفساتين تطريز',
  description: 'العنود للزي الشرعي من الخليل: أثواب فلسطينية مطرزة، فساتين تطريز، عبايات ودشاديش.',
}

const socialLinks = [
  { href: 'https://www.facebook.com/Alanoudhebron/', label: 'فيسبوك', mark: 'f' },
  { href: 'https://www.instagram.com/alanoudhebron/', label: 'إنستغرام', mark: '◎' },
  { href: 'https://wa.me/970569388780', label: 'واتساب', mark: 'واتساب' },
]

export default async function ShopPage() {
  const [products, colors] = await Promise.all([
    db.select({ id: models.id, name: models.name, price: models.price, imageUrl: models.imageUrl }).from(models).orderBy(desc(models.createdAt)),
    db.select({ modelId: modelColors.modelId, color: modelColors.color, stock: modelColors.stock, imageUrl: modelColors.imageUrl }).from(modelColors).orderBy(asc(modelColors.id)),
  ])
  const available = products.map((product) => {
    const variants = colors.filter((color) => color.modelId === product.id && color.stock > 0)
    return { ...product, imageUrl: variants.find((v) => v.imageUrl)?.imageUrl || product.imageUrl, variants, stock: variants.reduce((sum, v) => sum + v.stock, 0) }
  }).filter((product) => product.stock > 0)

  return (
    <main className="min-h-dvh bg-[#faf8f4] text-[#29251f]" dir="rtl">
      <header className="border-b border-[#e9e2d7] bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-5 py-4">
          <nav className="flex items-center gap-4 text-sm text-[#62584c]">
            <Link href="/shop" className="transition hover:text-[#9b7745]">المتجر</Link>
            <Link href="/cart" className="transition hover:text-[#9b7745]">السلة</Link>
          </nav>
          <Link href="/shop" aria-label="العنود للزي الشرعي - الصفحة الرئيسية" className="text-center">
            <span className="block text-2xl font-bold tracking-wide text-[#8a6841] sm:text-3xl">العنود</span>
            <span className="mt-0.5 block text-[11px] font-semibold tracking-[0.16em] text-[#62584c] sm:text-xs">للزي الشرعي</span>
          </Link>
          <div className="flex items-center justify-end gap-3 text-[#8a6841]">
            {socialLinks.map(({ href, label, mark }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="rounded-full p-2 transition hover:bg-[#f4eee5] hover:text-[#5e4528]">
                <span className="text-sm font-bold">{mark}</span>
              </a>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pt-7 sm:pt-10">
        <div className="relative isolate overflow-hidden rounded-[2rem] border border-[#c9ad7b]/30 bg-[#211d18] px-6 py-12 text-center text-[#fbf5e9] shadow-[0_18px_55px_rgba(48,36,22,0.12)] sm:px-12 sm:py-16">
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, rgba(196,158,96,.32), transparent 32%), radial-gradient(circle at 85% 80%, rgba(196,158,96,.2), transparent 35%)' }} />
          <p className="mb-4 text-xs font-semibold tracking-[0.28em] text-[#d7b77e] sm:text-sm">ALANOUD HEBRON</p>
          <div className="mx-auto mb-5 h-px w-20 bg-[#c7a36b]" />
          <h1 className="mx-auto max-w-3xl text-3xl font-bold leading-relaxed sm:text-5xl">أناقتكِ من تراثنا… وجمالكِ في تفاصيلنا</h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-[#e6d9c5] sm:text-base">
            أثواب فلسطينية مطرّزة، فساتين تطريز، عبايات ودشاديش… أناقة تجمع بين الأصالة والعصرية.
          </p>
          <a href="#products" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full border border-[#d7b77e] bg-[#c5a16b] px-9 py-3 text-sm font-bold text-[#211d18] transition hover:bg-[#dfc394]">
            تسوّقي الآن
          </a>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#d7c6aa] sm:text-sm">
            <span>أثواب فلسطينية</span><span aria-hidden="true">✦</span><span>فساتين تطريز</span><span aria-hidden="true">✦</span><span>عبايات</span><span aria-hidden="true">✦</span><span>دشاديش</span>
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
        <div className="mb-7 flex items-end justify-between">
          <div><p className="text-sm font-semibold text-[#9a774b]">اختاري إطلالتك</p><h2 className="mt-1 text-2xl font-bold text-[#30291f]">تشكيلتنا</h2></div>
          <span className="text-sm text-[#766d62]">{available.length} منتج</span>
        </div>
        {available.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {available.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#eee8df] bg-white transition hover:-translate-y-1 hover:shadow-lg">
            <div className="aspect-[3/4] overflow-hidden bg-[#f0ece6]">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-sm text-[#a69a89]">صورة المنتج قريباً</div>}</div>
            <div className="p-4"><h3 className="font-semibold">{product.name}</h3><p className="mt-2 font-bold text-[#8a6841]">{product.price.toFixed(2)} ₪</p><p className="mt-1 text-xs text-[#8b8175]">{product.variants.length} ألوان متاحة</p></div>
          </Link>)}
        </div> : <div className="rounded-2xl border border-dashed border-[#d8cbbb] bg-white p-12 text-center text-[#766d62]">لا توجد منتجات متاحة للبيع حالياً. ستظهر المنتجات هنا بعد إضافتها وتحديث مخزونها من لوحة الإدارة.</div>}
      </section>

      <footer className="border-t border-[#e9e2d7] bg-white px-5 py-8 text-center text-sm text-[#8b8175]">
        <p className="font-semibold text-[#8a6841]">العنود للزي الشرعي · الخليل</p>
        <div className="mt-4 flex items-center justify-center gap-4">
          {socialLinks.map(({ href, label, mark }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-full border border-[#e9e2d7] p-2 text-[#8a6841] transition hover:bg-[#f7f2ea]"><span className="text-sm font-bold">{mark}</span></a>)}
        </div>
        <Link href="/policies" className="mt-4 inline-block text-[#765637] underline underline-offset-4">سياسة التبديل والترجيع</Link>
      </footer>
    </main>
  )
}
