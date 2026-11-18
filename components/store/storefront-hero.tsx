'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const slides = [
  {
    image: 'https://res.cloudinary.com/genxurzp/image/upload/v1793931422/alanoud/inventory/image_dbfca2b9-2439-4dc2-8dd9-b0829f8d2b2c.jpg',
    alt: 'إطلالة من تشكيلة العنود',
    eyebrow: 'من الخليل إلى كل فلسطين',
    title: 'أناقتكِ من تراثنا',
    description: 'تفاصيل فلسطينية أصيلة، ولمسات أنثوية تليق بكِ',
    action: 'اكتشفي التشكيلة',
  },
  {
    image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794062248/alanoud/inventory/image_83fd64b8-73f5-480d-a29f-12b12e35f2ad.jpg',
    alt: 'تصميم مطرز من متجر العنود',
    eyebrow: 'حكاية تطريز وهوية',
    title: 'جمالكِ في التفاصيل',
    description: 'أثواب وفساتين وقطع مختارة بروح التراث الفلسطيني',
    action: 'تسوّقي الآن',
  },
  {
    image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794180954/alanoud/inventory/image_3f57d616-da2c-447a-ba58-2537da38432a.webp',
    alt: 'تشكيلة أزياء من العنود',
    eyebrow: 'اختاري ما يشبهكِ',
    title: 'أناقة لكل حكاية',
    description: 'تشكيلات مميزة تجمع بين الأصالة والأناقة العصرية',
    action: 'شاهدي المنتجات',
  },
]

