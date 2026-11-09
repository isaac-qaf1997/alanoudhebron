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
  const cleaned: Line[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const line = raw as Record<string, unknown>, modelId = Number(line.modelId), quantity = Number(line.quantity)
    const color = typeof line.color === 'string' ? line.color.trim().slice(0, 60) : ''
    const size = typeof line.size === 'string' ? line.size.trim().slice(0, 40) : ''
    const product = products.find((p) => p.id === modelId), variant = product?.colors.find((v) => v.color === color)
    const sizeVariant = variant?.sizes.find((v) => v.size === size)
    if (!product || !variant || !Number.isSafeInteger(quantity) || quantity < 1) continue
    if (variant.sizes.length && !sizeVariant) continue
    if (!variant.sizes.length && size) continue
    const stock = (variant.sizes.length ? sizeVariant?.stock : variant.stock) ?? 500
    if (stock < 1) continue
    const existing = cleaned.find((x) => x.modelId === modelId && x.color === color && (x.size || '') === size)
    if (existing) existing.quantity = Math.min(stock, existing.quantity + quantity)
    else cleaned.push({ modelId, color, size: size || undefined, quantity: Math.min(stock, quantity) })
  }
  return cleaned
}

export default function CartView({ products }: { products: Product[] }) {
  const [items, setItems] = useState<Line[]>([])
  useEffect(() => { try { setItems(cleanCart(JSON.parse(localStorage.getItem(KEY) || '[]'), products)) } catch { setItems([]); localStorage.removeItem(KEY) } }, [products])
  function save(next: Line[]) { const safe = cleanCart(next, products); setItems(safe); localStorage.setItem(KEY, JSON.stringify(safe)) }
  const total = items.reduce((sum, line) => sum + (products.find((p) => p.id === line.modelId)?.price || 0) * line.quantity, 0)
  return <main dir="rtl" className="min-h-dvh bg-[#100b08] px-4 py-8 text-[#f3dfbd] sm:px-6 sm:py-10"><div className="mx-auto max-w-4xl">
    <header className="flex items-center justify-between border-b border-[#8f6a39]/70 pb-5"><Link href="/shop" className="text-xl font-bold text-[#f1d8ae]">العنود <span className="text-xs font-normal text-[#c9a36b]">للزي الشرعي</span></Link><Link href="/shop" className="text-sm text-[#d8bd91] underline underline-offset-4">متابعة التسوق</Link></header>
    <div className="my-8"><p className="text-xs tracking-[.18em] text-[#a17b48]">YOUR SELECTION</p><h1 className="mt-2 text-3xl font-bold text-[#f8e7c9]">سلة التسوق</h1><p className="mt-2 text-sm text-[#c4ad8e]">راجعي اختياراتكِ قبل إتمام الطلب.</p></div>
    {!items.length ? <div className="rounded-2xl border border-[#8f6a39]/70 bg-[#1b140f] p-10 text-center"><p className="text-lg font-semibold">سلتك فارغة حاليًا</p><p className="mt-2 text-sm text-[#c4ad8e]">اكتشفي تشكيلات العنود واختاري القطع التي تعجبكِ.</p><Link href="/shop" className="mt-5 inline-flex rounded-full bg-gradient-to-b from-[#f5dfb6] to-[#c99b5c] px-7 py-3 font-bold text-[#1c140c]">تصفحي المنتجات</Link></div> : <>
      <div className="space-y-3">{items.map((line, index) => { const product = products.find((p) => p.id === line.modelId), variant = product?.colors.find((v) => v.color === line.color), size = variant?.sizes.find((s) => s.size === line.size), max = (variant?.sizes.length ? size?.stock : variant?.stock) ?? 500; return <article key={line.modelId + '-' + line.color + '-' + (line.size || '')} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#8f6a39]/60 bg-[#1b140f] p-4 sm:p-5"><div className="min-w-0"><b className="text-[#f3dfbd]">{product?.name || 'منتج'}</b><p className="mt-1 text-sm text-[#c4ad8e]">اللون: {line.color}{line.size ? ' · المقاس: ' + line.size : ''}</p><p className="mt-1 text-sm font-semibold text-[#e2bc7e]">{(product?.price || 0).toFixed(2)} ₪</p></div><div className="flex items-center gap-3"><button aria-label="تقليل الكمية" onClick={() => save(items.map((item, i) => i === index ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0))} className="size-9 rounded-full border border-[#765b3b] text-lg">−</button><span className="min-w-5 text-center">{line.quantity}</span><button aria-label="زيادة الكمية" disabled={line.quantity >= max} onClick={() => save(items.map((item, i) => i === index ? { ...item, quantity: Math.min(max, item.quantity + 1) } : item))} className="size-9 rounded-full border border-[#765b3b] text-lg disabled:opacity-40">+</button><button onClick={() => save(items.filter((_, i) => i !== index))} className="mr-1 text-sm text-red-300 underline">حذف</button></div></article> })}</div>
      <section className="mt-6 rounded-2xl border border-[#8f6a39]/70 bg-[#1b140f] p-5 sm:p-6"><div className="flex items-center justify-between"><span className="text-[#c4ad8e]">مجموع المنتجات</span><b className="text-xl text-[#e2bc7e]">{total.toFixed(2)} ₪</b></div><p className="mt-2 text-xs text-[#bca681]">تُضاف رسوم التوصيل بعد اختيار منطقة التوصيل في الخطوة التالية.</p><Link href="/checkout" className="mt-5 flex min-h-13 items-center justify-center rounded-full border border-[#f1d29b] bg-gradient-to-b from-[#f5dfb6] to-[#c99b5c] px-7 py-3 font-bold text-[#1c140c]">متابعة لإتمام الطلب</Link></section>
    </>}
  </div></main>
}
