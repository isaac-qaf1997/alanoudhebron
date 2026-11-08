import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { models, modelColors, modelSizes } from '@/lib/db/schema'
import CheckoutForm from '@/components/store/checkout-form'

export const metadata = { title: 'إتمام الطلب | العنود' }

export default async function CheckoutPage() {
  const [products, variants, sizes] = await Promise.all([
    db.select({ id: models.id, name: models.name, price: models.price }).from(models).where(eq(models.isPublished, true)),
    db.select().from(modelColors).orderBy(asc(modelColors.id)),
    db.select().from(modelSizes).orderBy(asc(modelSizes.id)),
  ])
  const available = products.map(p => ({ ...p, colors: variants.filter(v => v.modelId === p.id).map(v => ({ color: v.color, stock: v.stock, sizes: sizes.filter(s => s.modelColorId === v.id) })).filter(v => v.sizes.length ? v.sizes.some(s => s.stock === null || s.stock > 0) : v.stock === null || v.stock > 0) })).filter(p => p.colors.length)
  return <main dir="rtl" className="min-h-dvh bg-[#faf8f4] px-4 py-10 text-[#29251f]"><div className="mx-auto max-w-6xl"><a href="/shop" className="font-bold text-[#765637]">العنود</a><div className="my-8"><p className="text-sm text-[#8a6841]">خطوة أخيرة</p><h1 className="mt-2 text-3xl font-bold">إتمام الطلب</h1></div><CheckoutForm products={available}/></div></main>
}
