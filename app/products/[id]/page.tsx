import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asc, and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { models, modelColors } from '@/lib/db/schema'
import AddToCart from '@/components/store/add-to-cart'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) notFound()
  const [product] = await db.select({ id: models.id, name: models.name, price: models.price, imageUrl: models.imageUrl }).from(models).where(and(eq(models.id, productId), eq(models.isPublished, true))).limit(1)
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
        <AddToCart modelId={product.id} colors={inStock.map(v => ({ color: v.color, stock: v.stock }))}/>
        <Link href="/cart" className="mt-4 inline-flex text-sm text-[#765637] underline">الانتقال إلى السلة</Link>
      </div>
    </section>
  </main>
}
