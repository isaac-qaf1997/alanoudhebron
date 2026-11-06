import { asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { models, modelColors } from '@/lib/db/schema'
import CartView from '@/components/store/cart-view'

export const metadata = { title: 'سلة التسوق | العنود' }
export default async function CartPage() {
 const [products,variants]=await Promise.all([
  db.select({id:models.id,name:models.name,price:models.price}).from(models),
  db.select({modelId:modelColors.modelId,color:modelColors.color,stock:modelColors.stock}).from(modelColors).orderBy(asc(modelColors.id)),
 ])
 const available=products.map(p=>({...p,colors:variants.filter(v=>v.modelId===p.id&&v.stock>0).map(v=>({color:v.color,stock:v.stock}))}))
 return <CartView products={available}/>
}
