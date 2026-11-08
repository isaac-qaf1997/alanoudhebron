import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth/session'
import { getStoreProducts } from '@/lib/queries'
import { cloudinaryImageUrl } from '@/lib/images'

export const metadata = {
  title: 'العنود للزي شرعي | أثواب وعبايات وفساتين تطريز',
  description: 'العنود للزي شرعي من الخليل: أثواب فلسطينية مطرزة، فساتين تطريز، عبايات ودشاديش.',
}

const socialLinks = [
  { href: 'https://www.facebook.com/Alanoudhebron/', label: 'فيسبوك', mark: 'f' },
  { href: 'https://www.instagram.com/alanoudhebron/', label: 'إنستغرام', mark: '◎' },
  { href: 'https://wa.me/970569388780', label: 'واتساب', mark: 'واتساب' },
]

function BrandMark() {
  return (
    <span className="mx-auto block h-20 w-20 overflow-hidden rounded-full border border-[#c6a36d] bg-black shadow-[0_0_0_5px_rgba(198,163,109,.16)] sm:h-24 sm:w-24" aria-label="شعار العنود">
      <span className="block h-full w-full" style={{ backgroundImage: "url('/alanoud-storefront-grid.webp')", backgroundSize: "300% 200%", backgroundPosition: "0% 0%" }} />
    </span>
  )
}

function SpritePhoto({ cell, className = "", label }: { cell: number; className?: string; label: string }) {
  const positions = ["0% 0%", "50% 0%", "100% 0%", "0% 100%", "50% 100%", "100% 100%"]
  return <div role="img" aria-label={label} className={className} style={{ backgroundImage: "url('/alanoud-storefront-grid.webp')", backgroundSize: "300% 200%", backgroundPosition: positions[cell] }} />
}

