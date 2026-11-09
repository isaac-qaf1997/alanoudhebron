import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getStoreProducts } from '@/lib/queries'
import { cloudinaryImageUrl } from '@/lib/images'
import AddToCart from '@/components/store/add-to-cart'

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId <= 0) notFound()
  const [product] = await getStoreProducts(productId)
  if (!product) notFound()
  const inStock = product.colors.filter((variant) => variant.sizes.length
    ? variant.sizes.some((size) => size.stock === null || size.stock > 0)
    : variant.stock === null || variant.stock > 0)
  const image = cloudinaryImageUrl(product.imageUrl || inStock.find((variant) => variant.imageUrl)?.imageUrl, 1200)
  const gallery = [
    ...(product.galleryUrls ?? []),
    ...inStock.flatMap((variant) => [variant.imageUrl, ...(variant.galleryUrls ?? [])].filter((url): url is string => Boolean(url))),
  ].map((url) => cloudinaryImageUrl(url, 900)).filter((url, index, all): url is string => Boolean(url) && all.indexOf(url) === index)
  if (!inStock.length) notFound()
  return <main dir="rtl" className="min-h-dvh bg-[#100b08] text-[#f3dfbd]">
    <header className="sticky top-0 z-20 border-b border-[#8f6a39]/70 bg-[#17110d]/95 px-5 py-4 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/shop" className="text-xl font-bold text-[#f1d8ae]">العنود <span className="text-xs font-normal text-[#c9a36b]">للزي الشرعي · الخليل</span></Link><Link href="/cart" className="rounded-full border border-[#8f6a39] px-4 py-2 text-sm text-[#f1d8ae]">سلة التسوق</Link></div></header>
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6"><nav className="text-xs text-[#bda47f]"><Link href="/shop" className="hover:text-[#f1d8ae]">الرئيسية</Link><span className="mx-2">/</span><span>{product.category}</span><span className="mx-2">/</span><span className="text-[#f1d8ae]">{product.name}</span></nav>
      <section className="mt-6 grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-12">
        <div className="space-y-3"><div className="aspect-[4/5] overflow-hidden rounded-3xl border border-[#8f6a39]/70 bg-[#211811]">{image ? <img src={image} alt={product.name} fetchPriority="high" decoding="async" className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center text-[#bca681]">صورة المنتج قريباً</div>}</div>
          {gallery.length ? <div className="grid grid-cols-4 gap-2">{gallery.slice(0,8).map((url,index)=><img key={url+index} src={url} alt={`صورة إضافية ${product.name} ${index+1}`} loading="lazy" className="aspect-square w-full rounded-xl border border-[#8f6a39]/60 object-cover"/>)}</div> : null}
        </div>
        <div className="lg:sticky lg:top-28 lg:self-start"><span className="inline-flex rounded-full border border-[#b48b52] bg-[#211811] px-3 py-1 text-xs text-[#e2bc7e]">{product.category}</span><p className="mt-4 text-xs tracking-[.18em] text-[#a17b48]">AL ANOUD · HEBRON</p><h1 className="mt-2 text-3xl font-bold leading-tight text-[#f8e7c9] sm:text-4xl">{product.name}</h1><p className="mt-5 text-2xl font-bold text-[#e2bc7e]">{product.price.toFixed(2)} ₪</p><p className="mt-2 text-sm leading-7 text-[#c4ad8e]">اختاري اللون والمقاس المتاحين، ثم أضيفي القطعة إلى سلة التسوق لإكمال طلبكِ.</p>
          <div className="my-6 h-px bg-[#8f6a39]/60"/><AddToCart modelId={product.id} colors={inStock.map((variant) => ({ color: variant.color, stock: variant.stock, imageUrl: cloudinaryImageUrl(variant.imageUrl, 900), galleryUrls: (variant.galleryUrls ?? []).map((url) => cloudinaryImageUrl(url, 900)).filter((url): url is string => Boolean(url)), sizes: variant.sizes.map((size) => ({ size: size.size, stock: size.stock })) }))}/>
          <div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-xl border border-[#8f6a39]/60 bg-[#1b140f] p-3"><p className="text-xs text-[#bca681]">مدة التوصيل</p><p className="mt-1 text-sm font-semibold text-[#f1d8ae]">2–5 أيام عمل عادةً</p></div><div className="rounded-xl border border-[#8f6a39]/60 bg-[#1b140f] p-3"><p className="text-xs text-[#bca681]">طرق الدفع</p><p className="mt-1 text-sm font-semibold text-[#f1d8ae]">عند الاستلام أو مسبقًا</p></div></div>
          <p className="mt-4 text-xs leading-6 text-[#bca681]">لأي استفسار عن القماش أو اللون أو المقاس، تواصلي معنا عبر <a href="https://wa.me/970569388780" className="font-semibold text-[#e2bc7e] underline underline-offset-4">واتساب المتجر</a>.</p>
        </div>
      </section>
    </div>
  </main>
}
