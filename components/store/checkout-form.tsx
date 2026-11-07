'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { checkStoreCoupon, submitStoreOrder } from '@/app/store-actions'
import { REGIONS } from '@/lib/constants'

type Product = { id: number; name: string; price: number; colors: { color: string; stock: number }[] }
type CartLine = { modelId: number; color: string; quantity: number }
const KEY = 'alanoud-cart-v1'

export default function CheckoutForm({ products }: { products: Product[] }) {
  const router = useRouter()
  const [items, setItems] = useState<CartLine[]>([])
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const requestKey = useRef<string | null>(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState<number | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponMessage, setCouponMessage] = useState('')
  const [couponBusy, setCouponBusy] = useState(false)
  const [form, setForm] = useState({ customerName: '', phone: '', city: '', area: '', region: 'west_bank', address: '', paymentMethod: 'cod' as 'cod' })
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { setItems([]) }
  }, [])
  const itemsTotal = useMemo(() => items.reduce((sum, line) => {
    const product = products.find(p => p.id === line.modelId)
    return sum + (product?.price || 0) * line.quantity
  }, 0), [items, products])
  const shippingFee = REGIONS[form.region as keyof typeof REGIONS]?.fee ?? 0
  const orderTotal = itemsTotal + shippingFee - (appliedCoupon?.discount ?? 0)
  async function applyCoupon() {
    setCouponBusy(true); setCouponMessage('')
    try {
      const result = await checkStoreCoupon(couponCode, itemsTotal)
      if (!result.ok) { setAppliedCoupon(null); setCouponMessage(result.error); return }
      setAppliedCoupon({ code: result.code, discount: result.discount })
      setCouponMessage('تم تطبيق كود الخصم بنجاح.')
    } catch {
      setAppliedCoupon(null); setCouponMessage('تعذر التحقق من الكود حالياً.')
    } finally { setCouponBusy(false) }
  }
  function update(field: string, value: string) { setForm(current => ({ ...current, [field]: value })) }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting.current || busy) return
    submitting.current = true
    setBusy(true); setError('')
    try {
      if (!requestKey.current) {
        const storageKey = 'alanoud-checkout-request-v1'
        requestKey.current = sessionStorage.getItem(storageKey) || crypto.randomUUID()
        sessionStorage.setItem(storageKey, requestKey.current)
      }
      const result = await submitStoreOrder({ ...form, items, couponCode: appliedCoupon?.code, checkoutRequestKey: requestKey.current })
      if (!result.ok) { setError(result.error); return }
      localStorage.removeItem(KEY)
      sessionStorage.removeItem('alanoud-checkout-request-v1')
      requestKey.current = null
      setDone(result.orderId)
    } catch {
      setError('تعذر الاتصال لإرسال الطلب. حاولي مرة أخرى؛ لن يتكرر الطلب إذا وصلنا الإرسال السابق.')
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }
  if (done) return <section className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm"><div className="text-4xl">✓</div><h1 className="mt-4 text-2xl font-bold">تم استلام طلبك بنجاح</h1><p className="mt-3 leading-8 text-stone-600">رقم طلبك: <b>#{done}</b>. سنتواصل معك لتأكيد التفاصيل.</p><Link href="/shop" className="mt-6 inline-block rounded-full bg-[#765637] px-7 py-3 text-white">العودة للمتجر</Link></section>
  if (!items.length) return <section className="rounded-2xl bg-white p-8 text-center"><p>سلتك فارغة.</p><Link className="mt-4 inline-block text-[#765637] underline" href="/shop">تصفحي المنتجات</Link></section>
  return <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
    <div className="space-y-5 rounded-3xl bg-white p-6">
      <h1 className="text-2xl font-bold">بيانات التوصيل</h1>
      <label className="block text-sm">الاسم الكامل<input required maxLength={120} value={form.customerName} onChange={e=>update('customerName',e.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
      <label className="block text-sm">رقم الهاتف<input required type="tel" maxLength={30} value={form.phone} onChange={e=>update('phone',e.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">المدينة<input required value={form.city} onChange={e=>update('city',e.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
        <label className="block text-sm">منطقة التوصيل<select value={form.region} onChange={e=>update('region',e.target.value)} className="mt-2 w-full rounded-xl border p-3"><option value="west_bank">الضفة الغربية</option><option value="jerusalem">القدس</option><option value="area_67">مناطق 67</option><option value="inside">مناطق الداخل</option></select></label>
      </div>
      <label className="block text-sm">المنطقة / الحي<input required maxLength={100} value={form.area} onChange={e=>update('area',e.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
      <label className="block text-sm">العنوان بالتفصيل<textarea required value={form.address} onChange={e=>update('address',e.target.value)} className="mt-2 w-full rounded-xl border p-3"/></label>
      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">عندك كود خصم؟</h2>
        <div className="mt-3 flex gap-2">
          <input value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setAppliedCoupon(null);setCouponMessage('')}} placeholder="أدخلي كود الخصم" maxLength={32} className="min-w-0 flex-1 rounded-lg border px-3 py-2 uppercase"/>
          <button type="button" disabled={couponBusy || !couponCode.trim()} onClick={applyCoupon} className="rounded-lg bg-[#765637] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{couponBusy?'جارٍ التحقق...':'تطبيق'}</button>
        </div>
        {couponMessage && <p role="status" className={`mt-2 text-sm ${appliedCoupon?'text-green-700':'text-red-700'}`}>{couponMessage}</p>}
      </section>
      <h2 className="pt-3 text-lg font-bold">طريقة الدفع</h2>
      <div className="rounded-xl border border-[#765637]/20 bg-[#faf8f4] p-4"><b>الدفع عند الاستلام</b><p className="mt-1 text-sm text-stone-500">ادفعي عند وصول الطلب.</p></div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-full bg-[#765637] px-6 py-4 font-bold text-white disabled:opacity-50">{busy?'جارٍ إرسال الطلب...':'تأكيد الطلب'}</button>
    </div>
    <aside className="h-fit rounded-3xl bg-white p-6"><h2 className="text-xl font-bold">ملخص الطلب</h2>{items.map((line,i)=>{const p=products.find(x=>x.id===line.modelId);return <div key={i} className="flex justify-between gap-3 border-b py-3 text-sm"><span>{p?.name} · {line.color} × {line.quantity}</span><b>{((p?.price||0)*line.quantity).toFixed(2)} ₪</b></div>})}<div className="flex justify-between pt-5 text-sm"><span>مجموع المنتجات</span><span>{itemsTotal.toFixed(2)} ₪</span></div><div className="mt-2 flex justify-between text-sm"><span>رسوم التوصيل ({REGIONS[form.region as keyof typeof REGIONS]?.label || "المنطقة المحددة"})</span><span>{shippingFee.toFixed(2)} ₪</span></div>{appliedCoupon && <div className="mt-2 flex justify-between text-sm text-green-700"><span>خصم الكود ({appliedCoupon.code})</span><span>−{appliedCoupon.discount.toFixed(2)} ₪</span></div>}<div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold"><span>الإجمالي عند الاستلام</span><span>{orderTotal.toFixed(2)} ₪</span></div><p className="mt-2 text-xs leading-6 text-stone-500">رسوم التوصيل محسوبة حسب منطقة التوصيل المختارة، وقد نؤكد تفاصيل العنوان معك قبل الشحن.</p></aside>
  </form>
}