const categories = [
  { title: 'عبايات', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179205/alanoud/inventory/image_a251fbcc-36f7-4779-a9f2-19fb2641076e.webp' },
  { title: 'أثواب', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794180954/alanoud/inventory/image_3f57d616-da2c-447a-ba58-2537da38432a.webp' },
  { title: 'أثواب بناتي', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179072/alanoud/inventory/image_7a846c8a-2c20-4a21-8bce-2843d704e4f4.webp' },
  { title: 'فستان تطريز', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794062248/alanoud/inventory/image_83fd64b8-73f5-480d-a29f-12b12e35f2ad.jpg' },
  { title: 'شالات تطريز', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1793931422/alanoud/inventory/image_dbfca2b9-2439-4dc2-8dd9-b0829f8d2b2c.jpg' },
  { title: 'جاكيت تطريز', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179205/alanoud/inventory/image_a251fbcc-36f7-4779-a9f2-19fb2641076e.webp' },
]

export function StorefrontHero() {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <section id="collections" className="mx-auto max-w-[1500px] px-3 pb-8 pt-4 sm:px-6 sm:pt-6">
      <div className="relative isolate overflow-hidden rounded-[1.5rem] border border-[#b99461]/70 bg-[#17110d] shadow-[0_28px_90px_rgba(0,0,0,.42)] sm:rounded-[2rem]">
        <div className="grid min-h-[610px] md:min-h-[660px] md:grid-cols-[1.08fr_.92fr]">
          <div className="relative min-h-[390px] overflow-hidden md:min-h-[660px]">
            {slides.map((slide, index) => (
              <div key={slide.image} aria-hidden={index !== activeSlide} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === activeSlide ? 'z-10 opacity-100' : 'z-0 opacity-0'}`}>
                <Image src={slide.image} alt={slide.alt} fill priority={index === 0} sizes="(max-width: 768px) 100vw, 58vw" className="object-cover object-[center_24%]" />
              </div>
            ))}
            <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#100b08]/65 via-transparent to-[#100b08]/5 md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-[#100b08]/10" />
            <div className="absolute bottom-5 left-5 z-30 rounded-full border border-[#e2c28d]/70 bg-[#17100bd9] px-4 py-2 text-[11px] tracking-wide text-[#f4dfb8] backdrop-blur-sm sm:bottom-8 sm:left-8 sm:text-xs">تطريز فلسطيني أصيل ✦</div>
          </div>

          <div className="relative flex min-h-[280px] flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,#3a2a1c_0%,#17110d_55%,#100b08_100%)] px-6 py-10 text-center sm:px-10 md:min-h-[660px]">
            <div className="pointer-events-none absolute inset-5 rounded-[1.25rem] border border-[#b99461]/20 sm:inset-8" />
            <div className="relative z-10 max-w-xl">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#c7a16a]/70 bg-[#21170f] text-2xl text-[#e2c18d] shadow-[0_0_35px_rgba(205,163,94,.16)]">✥</div>
              <p className="text-[10px] font-semibold tracking-[.24em] text-[#c49b61] sm:text-xs">AL ANOUD · HEBRON</p>
              <p className="mt-5 text-xs font-medium text-[#d9bd91] sm:text-sm">{slides[activeSlide].eyebrow}</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-[#f7e8ce] sm:text-4xl lg:text-[3.25rem]">{slides[activeSlide].title}</h1>
              <div className="mx-auto mt-5 flex max-w-xs items-center gap-3 text-[#c69d63]">
                <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c69d63]" />
                <span className="text-lg">❖</span>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c69d63]" />
              </div>
              <p className="mx-auto mt-5 max-w-sm text-sm leading-8 text-[#e4d1b4] sm:text-base">{slides[activeSlide].description}</p>
              <Link href="/shop#products" className="mt-7 inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[#f1d29b] bg-gradient-to-b from-[#f5dfb6] to-[#c99b5c] px-8 text-sm font-bold text-[#1c140c] shadow-[0_5px_0_#8e642f,0_12px_28px_rgba(0,0,0,.3)] transition hover:-translate-y-0.5 sm:px-10 sm:text-base">
                {slides[activeSlide].action}<span aria-hidden="true">←</span>
              </Link>
              <div className="mt-8 flex items-center justify-center gap-2.5" aria-label="اختيار صورة الواجهة">
                {slides.map((slide, index) => (
                  <button key={slide.image} type="button" onClick={() => setActiveSlide(index)} aria-label={`عرض الصورة ${index + 1}`} aria-pressed={activeSlide === index} className={`h-2 rounded-full transition-all duration-300 ${activeSlide === index ? 'w-8 bg-[#e5c18a]' : 'w-2 bg-[#806342] hover:bg-[#c49b61]'}`} />
                ))}
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full border border-[#c39a5d]/10" />
            <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full border border-[#c39a5d]/10" />
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[.22em] text-[#a17b48]">DISCOVER AL ANOUD</p>
          <h2 className="mt-2 text-xl font-semibold text-[#f1d8ae] sm:text-2xl">تصفّحي حسب القسم</h2>
        </div>
        <Link href="/shop#products" className="shrink-0 text-xs text-[#d5b27b] underline underline-offset-4">كل المنتجات</Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {categories.map((category) => (
          <Link key={category.title} href={`/shop?category=${encodeURIComponent(category.title)}`} className="group relative isolate min-h-[190px] overflow-hidden rounded-2xl border border-[#a98554]/45 bg-[#251b12] shadow-[0_10px_30px_rgba(0,0,0,.24)] sm:min-h-[230px]">
            <Image src={category.image} alt={category.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw" className="object-cover transition duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100b08]/95 via-[#100b08]/10 to-transparent" />
            <span className="absolute inset-x-2 bottom-3 rounded-full border border-[#e6c58f]/70 bg-[#17100bd9] px-2 py-2 text-center text-xs font-bold text-[#f4dfbd] backdrop-blur-sm transition group-hover:bg-[#d2aa70] group-hover:text-[#1c140c] sm:text-sm">{category.title}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-[#8f6a39]/50 bg-[#17110d] p-4 text-center sm:grid-cols-3 sm:p-5">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#f1d5a5]"><span className="text-xl text-[#d9b77d]">♧</span> الدفع نقدًا عند الاستلام</div>
        <div className="flex items-center justify-center gap-2 text-sm text-[#d9c5a5]"><span className="text-xl text-[#d9b77d]">✦</span> توصيل لمختلف المناطق</div>
        <div className="flex items-center justify-center gap-2 text-sm text-[#d9c5a5]"><span className="text-xl text-[#d9b77d]">♡</span> أناقة من روح التراث</div>
      </div>
    </section>
  )
}
