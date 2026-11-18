'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const slides = [
  { image: 'https://res.cloudinary.com/genxurzp/image/upload/v1793931422/alanoud/inventory/image_dbfca2b9-2439-4dc2-8dd9-b0829f8d2b2c.jpg', alt: 'إطلالة مطرزة من تشكيلة العنود', eyebrow: 'من التراث ... نستمد الجمال', title: 'أناقة تحكي حكاية', description: 'تطريز فلسطيني أصيل وتفاصيل صنعت لتبقى', action: 'تسوّقي الآن' },
  { image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794062248/alanoud/inventory/image_83fd64b8-73f5-480d-a29f-12b12e35f2ad.jpg', alt: 'تصميم مطرز من متجر العنود', eyebrow: 'حكاية تطريز وهوية', title: 'جمالكِ في التفاصيل', description: 'أثواب وفساتين وقطع مختارة بروح التراث الفلسطيني', action: 'اكتشفي التشكيلة' },
  { image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794180954/alanoud/inventory/image_3f57d616-da2c-447a-ba58-2537da38432a.webp', alt: 'تشكيلة أزياء من العنود', eyebrow: 'اختاري ما يشبهكِ', title: 'أناقة لكل حكاية', description: 'تشكيلات مميزة تجمع بين الأصالة والأناقة العصرية', action: 'شاهدي المنتجات' },
]
const categories = [
  { title: 'ثوب تطريز', image: slides[1].image },
  { title: 'ثوب بناتي', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179072/alanoud/inventory/image_7a846c8a-2c20-4a21-8bce-2843d704e4f4.webp' },
  { title: 'عبايات', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179205/alanoud/inventory/image_a251fbcc-36f7-4779-a9f2-19fb2641076e.webp' },
  { title: 'فستان تطريز', image: slides[2].image },
  { title: 'شالات تطريز', image: slides[0].image },
  { title: 'جاكيت تطريز', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179205/alanoud/inventory/image_a251fbcc-36f7-4779-a9f2-19fb2641076e.webp' },
]

export function StorefrontHero() {
  const [activeSlide, setActiveSlide] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 6500)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section id="collections" className="mx-auto max-w-[1500px] px-3 pb-7 pt-3 sm:px-6 sm:pt-5">
      <div className="relative isolate min-h-[490px] overflow-hidden border border-[#9a7446]/80 bg-[#100b08] shadow-[0_24px_75px_rgba(0,0,0,.55)] sm:min-h-[560px] lg:min-h-[590px]">
        {slides.map((slide, index) => <div key={slide.image} aria-hidden={index !== activeSlide} className={`absolute inset-0 transition-opacity duration-1000 ${index === activeSlide ? 'z-0 opacity-100' : 'z-0 opacity-0'}`}>
          <Image src={slide.image} alt={slide.alt} fill priority={index === 0} sizes="(max-width: 768px) 100vw, 94vw" className="object-cover object-[68%_center] sm:object-[70%_center]" />
        </div>)}
        <div className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,rgba(12,8,5,.97)_0%,rgba(18,12,8,.88)_30%,rgba(18,12,8,.42)_57%,rgba(10,7,5,.08)_100%)]" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-[#100b08]/55 via-transparent to-[#100b08]/20" />
        <div className="pointer-events-none absolute inset-3 z-[2] border border-[#d2ae78]/35 sm:inset-5" />
        <div className="pointer-events-none absolute inset-5 z-[2] border border-[#d2ae78]/15 sm:inset-8" />
        <div className="relative z-10 flex min-h-[490px] items-center px-7 py-14 sm:min-h-[560px] sm:px-14 lg:min-h-[590px] lg:px-20">
          <div className="max-w-[510px] text-center sm:text-right">
            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#c7a16a]/75 bg-[#1b120bd9] text-2xl text-[#e4c18b] shadow-[0_0_35px_rgba(205,163,94,.25)]">✥</div>
            <p className="text-[10px] font-semibold tracking-[.3em] text-[#d2ad75] sm:text-xs">AL ANOUD · HEBRON</p>
            <p className="mt-5 text-sm font-medium text-[#e5c99d]">{slides[activeSlide].eyebrow}</p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.45] text-[#fff0d7] drop-shadow-[0_3px_18px_rgba(0,0,0,.65)] sm:text-5xl lg:text-6xl">{slides[activeSlide].title}</h1>
            <div className="mt-5 flex max-w-sm items-center gap-3 text-[#d5ae75]"><span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#d5ae75]" /><span className="text-xl">❖</span><span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#d5ae75]" /></div>
            <p className="mt-5 max-w-sm text-sm leading-8 text-[#f0dfc5] drop-shadow sm:text-base">{slides[activeSlide].description}</p>
            <Link href="/shop#products" className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 border border-[#f3d9ad] bg-gradient-to-b from-[#f6dfb8] to-[#c99a5d] px-9 text-sm font-bold text-[#21160d] shadow-[0_4px_0_#8e642f,0_12px_28px_rgba(0,0,0,.35)] transition hover:-translate-y-0.5 sm:text-base">{slides[activeSlide].action}<span aria-hidden="true">←</span></Link>
            <div className="mt-8 flex items-center justify-center gap-2.5 sm:justify-start" aria-label="اختيار صورة الواجهة">
              {slides.map((slide, index) => <button key={slide.image} type="button" onClick={() => setActiveSlide(index)} aria-label={`عرض الصورة ${index + 1}`} aria-pressed={activeSlide === index} className={`h-2 rounded-full transition-all duration-300 ${activeSlide === index ? 'w-8 bg-[#f0cf9b]' : 'w-2 bg-[#8e704b] hover:bg-[#d1a66a]'}`} />)}
            </div>
          </div>
        </div>
        <span className="absolute bottom-8 left-8 z-10 hidden border border-[#d8b77f]/65 bg-[#130d09]/80 px-4 py-2 text-xs tracking-wider text-[#f0d7ad] backdrop-blur-sm sm:inline-flex">✦ تطريز فلسطيني أصيل</span>
      </div>
      <div className="mt-8 flex items-end justify-between gap-4 border-b border-[#8f6a39]/60 pb-3">
        <div><p className="text-[10px] font-semibold tracking-[.22em] text-[#a17b48]">DISCOVER AL ANOUD</p><h2 className="mt-2 text-xl font-semibold text-[#f1d8ae] sm:text-2xl">تسوّقي حسب القسم</h2></div>
        <Link href="/shop#products" className="shrink-0 text-xs text-[#d5b27b] underline underline-offset-4">كل المنتجات ←</Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {categories.map((category) => <Link key={category.title} href={`/shop?category=${encodeURIComponent(category.title === 'ثوب تطريز' ? 'أثواب' : category.title === 'ثوب بناتي' ? 'أثواب بناتي' : category.title)}`} className="group relative isolate min-h-[175px] overflow-hidden border border-[#a98554]/45 bg-[#251b12] shadow-[0_10px_30px_rgba(0,0,0,.3)] sm:min-h-[225px]">
          <Image src={category.image} alt={category.title} fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover transition duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100b08]/95 via-[#100b08]/10 to-transparent" />
          <span className="absolute inset-x-2 bottom-3 border border-[#e6c58f]/70 bg-[#17100bd9] px-2 py-2 text-center text-xs font-bold text-[#f4dfbd] backdrop-blur-sm transition group-hover:bg-[#d2aa70] group-hover:text-[#1c140c] sm:text-sm">{category.title} ←</span>
        </Link>)}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 border border-[#8f6a39]/50 bg-[#17110d] p-4 text-center sm:grid-cols-3 sm:p-5">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#f1d5a5]"><span className="text-xl text-[#d9b77d]">♧</span> الدفع نقدًا عند الاستلام</div>
        <div className="flex items-center justify-center gap-2 text-sm text-[#d9c5a5]"><span className="text-xl text-[#d9b77d]">✦</span> توصيل لمختلف المناطق</div>
        <div className="flex items-center justify-center gap-2 text-sm text-[#d9c5a5]"><span className="text-xl text-[#d9b77d]">♡</span> أناقة من روح التراث</div>
      </div>
    </section>
  )
}
