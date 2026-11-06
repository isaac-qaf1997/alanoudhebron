'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
type Product={id:number;name:string;price:number;colors:{color:string;stock:number}[]}
type Line={modelId:number;color:string;quantity:number}
const KEY='alanoud-cart-v1'
export default function CartView({products}:{products:Product[]}) {
 const [items,setItems]=useState<Line[]>([])
 useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem(KEY)||'[]'))}catch{setItems([])}},[])
 function save(next:Line[]){setItems(next);localStorage.setItem(KEY,JSON.stringify(next))}
 const total=items.reduce((sum,l)=>sum+(products.find(p=>p.id===l.modelId)?.price||0)*l.quantity,0)
 return <main dir="rtl" className="min-h-dvh bg-[#faf8f4] px-5 py-10 text-[#29251f]"><div className="mx-auto max-w-4xl"><Link href="/shop" className="font-bold text-[#765637]">العنود</Link><h1 className="my-8 text-3xl font-bold">سلة التسوق</h1>{!items.length?<div className="rounded-2xl bg-white p-10 text-center">السلة فارغة <div><Link href="/shop" className="mt-4 inline-block text-[#765637] underline">تصفحي المتجر</Link></div></div>:<><div className="space-y-3">{items.map((line,i)=>{const p=products.find(x=>x.id===line.modelId);return <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5"><div><b>{p?.name||'منتج'}</b><p className="text-sm text-stone-500">{line.color} · {(p?.price||0).toFixed(2)} ₪</p></div><div className="flex items-center gap-3"><button aria-label="تقليل الكمية" onClick={()=>save(items.map((x,j)=>j===i?{...x,quantity:x.quantity-1}:x).filter(x=>x.quantity>0))} className="rounded-full border px-3 py-1">−</button><span>{line.quantity}</span><button aria-label="زيادة الكمية" onClick={()=>{const max=p?.colors.find(c=>c.color===line.color)?.stock||1;save(items.map((x,j)=>j===i?{...x,quantity:Math.min(max,x.quantity+1)}:x))}} className="rounded-full border px-3 py-1">+</button><button onClick={()=>save(items.filter((_,j)=>j!==i))} className="text-sm text-red-600">حذف</button></div></div>})}</div><div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-6"><b>المجموع: {total.toFixed(2)} ₪</b><Link href="/checkout" className="rounded-full bg-[#765637] px-7 py-3 font-bold text-white">متابعة لإتمام الطلب</Link></div></>}</div></main>
}