export default async function ShopPage() {
  const [currentUser, products] = await Promise.all([
    getCurrentUser(),
    getStoreProducts(),
  ])

  const available = products.map((product) => {
    const variants = product.colors.filter((color) => color.sizes.length
      ? color.sizes.some((size) => size.stock === null || size.stock > 0)
      : color.stock === null || color.stock > 0)
    return {
      ...product,
      imageUrl: cloudinaryImageUrl(variants.find((variant) => variant.imageUrl)?.imageUrl || product.imageUrl, 640),
      variants,
      stock: variants.reduce((sum, variant) => sum + (variant.sizes.length
        ? variant.sizes.reduce((n, size) => n + (size.stock ?? 1), 0)
        : (variant.stock ?? 1)), 0),
    }
  }).filter((product) => product.stock > 0)

  return (
    <main className="min-h-dvh bg-[#f7f2e9] text-[#29251f]" dir="rtl">
      <header className="sticky top-0 z-20 border-b border-[#d9cbb5] bg-[#fbf8f2]/95 backdrop-blur">
        <div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-3 text-xs text-[#62584c] sm:gap-5 sm:text-sm">
            <Link href="/shop" className="transition hover:text-[#9b7745]">المتجر</Link>
            <Link href="/cart" className="transition hover:text-[#9b7745]">السلة</Link>
            {currentUser?.role === 'admin' ? <Link href="/admin" className="transition hover:text-[#9b7745]">لوحة الإدارة</Link> : null}
          </nav>
          <Link href="/shop" aria-label="العنود للزي شرعي - الصفحة الرئيسية" className="text-center">
            <span className="flex items-center justify-center gap-2">
              <span className="h-10 w-10 overflow-hidden rounded-full border border-[#c6a36d] bg-black sm:h-12 sm:w-12"><span className="block h-full w-full" style={{ backgroundImage: "url('/alanoud-storefront-grid.webp')", backgroundSize: "300% 200%", backgroundPosition: "0% 0%" }} /></span>
              <span><span className="block text-xl font-bold tracking-wide text-[#211d18] sm:text-2xl">العنود</span><span className="mt-0.5 block text-[10px] font-semibold tracking-[0.12em] text-[#9a774b] sm:text-xs">للزي شرعي · الخليل</span></span>
            </span>
          </Link>
          <div className="flex items-center justify-end gap-1 text-[#8a6841] sm:gap-2">
            {socialLinks.map(({ href, label, mark }) => <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className="rounded-full p-2 transition hover:bg-[#eee4d5]"><span className="text-sm font-bold">{mark}</span></a>)}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
        <div className="relative isolate grid min-h-[470px] overflow-hidden rounded-[1.8rem] border border-[#b99a68]/50 bg-[#211d18] text-[#fbf5e9] shadow-[0_20px_60px_rgba(48,36,22,.18)] md:grid-cols-[1.05fr_.95fr]">
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-30" style={{backgroundImage:'radial-gradient(circle at 15% 20%, rgba(196,158,96,.35), transparent 32%), radial-gradient(circle at 85% 80%, rgba(196,158,96,.2), transparent 35%)'}}/>
          <div className="relative flex flex-col items-center justify-center px-6 py-12 text-center md:items-start md:px-12 md:text-right lg:px-16">
            <BrandMark />
            <p className="mt-5 text-[10px] font-semibold tracking-[.35em] text-[#d7b77e] sm:text-xs">ALANOUD HEBRON</p>
            <h1 className="mt-4 max-w-xl text-3xl font-bold leading-[1.7] sm:text-4xl lg:text-5xl">أناقتكِ من تراثنا…<br/>وجمالكِ في تفاصيلنا</h1>
            <p className="mt-4 max-w-lg text-sm leading-8 text-[#e6d9c5] sm:text-base">أثواب فلسطينية مطرّزة، فساتين تطريز، عبايات ودشاديش… أناقة تجمع بين الأصالة والعصرية.</p>
            <a href="#products" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full border border-[#d7b77e] bg-[#c5a16b] px-9 py-3 text-sm font-bold text-[#211d18] transition hover:bg-[#dfc394]">تسوّقي الآن</a>
            <div className="mt-7 flex flex-wrap justify-center gap-3 text-xs text-[#d7c6aa] md:justify-start sm:text-sm"><span>أثواب فلسطينية</span><span>✦</span><span>تطريز تراثي</span><span>✦</span><span>عبايات</span></div>
          </div>
          <div className="relative flex min-h-[270px] items-center justify-center overflow-hidden border-t border-[#c7a36b]/20 bg-[radial-gradient(ellipse_at_center,rgba(173,135,79,.22),transparent_65%)] md:min-h-full md:border-r md:border-t-0">
            <SpritePhoto cell={1} label="شال أسود مطرّز بالأحمر من أعمال العنود" className="absolute inset-0 h-full w-full bg-cover bg-center opacity-95" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#211d18]/80 via-[#211d18]/25 to-[#211d18]/40" />
            <div aria-hidden="true" className="absolute inset-5 rounded-[48%] border border-[#c7a36b]/30 md:inset-10"/>
            <div aria-hidden="true" className="absolute inset-10 rounded-[48%] border border-dashed border-[#c7a36b]/25 md:inset-16"/>
            <div className="relative z-10 flex h-[290px] w-full max-w-[360px] items-end justify-center pb-5 sm:h-[350px]">
              <span className="rounded-full border border-[#d7b77e]/70 bg-[#211d18]/75 px-5 py-2 text-sm font-semibold text-[#f1dfbd] backdrop-blur">تفاصيل من تراثنا الفلسطيني</span>
            </div>
            <span className="absolute bottom-5 text-[10px] tracking-[.28em] text-[#c9aa73]">PALESTINIAN HERITAGE · HEBRON</span>
          </div>
        </div>
      </section>

      <section aria-label="من أعمال العنود" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-5 text-center"><p className="text-xs font-semibold tracking-[.18em] text-[#9a774b]">من أعمالنا</p><h2 className="mt-2 text-xl font-bold text-[#30291f] sm:text-2xl">تطريز يحكي حكاية</h2></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 row-span-2 overflow-hidden rounded-2xl border border-[#d8c4a3] bg-[#e8dfd2] shadow-sm"><SpritePhoto cell={1} label="شال أسود بتطريز أحمر" className="aspect-[4/5] h-full w-full bg-cover bg-center transition duration-500 hover:scale-[1.03]" /></div>
          <div className="overflow-hidden rounded-2xl border border-[#e4d8c7] bg-white"><SpritePhoto cell={2} label="ثوب فلسطيني مطرز للأطفال" className="aspect-[3/4] w-full bg-cover bg-center" /><p className="p-2 text-center text-xs font-semibold text-[#514536]">أثواب فلسطينية</p></div>
          <div className="overflow-hidden rounded-2xl border border-[#e4d8c7] bg-white"><SpritePhoto cell={3} label="شال أسود مطرز بالأحمر" className="aspect-[3/4] w-full bg-cover bg-center" /><p className="p-2 text-center text-xs font-semibold text-[#514536]">تطريز تراثي</p></div>
          <div className="overflow-hidden rounded-2xl border border-[#e4d8c7] bg-white"><SpritePhoto cell={4} label="فستان أسود بتطريز بنفسجي" className="aspect-[3/4] w-full bg-cover bg-center" /><p className="p-2 text-center text-xs font-semibold text-[#514536]">فساتين مطرزة</p></div>
          <div className="overflow-hidden rounded-2xl border border-[#e4d8c7] bg-white"><SpritePhoto cell={5} label="عباية كحلية مطرزة" className="aspect-[3/4] w-full bg-cover bg-center" /><p className="p-2 text-center text-xs font-semibold text-[#514536]">عبايات</p></div>
        </div>
      </section>

      <section aria-label="تصفحي أقسام المتجر" className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 sm:pt-14">
        <div className="mb-5 text-center">
          <p className="text-xs font-semibold tracking-[.18em] text-[#9a774b]">اختاري ما يشبهك</p>
          <h2 className="mt-2 text-xl font-bold text-[#30291f] sm:text-2xl">أناقة لكل مناسبة</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { title: 'الأثواب الفلسطينية', note: 'روح التراث بتفاصيل مطرزة', symbol: '✧' },
            { title: 'العبايات', note: 'أناقة هادئة لكل يوم', symbol: '◇' },
            { title: 'فساتين التطريز', note: 'تفاصيل تلفت الأنظار', symbol: '✦' },
            { title: 'الدشاديش', note: 'راحة وأناقة', symbol: '❋' },
          ].map((category) => (
            <a key={category.title} href="#products" className="group rounded-2xl border border-[#e4d8c7] bg-white/80 px-3 py-5 text-center transition hover:-translate-y-1 hover:border-[#c5a16b] hover:bg-white hover:shadow-md sm:px-5 sm:py-7">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#d8c4a3] bg-[#f7f0e5] text-xl text-[#9a774b] transition group-hover:bg-[#211d18] group-hover:text-[#e0c18a]">{category.symbol}</span>
              <span className="mt-3 block text-sm font-bold text-[#3c3328] sm:text-base">{category.title}</span>
              <span className="mt-1 block text-[11px] text-[#8b8175] sm:text-xs">{category.note}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-9 grid max-w-7xl grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:px-6">
        <div className="rounded-xl border border-[#e4d8c7] bg-[#efe6d8] px-3 py-4 text-center">
          <span className="block text-lg text-[#9a774b]">✦</span>
          <p className="mt-1 text-xs font-semibold text-[#514536] sm:text-sm">تصاميم مختارة بعناية</p>
        </div>
        <div className="rounded-xl border border-[#e4d8c7] bg-[#efe6d8] px-3 py-4 text-center">
          <span className="block text-lg text-[#9a774b]">♡</span>
          <p className="mt-1 text-xs font-semibold text-[#514536] sm:text-sm">الدفع عند الاستلام</p>
        </div>
        <div className="col-span-2 rounded-xl border border-[#e4d8c7] bg-[#efe6d8] px-3 py-4 text-center sm:col-span-1">
          <span className="block text-lg text-[#9a774b]">◇</span>
          <p className="mt-1 text-xs font-semibold text-[#514536] sm:text-sm">متاح الدفع المسبق</p>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-7 flex items-end justify-between">
          <div><p className="text-sm font-semibold text-[#9a774b]">اختاري إطلالتك</p><h2 className="mt-1 text-2xl font-bold text-[#30291f]">تشكيلتنا</h2></div>
          <span className="text-sm text-[#766d62]">{available.length} منتج</span>
        </div>
        {available.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {available.map((product) => <Link key={product.id} href={`/products/${product.id}`} className="group overflow-hidden rounded-2xl border border-[#e4d8c7] bg-white transition hover:-translate-y-1 hover:shadow-lg">
            <div className="aspect-[3/4] overflow-hidden bg-[#eee5d8]">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/> : <div className="flex h-full flex-col items-center justify-center gap-3 text-[#9a876c]"><span className="text-4xl">✦</span><span className="text-sm">أضيفي صورة المنتج</span></div>}</div>
            <div className="p-4"><h3 className="font-semibold">{product.name}</h3><p className="mt-2 font-bold text-[#8a6841]">{product.price.toFixed(2)} ₪</p><p className="mt-1 text-xs text-[#8b8175]">{product.variants.length} ألوان متاحة</p></div>
          </Link>)}
        </div> : <div className="rounded-2xl border border-dashed border-[#cdbb9f] bg-white/80 p-12 text-center text-[#766d62]"><span className="mb-3 block text-3xl text-[#b08c58]">✦</span><p className="font-semibold text-[#514536]">قريباً… تشكيلتكِ الخاصة</p><p className="mt-2 text-sm">ستظهر منتجاتكِ هنا بعد إضافتها وتحديث مخزونها من لوحة الإدارة.</p></div>}
      </section>

      <footer className="border-t border-[#d9cbb5] bg-[#211d18] px-5 py-9 text-center text-sm text-[#d8c8ad]">
        <BrandMark/>
        <p className="mt-4 font-semibold text-[#e0c18a]">العنود للزي شرعي · الخليل</p>
        <div className="mt-4 flex items-center justify-center gap-4">{socialLinks.map(({href,label,mark})=><a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-full border border-[#8f754f] p-2 text-[#e0c18a] transition hover:bg-[#3a3023]"><span className="text-sm font-bold">{mark}</span></a>)}</div>
        <Link href="/policies" className="mt-4 inline-block text-[#e0c18a] underline underline-offset-4">سياسة التبديل والترجيع</Link>
      </footer>
    </main>
  )
}
