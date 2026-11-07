import Link from 'next/link'

export const metadata = {
  title: 'سياسة التبديل والترجيع | العنود',
  description: 'سياسة التبديل والترجيع في متجر العنود للزي الشرعي',
}

export default function PoliciesPage() {
  return (
    <main dir="rtl" className="min-h-dvh bg-[#faf8f4] px-5 py-10 text-[#29251f]">
      <div className="mx-auto max-w-3xl">
        <Link href="/shop" className="font-bold text-[#765637]">العنود للزي الشرعي</Link>
        <header className="my-10">
          <p className="text-sm font-semibold text-[#8a6841]">Alanoud Hebron</p>
          <h1 className="mt-2 text-3xl font-bold">سياسة التبديل والترجيع</h1>
          <p className="mt-3 leading-8 text-stone-600">حرصاً منا على وضوح التعامل، نرجو الاطلاع على سياسة التبديل والترجيع التالية قبل إتمام الطلب.</p>
        </header>
        <div className="space-y-5">
          <section className="rounded-2xl border border-[#e9e2d7] bg-white p-6">
            <h2 className="text-xl font-bold text-[#765637]">سياسة التبديل</h2>
            <p className="mt-3 leading-8 text-stone-700">يُرفع طلب التبديل خلال مدة لا تزيد عن 24 ساعة من استلام الطرد، حيث إن هذه المدة كافية للزبونة للتحقق والتأكد من المنتج الذي استلمته.</p>
          </section>
          <section className="rounded-2xl border border-[#e9e2d7] bg-white p-6">
            <h2 className="text-xl font-bold text-[#765637]">سياسة الترجيع</h2>
            <p className="mt-3 leading-8 text-stone-700">يُرفع طلب الإرجاع خلال مدة لا تزيد عن 24 ساعة من استلام الطرد.</p>
          </section>
        </div>
        <p className="mt-8 text-sm leading-7 text-stone-500">تبدأ مهلة الـ24 ساعة من وقت استلام الطرد.</p>
        <Link href="/shop" className="mt-8 inline-flex rounded-full bg-[#765637] px-6 py-3 font-semibold text-white">العودة إلى المتجر</Link>
      </div>
    </main>
  )
}
