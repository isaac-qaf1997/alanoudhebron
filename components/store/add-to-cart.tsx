'use client'
import { useState } from 'react'
import Link from 'next/link'
const KEY='alanoud-cart-v1'
export default function AddToCart({modelId,colors}:{modelId:number;colors:{color:string;stock:number}[]}) {
 const [color,setColor]=useState(colors[0]?.color||'')
 const [quantity,setQuantity]=useState(1)
 const [message,setMessage]=useState('')
 const stock=colors.find(v=>v.color===color)?.stock||0
 function add(){if(!color||quantity<1||quantity>stock)return;let items=[];try{items=JSON.parse(localStorage.getItem(KEY)||'[]')}catch{};const found=items.find((x:{modelId:number;color:string})=>x.modelId===modelId&&x.color===color);if(found)found.quantity=Math.min(stock,found.quantity+quantity);else items.push({modelId,color,quantity});localStorage.setItem(KEY,JSON.stringify(items));setMessage('تمت إضافة المنتج إلى السلة');}
 return <div className="mt-8 space-y-4"><label className="block text-sm font-semibold">اختاري اللون<select value={color} onChange={e=>setColor(e.target.value)} className="mt-2 w-full rounded-xl border bg-white p-3">{colors.map(v=><option key={v.color} value={v.color}>{v.color} — متوفر {v.stock}</option>)}</select></label><label className="block text-sm font-semibold">الكمية<input type="number" min={1} max={stock} value={quantity} onChange={e=>setQuantity(Math.max(1,Math.min(stock,Number(e.target.value)||1)))} className="mt-2 w-28 rounded-xl border bg-white p-3"/></label><button onClick={add} className="rounded-full bg-[#765637] px-7 py-3 font-semibold text-white">أضيفي إلى السلة</button>{message&&<p role="status" className="text-sm text-green-700">{message} · <Link className="underline" href="/cart">عرض السلة</Link></p>}</div>
}
