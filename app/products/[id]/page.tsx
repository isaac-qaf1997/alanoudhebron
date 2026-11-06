import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { models, modelColors } from '@/lib/db/schema'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) notFound()
  const [product] = await db.select({ id: models.id, name: models.name, price: models.price, imageUrl: models.imageUrl }).from(models).where(eq(models.id, productId)).limit(1)
  if (!product) notFound()
  const variants = await db.select({ color: modelColors.color, stock: modelColors.stock, imageUrl: modelColors.imageUrl }).from(modelColors).where(eq(modelColors.modelId, productId)).orderBy(asc(modelColors.id))
  const inStock = variants.filter((v) => v.stock > 0)
  if (!inStock.length) notFound()
  const image = inStock.find((v) => v.imageUrl)?.imageUrl || product.imageUrl
  return <main dir="rtl" className="min-h-dvh bg-[#faf8f4] text-[#29251f]">
    <header className="border-b border-[#e9e2d7] bg-white px-5 py-5"><div className="mx-auto flex max-w-6xl justify-between"><Link href="/shop" className="text-xl font-bold text-[#7b5b36]">العنود</Link><Link href="/shop" className="text-sm">العودة للمتجر</Link></div></header>
    <section className="mx-auto grid max-w-6xl gap-10 px-5 py-10 md:grid-cols-2">
      <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-[#eee8df]">{image ? <img src={image} alt={product.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-[#a69a89]">صورة المنتج قريباً</div>}</div>
      <div className="py-4"><p className="text-sm text-[#8a6841]">العنود للزي الشرعي</p><h1 className="mt-3 text-3xl font-bold">{product.name}</h1><p className="mt-5 text-2xl font-bold text-[#8a6841]">{product.price.toFixed(2)} ₪</p>
        <div className="mt-9"><h2 className="font-semibold">الألوان المتوفرة</h2><div className="mt-3 flex flex-wrap gap-2">{inStock.map((variant) => <span key={variant.color} className="rounded-full border border-[#d9cbbb] bg-white px-4 py-2 text-sm">{variant.color} · متوفر {variant.stock}</span>)}</div></div>
        <p className="mt-8 rounded-xl bg-[#eee5d8] p-4 text-sm leading-7 text-[#6f6253]">لإتمام الطلب، تواصلي معنا أو تابعي تحديثات المتجر. سيتم تفعيل السلة والدفع الإلكتروني بعد استكمال ربط الطلبات وطرق الدفع.</p>
        <Link href="/shop" className="mt-6 inline-flex rounded-full bg-[#765637] px-7 py-3 font-semibold text-white">متابعة التسوق</Link>
      </div>
    </section>
  </main>
}
