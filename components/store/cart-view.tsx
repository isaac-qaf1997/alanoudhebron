'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Size = { size: string; stock: number | null }
type Color = { color: string; stock: number | null; sizes: Size[] }
type Product = { id: number; name: string; price: number; colors: Color[] }
type Line = { modelId: number; color: string; size?: string; quantity: number }
const KEY = 'alanoud-cart-v1'

function cleanCart(value: unknown, products: Product[]): Line[] {
 if (!Array.isArray(value)) return []
 const cleaned: Line[]=[]
 for(const raw of value){
  if(!raw||typeof raw!=='object')continue
  const line=raw as Record<string,unknown>, modelId=Number(line.modelId), quantity=Number(line.quantity)
  const color=typeof line.color==='string'?line.color.trim().slice(0,60):''
  const size=typeof line.size==='string'?line.size.trim().slice(0,40):''
  const product=products.find(p=>p.id===modelId), variant=product?.colors.find(v=>v.color===color)
  const sizeVariant=variant?.sizes.find(v=>v.size===size)
  if(!product||!variant||!Number.isSafeInteger(quantity)||quantity<1)continue
  if(variant.sizes.length&&!sizeVariant)continue
  if(!variant.sizes.length&&size)continue
  const stock=(variant.sizes.length?sizeVariant?.stock:variant.stock)??500
  if(stock<1)continue
  const existing=cleaned.find(x=>x.modelId===modelId&&x.color===color&&(x.size||'')===size)
  if(existing)existing.quantity=Math.min(stock,existing.quantity+quantity)
  else cleaned.push({modelId,color,size:size||undefined,quantity:Math.min(stock,quantity)})
 }
 return cleaned
}
export default function CartView({products}:{products:Product[]}){
 const [items,setItems]=useState<Line[]>([])
 useEffect(()=>{try{setItems(cleanCart(JSON.parse(localStorage.getItem(KEY)||'[]'),products))}catch{setItems([]);localStorage.removeItem(KEY)}},[products])
 function save(next:Line[]){const safe=cleanCart(next,products);setItems(safe);localStorage.setItem(KEY,JSON.stringify(safe))}
 const total=items.reduce((sum,line)=>sum+(products.find(p=>p.id===line.modelId)?.price||0)*line.quantity,0)
 return <main dir="rtl" className="min-h-dvh bg-[#faf8f4] px-5 py-10 text-[#29251f]"><div className="mx-auto max-w-4xl"><Link href="/shop" className="font-bold text-[#765637]">العنود</Link><h1 className="my-8 text-3xl font-bold">سلة التسوق</h1>{!items.length?<div className="rounded-2xl bg-white p-10 text-center">السلة فارغة<div><Link href="/shop" className="mt-4 inline-block text-[#765637] underline">تصفحي المتجر</Link></div></div>:<><div className="space-y-3">{items.map((line,index)=>{const product=products.find(p=>p.id===line.modelId),variant=product?.colors.find(v=>v.color===line.color),size=variant?.sizes.find(s=>s.size===line.size),max=(variant?.sizes.length?size?.stock:variant?.stock)??500;return <div key={line.modelId+'-'+line.color+'-'+(line.size||'')} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5"><div><b>{product?.name||'منتج'}</b><p className="text-sm text-stone-500">{line.color}{line.size?' · '+line.size:''} · {(product?.price||0).toFixed(2)} ₪</p></div><div className="flex items-center gap-3"><button aria-label="تقليل الكمية" onClick={()=>save(items.map((item,i)=>i===index?{...item,quantity:item.quantity-1}:item).filter(item=>item.quantity>0))} className="rounded-full border px-3 py-1">−</button><span>{line.quantity}</span><button aria-label="زيادة الكمية" disabled={line.quantity>=max} onClick={()=>save(items.map((item,i)=>i===index?{...item,quantity:Math.min(max,item.quantity+1)}:item))} className="rounded-full border px-3 py-1 disabled:opacity-40">+</button><button onClick={()=>save(items.filter((_,i)=>i!==index))} className="text-sm text-red-600">حذف</button></div></div>})}</div><div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-6"><b>المجموع: {total.toFixed(2)} ₪</b><Link href="/checkout" className="rounded-full bg-[#765637] px-7 py-3 font-bold text-white">متابعة لإتمام الطلب</Link></div></>}</div></main>
}
