'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PRODUCT_CATEGORIES } from '@/lib/categories'

type Product = { id: number; name: string; category: string; price: number; imageUrl: string | null; variants: { color: string }[] }

export function ProductGrid({ products, initialCategory = '' }: { products: Product[]; initialCategory?: string }) {
  const [category, setCategory] = useState(initialCategory)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const visible = useMemo(() => {
    const filtered = products.filter((product) =>
      (!category || product.category === category) &&
      (!search.trim() || `${product.name} ${product.category} ${product.variants.map((v) => v.color).join(' ')}`.toLocaleLowerCase('ar').includes(search.trim().toLocaleLowerCase('ar'))),
    )
    if (sort === 'price-asc') return [...filtered].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') return [...filtered].sort((a, b) => b.price - a.price)
    return filtered
  }, [products, category, search, sort])

  return <div>
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#8f6a39]/70 bg-[#1b140f] p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex-1"><span className="sr-only">ابحثي عن منتج</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحثي عن ثوب أو عباية أو لون..." className="h-12 w-full rounded-xl border border-[#765b3b] bg-[#100c09] px-4 text-sm text-[#f5e5ca] placeholder:text-[#a99475] outline-none focus:border-[#e2bd80]" /></label>
        <label className="sm:w-52"><span className="sr-only">ترتيب المنتجات</span><select value={sort} onChange={(e) => setSort(e.target.value)} className="h-12 w-full rounded-xl border border-[#765b3b] bg-[#100c09] px-3 text-sm text-[#f5e5ca]"><option value="newest">الأحدث أولاً</option><option value="price-asc">السعر: من الأقل للأعلى</option><option value="price-desc">السعر: من الأعلى للأقل</option></select></label>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="تصفية حسب القسم">
        {[{ label: 'كل المنتجات', value: '' }, ...PRODUCT_CATEGORIES.map((value) => ({ label: value, value }))].map((item) => <button key={item.value || 'all'} type="button" onClick={() => setCategory(item.value)} aria-pressed={category === item.value} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${category === item.value ? 'border-[#e1bd82] bg-[#d3aa6d] text-[#1a120b]' : 'border-[#765b3b] text-[#e6d1ad] hover:bg-[#352719]'}`}>{item.label}</button>)}
      </div>
      <div className="flex items-center justify-between text-xs text-[#bca681]"><span>{visible.length} منتج</span>{category || search ? <button type="button" onClick={() => { setCategory(''); setSearch('') }} className="underline underline-offset-4">مسح التصفية</button> : <span>اختاري القطعة الأقرب لذوقكِ</span>}</div>
    </div>
    {visible.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {visible.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#8f6a39]/80 bg-[#201710] transition duration-300 hover:-translate-y-1 hover:border-[#d6b276] hover:shadow-xl hover:shadow-black/30">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#eee8de]">{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" loading="lazy" className="object-cover transition duration-700 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center text-sm text-[#9a8b77]">صورة المنتج قريباً</div>}<span className="absolute right-2 top-2 rounded-full border border-[#d6b276]/70 bg-[#17100ddd] px-2.5 py-1 text-[10px] text-[#f2d8ad]">{product.category}</span></div>
        <div className="p-3 sm:p-4"><h3 className="line-clamp-2 min-h-10 text-sm font-semibold text-[#f1dfc2]">{product.name}</h3><p className="mt-2 font-bold text-[#e2bc7e]">{product.price.toFixed(2)} ₪</p><p className="mt-1 text-[11px] text-[#c4ad8e]">{product.variants.length} ألوان متاحة</p><span className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-[#9a7546] py-2 text-xs font-semibold text-[#e9d1aa] transition group-hover:bg-[#c99b5c] group-hover:text-[#1c140c]">عرض التفاصيل</span></div>
      </Link>)}
    </div> : <div className="rounded-2xl border border-dashed border-[#8f6a39] px-5 py-14 text-center"><p className="text-lg font-semibold text-[#f1d8ae]">ما لقينا منتجات بهذا الاختيار</p><p className="mt-2 text-sm text-[#c4ad8e]">جرّبي قسمًا آخر أو غيّري كلمة البحث.</p><button onClick={() => { setCategory(''); setSearch('') }} className="mt-5 rounded-full bg-[#d0a66a] px-6 py-2.5 text-sm font-bold text-[#1c140c]">عرض كل المنتجات</button></div>}
  </div>
}
