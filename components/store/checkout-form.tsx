'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { checkStoreCoupon, submitStoreOrder } from '@/app/store-actions'
import { CITY_REGIONS, REGIONS } from '@/lib/constants'
import { OpostLocationFields } from '@/components/shipping/opost-location-fields'

type Product = { id: number; name: string; price: number; colors: { color: string; stock: number | null; sizes: { size: string; stock: number | null }[] }[] }
type CartLine = { modelId: number; color: string; size?: string; quantity: number }
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
  const [form, setForm] = useState({ customerName: '', phone: '', city: '', area: '', region: 'west_bank', address: '', paymentMethod: 'cod' as 'cod' | 'prepaid', paymentReference: '' })
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
  function update(field: string, value: string) {
    setForm(current => ({
      ...current,
      [field]: value,
      ...(field === 'city' && CITY_REGIONS[value.trim()] ? { region: CITY_REGIONS[value.trim()] } : {}),
    }))
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting.current || busy) return
    if (couponCode.trim() && !appliedCoupon) { setError('اضغطي على تطبيق للتحقق من كود الخصم قبل تأكيد الطلب، أو امسحي الكود للمتابعة بدونه.'); return }
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
  if (done) return <section className="mx-auto max-w-xl rounded-3xl border border-[#8f6a39]/70 bg-[#1b140f] p-8 text-center shadow-sm"><div className="text-4xl">✓</div><h1 className="mt-4 text-2xl font-bold">تم استلام طلبك بنجاح</h1><p className="mt-3 leading-8 text-[#bca681]">رقم طلبك: <b>#{done}</b>. سنتواصل معك لتأكيد التفاصيل.</p><Link href="/shop" className="mt-6 inline-block rounded-full bg-gradient-to-b from-[#f5dfb6] to-[#c99b5c] px-7 py-3 font-bold text-[#1c140c]">العودة للمتجر</Link></section>
  if (!items.length) return <section className="rounded-2xl border border-[#8f6a39]/70 bg-[#1b140f] p-8 text-center"><p>سلتك فارغة.</p><Link className="mt-4 inline-block text-[#765637] underline" href="/shop">تصفحي المنتجات</Link></section>
  return <form onSubmit={submit} className="grid gap-8 text-[#f3dfbd] lg:grid-cols-[1fr_360px] [&_input:not([type=radio])]:border-[#765b3b] [&_input:not([type=radio])]:bg-[#100c09] [&_input:not([type=radio])]:text-[#f5e5ca]">
    <div className="space-y-5 rounded-3xl border border-[#8f6a39]/70 bg-[#1b140f] p-5 sm:p-6">
      <h1 className="text-2xl font-bold">بيانات التوصيل</h1>
      <label className="block text-sm">الاسم الكامل<input required maxLength={120} value={form.customerName} onChange={e=>update('customerName',e.target.value)} className="mt-2 w-full rounded-xl border border-[#765b3b] bg-[#100c09] p-3 text-[#f5e5ca]"/></label>
      <label className="block text-sm">رقم الهاتف<input required type="tel" maxLength={30} value={form.phone} onChange={e=>update('phone',e.target.value)} className="mt-2 w-full rounded-xl border border-[#765b3b] bg-[#100c09] p-3 text-[#f5e5ca]"/></label>
      <OpostLocationFields
        city={form.city}
        area={form.area}
        onCityChange={value => update('city', value)}
        onAreaChange={value => update('area', value)}
      />
      <label className="block text-sm">منطقة التوصيل<select value={form.region} onChange={e=>update('region',e.target.value)} className="mt-2 w-full rounded-xl border border-[#765b3b] bg-[#100c09] p-3 text-[#f5e5ca]"><option value="west_bank">الضفة الغربية</option><option value="jerusalem">القدس</option><option value="area_67">مناطق 67</option><option value="inside">مناطق الداخل</option></select></label>
      <label className="block text-sm">العنوان بالتفصيل<textarea required value={form.address} onChange={e=>update('address',e.target.value)} className="mt-2 w-full rounded-xl border border-[#765b3b] bg-[#100c09] p-3 text-[#f5e5ca]"/></label>
      <section className="rounded-xl border p-4">
        <h2 className="font-semibold">عندك كود خصم؟</h2>
        <div className="mt-3 flex gap-2">
          <input value={couponCode} onChange={e=>{setCouponCode(e.target.value.toUpperCase());setAppliedCoupon(null);setCouponMessage('')}} placeholder="أدخلي كود الخصم" maxLength={32} className="min-w-0 flex-1 rounded-lg border border-[#765b3b] bg-[#100c09] px-3 py-2 uppercase text-[#f5e5ca]"/>
          <button type="button" disabled={couponBusy || !couponCode.trim()} onClick={applyCoupon} className="rounded-lg bg-[#d0a66a] px-4 py-2 text-sm font-semibold text-[#1c140c] disabled:opacity-50">{couponBusy?'جارٍ التحقق...':'تطبيق'}</button>
        </div>
        {couponMessage && <p role="status" className={`mt-2 text-sm ${appliedCoupon?'text-emerald-300':'text-red-200'}`}>{couponMessage}</p>}
      </section>
      <div className="rounded-xl border border-[#765b3b] bg-[#100c09] p-4 text-sm leading-7">بإتمام الطلب، يرجى الاطلاع على <Link href="/policies" className="font-semibold text-[#e2bc7e] underline underline-offset-4">سياسة التبديل والترجيع</Link>. طلب التبديل أو الإرجاع يُقدّم خلال 24 ساعة من استلام الطرد.</div>
      <h2 className="pt-3 text-lg font-bold">طريقة الدفع</h2>
      <div className="space-y-3 rounded-xl border border-[#765b3b] bg-[#100c09] p-4">
        <label className="flex items-center gap-2"><input type="radio" name="paymentMethod" checked={form.paymentMethod === 'cod'} onChange={() => update('paymentMethod', 'cod')}/><span><b>الدفع عند الاستلام</b><span className="block text-sm text-[#bca681]">ادفعي عند وصول الطلب.</span></span></label>
        <label className="flex items-center gap-2"><input type="radio" name="paymentMethod" checked={form.paymentMethod === 'prepaid'} onChange={() => update('paymentMethod', 'prepaid')}/><span><b>الدفع المسبق المباشر</b><span className="block text-sm text-[#bca681]">يتم تأكيد تفاصيل الدفع مع المتجر.</span></span></label>
        {form.paymentMethod === 'prepaid' && <label className="block text-sm">رقم الحوالة أو مرجع الدفع (اختياري)<input value={form.paymentReference} onChange={e => update('paymentReference', e.target.value)} maxLength={160} className="mt-2 w-full rounded-xl border border-[#765b3b] bg-[#100c09] p-3 text-[#f5e5ca]"/></label>}
      </div>
      {error && <p role="alert" className="rounded-xl border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
      <button disabled={busy} className="w-full rounded-full border border-[#f1d29b] bg-gradient-to-b from-[#f5dfb6] to-[#c99b5c] px-6 py-4 font-bold text-[#1c140c] disabled:opacity-50">{busy?'جارٍ إرسال الطلب...':'تأكيد الطلب'}</button>
    </div>
    <aside className="h-fit rounded-3xl border border-[#8f6a39]/70 bg-[#1b140f] p-5 sm:p-6"><h2 className="text-xl font-bold">ملخص الطلب</h2>{items.map((line,i)=>{const p=products.find(x=>x.id===line.modelId);return <div key={i} className="flex justify-between gap-3 border-b border-[#765b3b]/60 py-3 text-sm"><span>{p?.name} · {line.color}{line.size ? ' · ' + line.size : ''} × {line.quantity}</span><b>{((p?.price||0)*line.quantity).toFixed(2)} ₪</b></div>})}<div className="flex justify-between pt-5 text-sm"><span>مجموع المنتجات</span><span>{itemsTotal.toFixed(2)} ₪</span></div><div className="mt-2 flex justify-between text-sm"><span>رسوم التوصيل ({REGIONS[form.region as keyof typeof REGIONS]?.label || "المنطقة المحددة"})</span><span>{shippingFee.toFixed(2)} ₪</span></div>{appliedCoupon && <div className="mt-2 flex justify-between text-sm text-emerald-300"><span>خصم الكود ({appliedCoupon.code})</span><span>−{appliedCoupon.discount.toFixed(2)} ₪</span></div>}<div className="mt-4 flex justify-between border-t border-[#765b3b] pt-4 text-lg font-bold"><span>الإجمالي النهائي</span><span>{orderTotal.toFixed(2)} ₪</span></div><p className="mt-2 text-xs leading-6 text-[#bca681]">رسوم التوصيل محسوبة حسب منطقة التوصيل المختارة، وقد نؤكد تفاصيل العنوان معك قبل الشحن.</p></aside>
  </form>
}
