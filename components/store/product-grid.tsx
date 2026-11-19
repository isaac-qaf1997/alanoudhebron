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
    <div className="mb-6 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">ابحثي عن منتج</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحثي عن عباية، ثوب أو لون..." className="h-11 w-full rounded-full border border-[#dfd1c1] bg-white px-5 text-sm text-[#433326] placeholder:text-[#a99485] outline-none transition focus:border-[#b28b61] focus:ring-2 focus:ring-[#b28b61]/15" /></label>
        <label className="sm:w-56"><span className="sr-only">ترتيب المنتجات</span><select value={sort} onChange={(e) => setSort(e.target.value)} className="h-11 w-full rounded-full border border-[#dfd1c1] bg-white px-5 text-sm text-[#433326] outline-none focus:border-[#b28b61]"><option value="newest">الأحدث أولاً</option><option value="price-asc">السعر: من الأقل للأعلى</option><option value="price-desc">السعر: من الأعلى للأقل</option></select></label>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" aria-label="تصفية حسب القسم">
        {[{ label: 'كل المنتجات', value: '' }, ...PRODUCT_CATEGORIES.map((value) => ({ label: value, value }))].map((item) => <button key={item.value || 'all'} type="button" onClick={() => setCategory(item.value)} aria-pressed={category === item.value} className={`shrink-0 rounded-full border px-5 py-2.5 text-xs font-semibold transition ${category === item.value ? 'border-[#b28b61] bg-[#dfc5a7] text-[#342519] shadow-sm' : 'border-[#e0d4c6] bg-white text-[#725e4c] hover:border-[#b28b61]'}`}>{item.label}</button>)}
      </div>
      <div className="flex items-center justify-between border-b border-[#dfd2c3] pb-3 text-xs text-[#88745f]"><span>{visible.length} قطعة متاحة</span>{category || search ? <button type="button" onClick={() => { setCategory(''); setSearch('') }} className="underline underline-offset-4">مسح التصفية</button> : <span>اختاري القطعة الأقرب لذوقكِ</span>}</div>
    </div>
    {visible.length ? <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-3 sm:gap-5 lg:grid-cols-3">
      {visible.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden rounded-xl border border-[#e2d6c9] bg-[#fffaf4] text-[#30271d] shadow-[0_4px_15px_rgba(72,49,28,.09)] transition duration-300 hover:-translate-y-1 hover:border-[#c6a27a] hover:shadow-lg">
        <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl bg-[#e8e1d6]">{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 33vw, (max-width: 1024px) 33vw, 33vw" loading="lazy" className="object-cover transition duration-700 group-hover:scale-[1.045]" /> : <div className="flex h-full items-center justify-center text-sm text-[#9a8b77]">صورة المنتج قريباً</div>}<span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-[#fffaf0]/95 text-base text-[#513c2c] shadow-sm sm:left-2 sm:top-2 sm:size-7" aria-hidden="true">♡</span></div>
        <div className="p-2 sm:p-4"><h3 className="line-clamp-2 min-h-10 text-[11px] font-bold leading-5 text-[#30271d] sm:text-sm sm:leading-6">{product.name}</h3><div className="mt-2 flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#775333] sm:text-sm">{product.price.toFixed(2)} ₪</p></div><span className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-[#e6c9aa] py-2 text-[10px] font-semibold text-[#3d2b1e] transition group-hover:bg-[#d9b58d] sm:mt-3 sm:py-2.5 sm:text-xs">أضيفي للسلة</span></div>
      </Link>)}
    </div> : <div className="border border-dashed border-[#d7c8b7] px-5 py-14 text-center"><p className="text-lg font-semibold text-[#4b392b]">ما لقينا منتجات بهذا الاختيار</p><p className="mt-2 text-sm text-[#88745f]">جرّبي قسماً آخر أو غيّري كلمة البحث.</p><button type="button" onClick={() => { setCategory(''); setSearch('') }} className="mt-5 rounded-full bg-[#dfc09a] px-6 py-2.5 text-sm font-bold text-[#342317]">عرض كل المنتجات</button></div>}
  </div>
}
