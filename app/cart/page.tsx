import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { models, modelColors, modelSizes } from '@/lib/db/schema'
import CartView from '@/components/store/cart-view'

export const metadata = { title: 'سلة التسوق | العنود' }
export default async function CartPage() {
 const [products,variants,sizes]=await Promise.all([
  db.select({id:models.id,name:models.name,price:models.price}).from(models).where(eq(models.isPublished, true)),
  db.select().from(modelColors).orderBy(asc(modelColors.id)),
  db.select().from(modelSizes).orderBy(asc(modelSizes.id)),
 ])
 const available=products.map(p=>({...p,colors:variants.filter(v=>v.modelId===p.id).map(v=>({color:v.color,stock:v.stock,sizes:sizes.filter(s=>s.modelColorId===v.id)})).filter(v=>v.sizes.length?v.sizes.some(s=>s.stock===null||s.stock>0):v.stock===null||v.stock>0)}))
 return <CartView products={available}/>
}
