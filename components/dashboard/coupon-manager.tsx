'use client'

import { useState, useTransition } from 'react'
import { createCoupon, setCouponActive } from '@/app/actions'
import type { Coupon } from '@/lib/db/schema'

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ code: '', discountType: 'fixed' as 'fixed' | 'percentage', discountValue: '50', startsAt: '', expiresAt: '', usageLimit: '' })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(''); setSuccess('')
    startTransition(async () => {
      const result = await createCoupon({
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        startsAt: form.startsAt || undefined,
        expiresAt: form.expiresAt || undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      })
      if (!result.ok) { setError(result.error); return }
      setSuccess('تم إنشاء كود الخصم بنجاح.')
      setForm({ code: '', discountType: 'fixed', discountValue: '50', startsAt: '', expiresAt: '', usageLimit: '' })
    })
  }

  function toggle(coupon: Coupon) {
    setError(''); setSuccess('')
    startTransition(async () => {
      const result = await setCouponActive(coupon.id, !coupon.active)
      if (!result.ok) setError(result.error)
      else setSuccess('تم تحديث حالة الكود.')
    })
  }

  return <div className="space-y-6">
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2">
      <div className="md:col-span-2"><h2 className="text-lg font-semibold">إنشاء كود خصم جديد</h2><p className="mt-1 text-sm text-muted-foreground">اختاري كوداً واضحاً وشاركيه مع زبائنك.</p></div>
      <label className="text-sm">كود الخصم<input required minLength={3} maxLength={32} value={form.code} onChange={e=>setForm(v=>({...v,code:e.target.value.toUpperCase()}))} placeholder="ALANOUD50" className="mt-1 w-full rounded-lg border bg-background px-3 py-2 uppercase"/></label>
      <label className="text-sm">نوع الخصم<select value={form.discountType} onChange={e=>setForm(v=>({...v,discountType:e.target.value as 'fixed'|'percentage'}))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2"><option value="fixed">مبلغ ثابت (شيكل)</option><option value="percentage">نسبة مئوية (%)</option></select></label>
      <label className="text-sm">قيمة الخصم<input required type="number" min="0.01" max={form.discountType==='percentage'?'100':'100000'} step="0.01" value={form.discountValue} onChange={e=>setForm(v=>({...v,discountValue:e.target.value}))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2"/></label>
      <label className="text-sm">الحد الأقصى للاستخدام <span className="text-muted-foreground">(اختياري)</span><input type="number" min="1" step="1" value={form.usageLimit} onChange={e=>setForm(v=>({...v,usageLimit:e.target.value}))} placeholder="بدون حد" className="mt-1 w-full rounded-lg border bg-background px-3 py-2"/></label>
      <label className="text-sm">يبدأ بتاريخ <span className="text-muted-foreground">(اختياري)</span><input type="datetime-local" value={form.startsAt} onChange={e=>setForm(v=>({...v,startsAt:e.target.value}))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2"/></label>
      <label className="text-sm">ينتهي بتاريخ <span className="text-muted-foreground">(اختياري)</span><input type="datetime-local" value={form.expiresAt} onChange={e=>setForm(v=>({...v,expiresAt:e.target.value}))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2"/></label>
      <div className="md:col-span-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">الخصم يُحسب على قيمة المنتجات فقط، ولا يخصم من أجرة التوصيل. النسبة المئوية تُحسب تلقائياً من مجموع المنتجات.</div>
      {error && <p role="alert" className="md:col-span-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="md:col-span-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
      <div className="md:col-span-2"><button disabled={pending} className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{pending?'جارٍ الحفظ...':'إنشاء الكود'}</button></div>
    </form>
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b p-5"><h2 className="text-lg font-semibold">أكواد الخصم</h2><p className="mt-1 text-sm text-muted-foreground">يمكنك إيقاف أي كود وإعادة تفعيله في أي وقت.</p></div>
      {coupons.length === 0 ? <p className="p-6 text-sm text-muted-foreground">لم يتم إنشاء أكواد خصم بعد.</p> : <div className="divide-y">{coupons.map(coupon=><div key={coupon.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-base">{coupon.code}</strong><span className={coupon.active?'rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700':'rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'}>{coupon.active?'مفعّل':'متوقف'}</span></div>
          <p className="mt-1 text-sm text-muted-foreground">{coupon.discountType==='fixed' ? coupon.discountValue + ' شيكل خصم' : coupon.discountValue + '% خصم'} · الاستخدام {coupon.usedCount}{coupon.usageLimit===null ? '' : ' من ' + coupon.usageLimit}</p>
          {(coupon.startsAt || coupon.expiresAt) && <p className="mt-1 text-xs text-muted-foreground">{coupon.startsAt ? 'يبدأ ' + new Date(coupon.startsAt).toLocaleString('ar') : 'متاح فوراً'}{coupon.expiresAt ? ' · ينتهي ' + new Date(coupon.expiresAt).toLocaleString('ar') : ''}</p>}
        </div>
        <button type="button" disabled={pending} onClick={()=>toggle(coupon)} className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">{coupon.active?'إيقاف الكود':'تفعيل الكود'}</button>
      </div>)}</div>}
    </section>
  </div>
}
