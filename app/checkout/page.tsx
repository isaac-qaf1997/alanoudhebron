import CheckoutForm from '@/components/store/checkout-form'
import { getStoreProducts } from '@/lib/queries'

export const metadata = { title: 'إتمام الطلب | العنود' }

export default async function CheckoutPage() {
  const products = await getStoreProducts()
  const available = products.map((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    colors: product.colors.filter((color) => color.sizes.length
      ? color.sizes.some((size) => size.stock === null || size.stock > 0)
      : color.stock === null || color.stock > 0).map((color) => ({
        color: color.color,
        stock: color.stock,
        sizes: color.sizes,
      })),
  })).filter((product) => product.colors.length)
  return <main dir="rtl" className="min-h-dvh bg-[#faf8f4] px-4 py-10 text-[#29251f]"><div className="mx-auto max-w-6xl"><a href="/shop" className="font-bold text-[#765637]">العنود</a><div className="my-8"><p className="text-sm text-[#8a6841]">خطوة أخيرة</p><h1 className="mt-2 text-3xl font-bold">إتمام الطلب</h1></div><CheckoutForm products={available}/></div></main>
}
