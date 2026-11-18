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
    <div className="mb-7 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">ابحثي عن منتج</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحثي عن عباية، ثوب أو لون..." className="h-12 w-full rounded-full border border-[#9c805b]/60 bg-[#1b140f] px-5 text-sm text-[#f5e5ca] placeholder:text-[#a99475] outline-none transition focus:border-[#dfbd87] focus:ring-2 focus:ring-[#dfbd87]/15" /></label>
        <label className="sm:w-56"><span className="sr-only">ترتيب المنتجات</span><select value={sort} onChange={(e) => setSort(e.target.value)} className="h-12 w-full rounded-full border border-[#9c805b]/60 bg-[#1b140f] px-5 text-sm text-[#f5e5ca] outline-none focus:border-[#dfbd87]"><option value="newest">الأحدث أولاً</option><option value="price-asc">السعر: من الأقل للأعلى</option><option value="price-desc">السعر: من الأعلى للأقل</option></select></label>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" aria-label="تصفية حسب القسم">
        {[{ label: 'كل المنتجات', value: '' }, ...PRODUCT_CATEGORIES.map((value) => ({ label: value, value }))].map((item) => <button key={item.value || 'all'} type="button" onClick={() => setCategory(item.value)} aria-pressed={category === item.value} className={`shrink-0 border px-5 py-2.5 text-xs font-semibold transition ${category === item.value ? 'border-[#e1bd82] bg-[#d3aa6d] text-[#1a120b] shadow-md shadow-black/10' : 'border-[#765b3b] bg-[#1b140f] text-[#e6d1ad] hover:border-[#d6b276] hover:bg-[#352719]'}`}>{item.label}</button>)}
      </div>
      <div className="flex items-center justify-between border-b border-[#8f6a39]/60 pb-3 text-xs text-[#bca681]"><span>{visible.length} قطعة متاحة</span>{category || search ? <button type="button" onClick={() => { setCategory(''); setSearch('') }} className="underline underline-offset-4">مسح التصفية</button> : <span>اختاري القطعة الأقرب لذوقكِ</span>}</div>
    </div>
    {visible.length ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-3">
      {visible.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden border border-[#9a805e]/45 bg-[#f1ece3] text-[#30271d] shadow-[0_8px_24px_rgba(0,0,0,.2)] transition duration-300 hover:-translate-y-1 hover:border-[#d6b276] hover:shadow-xl hover:shadow-black/25">
        <div className="relative aspect-[3/4] overflow-hidden bg-[#e8e1d6]">{product.imageUrl ? <Image src={product.imageUrl} alt={product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw" loading="lazy" className="object-cover transition duration-700 group-hover:scale-[1.045]" /> : <div className="flex h-full items-center justify-center text-sm text-[#9a8b77]">صورة المنتج قريباً</div>}<span className="absolute right-2 top-2 border border-white/70 bg-[#fffaf0]/90 px-3 py-1.5 text-[10px] font-semibold text-[#57452e] shadow-sm">{product.category}</span></div>
        <div className="p-3 sm:p-4"><h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-6 text-[#30271d]">{product.name}</h3><div className="mt-2 flex items-center justify-between gap-2"><p className="font-bold text-[#8b632f]">{product.price.toFixed(2)} ₪</p><span className="text-[10px] text-[#837766]">{product.variants.length} ألوان</span></div><span className="mt-3 inline-flex w-full items-center justify-center bg-[#2b1d12] py-2.5 text-xs font-semibold text-[#f3dfbd] transition group-hover:bg-[#b58a50] group-hover:text-[#21170e]">أضيفي للسلة ←</span></div>
      </Link>)}
    </div> : <div className="border border-dashed border-[#8f6a39] px-5 py-14 text-center"><p className="text-lg font-semibold text-[#f1d8ae]">ما لقينا منتجات بهذا الاختيار</p><p className="mt-2 text-sm text-[#c4ad8e]">جرّبي قسماً آخر أو غيّري كلمة البحث.</p><button type="button" onClick={() => { setCategory(''); setSearch('') }} className="mt-5 bg-[#d0a66a] px-6 py-2.5 text-sm font-bold text-[#1c140c]">عرض كل المنتجات</button></div>}
  </div>
}
