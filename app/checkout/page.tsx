import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { models, modelColors } from '@/lib/db/schema'
import CheckoutForm from '@/components/store/checkout-form'

export const metadata = { title: 'إتمام الطلب | العنود' }

export default async function CheckoutPage() {
  const [products, variants] = await Promise.all([
    db.select({ id: models.id, name: models.name, price: models.price }).from(models).where(eq(models.isPublished, true)),
    db.select({ modelId: modelColors.modelId, color: modelColors.color, stock: modelColors.stock }).from(modelColors).orderBy(asc(modelColors.id)),
  ])
  const available = products.map(p => ({ ...p, colors: variants.filter(v => v.modelId === p.id && v.stock > 0).map(v => ({ color: v.color, stock: v.stock })) })).filter(p => p.colors.length)
  return <main dir="rtl" className="min-h-dvh bg-[#faf8f4] px-4 py-10 text-[#29251f]"><div className="mx-auto max-w-6xl"><a href="/shop" className="font-bold text-[#765637]">العنود</a><div className="my-8"><p className="text-sm text-[#8a6841]">خطوة أخيرة</p><h1 className="mt-2 text-3xl font-bold">إتمام الطلب</h1></div><CheckoutForm products={available}/></div></main>
}
