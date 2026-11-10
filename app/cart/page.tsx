import CartView from '@/components/store/cart-view'
import { getStoreProducts } from '@/lib/queries'

export const metadata = { title: 'سلة التسوق | العنود' }

export default async function CartPage() {
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
  }))
  return <CartView products={available} />
}
