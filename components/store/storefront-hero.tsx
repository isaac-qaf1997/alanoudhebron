'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const slides = [
  { image: 'https://res.cloudinary.com/genxurzp/image/upload/v1793931422/alanoud/inventory/image_dbfca2b9-2439-4dc2-8dd9-b0829f8d2b2c.jpg', alt: 'إطلالة مطرزة من تشكيلة العنود', title: 'أناقة تحكي حكاية', description: 'من التراث .. نستلهم الجمال' },
  { image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794062248/alanoud/inventory/image_83fd64b8-73f5-480d-a29f-12b12e35f2ad.jpg', alt: 'تصميم مطرز من متجر العنود', title: 'جمالكِ في التفاصيل', description: 'من التراث .. نستلهم الجمال' },
  { image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794180954/alanoud/inventory/image_3f57d616-da2c-447a-ba58-2537da38432a.webp', alt: 'تشكيلة أزياء من العنود', title: 'أناقة لكل حكاية', description: 'من التراث .. نستلهم الجمال' },
]
const categories = [
  { title: 'ثوب تطريز', value: 'أثواب', image: slides[1].image },
  { title: 'ثوب بناتي', value: 'أثواب بناتي', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179072/alanoud/inventory/image_7a846c8a-2c20-4a21-8bce-2843d704e4f4.webp' },
  { title: 'عبايات', value: 'عبايات', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179205/alanoud/inventory/image_a251fbcc-36f7-4779-a9f2-19fb2641076e.webp' },
  { title: 'جاكيت تطريز', value: 'جاكيت تطريز', image: slides[2].image },
  { title: 'شالات تطريز', value: 'شالات تطريز', image: slides[0].image },
  { title: 'فستان تطريز', value: 'فستان تطريز', image: 'https://res.cloudinary.com/genxurzp/image/upload/v1794179072/alanoud/inventory/image_7a846c8a-2c20-4a21-8bce-2843d704e4f4.webp' },
]

export function StorefrontHero() {
  const [activeSlide, setActiveSlide] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % slides.length), 6500)
    return () => window.clearInterval(timer)
  }, [])

  return <section id="collections" className="mx-auto max-w-[1500px] bg-[#f7f1e9] px-3 pb-5 pt-3 sm:px-6 sm:pt-5">
    <div className="relative isolate min-h-[430px] overflow-hidden rounded-[3px] bg-[#251810] shadow-[0_14px_35px_rgba(55,37,22,.18)] sm:min-h-[550px]">
      {slides.map((slide, index) => <div key={slide.image} aria-hidden={index !== activeSlide} className={`absolute inset-0 transition-opacity duration-1000 ${index === activeSlide ? 'opacity-100' : 'opacity-0'}`}>
        <Image src={slide.image} alt={slide.alt} fill priority={index === 0} sizes="(max-width: 768px) 100vw, 94vw" className="object-cover object-[68%_center]" />
      </div>)}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,14,9,.08)_0%,rgba(27,17,11,.35)_45%,rgba(25,16,10,.78)_100%)]" />
      <div className="relative z-10 flex min-h-[430px] items-center justify-start px-6 py-12 sm:min-h-[550px] sm:px-14 lg:px-20">
        <div className="max-w-[460px] text-center text-[#f5e4ce] sm:text-right">
          <h1 className="text-4xl font-semibold leading-[1.45] drop-shadow-[0_3px_16px_rgba(0,0,0,.65)] sm:text-5xl lg:text-6xl">{slides[activeSlide].title}</h1>
          <p className="mt-4 text-sm text-[#f0d8bb] sm:text-base">{slides[activeSlide].description}</p>
          <Link href="/shop#products" className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#e7c7a4] px-8 text-sm font-bold text-[#39271a] shadow-md transition hover:-translate-y-0.5 hover:bg-[#f0d6b8]">تسوّقي الآن <span aria-hidden="true">←</span></Link>
          <div className="mt-7 flex items-center justify-center gap-2 sm:justify-start" aria-label="اختيار صورة الواجهة">
            {slides.map((slide, index) => <button key={slide.image} type="button" onClick={() => setActiveSlide(index)} aria-label={`عرض الصورة ${index + 1}`} aria-pressed={activeSlide === index} className={`h-2 rounded-full transition-all ${activeSlide === index ? 'w-7 bg-[#f0d1ae]' : 'w-2 bg-[#c4a587]/70'}`} />)}
          </div>
        </div>
      </div>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {categories.map((category) => <Link key={category.title} href={`/shop?category=${encodeURIComponent(category.value)}`} className="group relative isolate aspect-[1/1.02] overflow-hidden rounded-xl bg-[#e7dbcd] shadow-[0_4px_14px_rgba(54,37,23,.12)]">
        <Image src={category.image} alt={category.title} fill sizes="(max-width: 640px) 50vw, 33vw" className={`object-cover transition duration-700 group-hover:scale-105 ${(category.title === "ثوب تطريز" || category.title === "جاكيت تطريز") ? "-scale-x-100" : ""}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#160e09]/85 via-transparent to-transparent" />
        <span className="absolute inset-x-2 bottom-3 text-center text-xs font-bold text-white drop-shadow sm:text-sm">{category.title} ←</span>
      </Link>)}
    </div>
  </section>
}
