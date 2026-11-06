import Link from 'next/link'
import { asc, desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { models, modelColors } from '@/lib/db/schema'

export const metadata = { title: 'تسوّقي | العنود للزي الشرعي', description: 'تصفحي العبايات والأزياء الشرعية من متجر العنود' }

export default async function ShopPage() {
  const [products, colors] = await Promise.all([
    db.select({ id: models.id, name: models.name, price: models.price, imageUrl: models.imageUrl }).from(models).orderBy(desc(models.createdAt)),
    db.select({ modelId: modelColors.modelId, color: modelColors.color, stock: modelColors.stock, imageUrl: modelColors.imageUrl }).from(modelColors).orderBy(asc(modelColors.id)),
  ])
  const available = products.map((product) => {
    const variants = colors.filter((color) => color.modelId === product.id)
    return { ...product, imageUrl: variants.find((v) => v.imageUrl)?.imageUrl || product.imageUrl, variants, stock: variants.reduce((sum, v) => sum + v.stock, 0) }
  }).filter((product) => product.stock > 0)
  return (
    <main className="min-h-dvh bg-[#faf8f4] text-[#29251f]" dir="rtl">
      <header className="border-b border-[#e9e2d7] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/shop" className="text-2xl font-bold tracking-wide text-[#7b5b36]">العنود</Link>
          <nav className="flex items-center gap-5 text-sm"><Link href="/shop">المتجر</Link><Link href="/cart">السلة</Link></nav>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-10 rounded-3xl bg-[#eee5d8] px-7 py-12 md:px-12">
          <p className="mb-3 text-sm font-semibold text-[#8a6841]">Alanoud Hebron</p>
          <h1 className="max-w-2xl text-3xl font-bold leading-relaxed md:text-5xl">أناقتكِ تبدأ من اختيارك</h1>
          <p className="mt-4 max-w-xl leading-8 text-[#6f6253]">اكتشفي تشكيلتنا من العبايات والأزياء الشرعية المصممة بذوق يليق بكِ.</p>
        </div>
        <div className="mb-6 flex items-end justify-between"><div><p className="text-sm text-[#8a6841]">تشكيلتنا</p><h2 className="mt-1 text-2xl font-bold">منتجاتنا</h2></div><span className="text-sm text-[#766d62]">{available.length} منتج</span></div>
        {available.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {available.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#eee8df] bg-white transition hover:-translate-y-1 hover:shadow-lg">
            <div className="aspect-[3/4] overflow-hidden bg-[#f0ece6]">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-sm text-[#a69a89]">صورة المنتج قريباً</div>}</div>
            <div className="p-4"><h3 className="font-semibold">{product.name}</h3><p className="mt-2 font-bold text-[#8a6841]">{product.price.toFixed(2)} ₪</p><p className="mt-1 text-xs text-[#8b8175]">{product.variants.length} ألوان متاحة</p></div>
          </Link>)}
        </div> : <div className="rounded-2xl border border-dashed border-[#d8cbbb] bg-white p-12 text-center text-[#766d62]">لا توجد منتجات متاحة للبيع حالياً. ستظهر المنتجات هنا بعد إضافتها وتحديث مخزونها من لوحة الإدارة.</div>}
      </section>
      <footer className="border-t border-[#e9e2d7] bg-white px-5 py-8 text-center text-sm text-[#8b8175]">العنود للزي الشرعي · الخليل</footer>
    </main>
  )
}
