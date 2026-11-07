'use client'

import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useId, useState, useTransition } from 'react'
import { createCourier, deleteCourier, updateCourier } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { EmptyState, Panel } from '@/components/ui/panel'
import { REGIONS } from '@/lib/constants'
import type { CourierPublic } from '@/lib/db/schema'
import { formatMoney } from '@/lib/format'

const empty = { name: '', phone: '', feeWestBank: 0, feeJerusalem: 0, feeArea67: 0, feeInside: 0, active: true, integrationKey: '', apiEnabled: false }

export function CourierManager({ couriers }: { couriers: CourierPublic[] }) {
  const uid = useId()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function edit(c: CourierPublic) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      phone: c.phone ?? '',
      feeWestBank: c.feeWestBank,
      feeJerusalem: c.feeJerusalem,
      feeArea67: c.feeArea67,
      feeInside: c.feeInside,
      active: c.active,
      integrationKey: c.integrationKey ?? '',
      apiEnabled: c.apiEnabled,
    })
  }

  function reset() {
    setEditingId(null)
    setForm(empty)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = editingId ? await updateCourier(editingId, form) : await createCourier(form)
      if (result.ok) reset()
      else setError(result.error)
    })
  }

  function remove(c: CourierPublic) {
    if (!window.confirm(`حذف شركة ${c.name}؟ ستُزال من الطلبات المرتبطة بها.`)) return
    startTransition(async () => {
      const result = await deleteCourier(c.id)
      if (!result.ok) setError(result.error)
    })
  }

  const feeField = (key: 'feeWestBank' | 'feeJerusalem' | 'feeArea67' | 'feeInside', label: string) => (
    <Field label={label} htmlFor={`${uid}-${key}`}>
      <Input
        id={`${uid}-${key}`}
        type="number"
        min={0}
        step="0.5"
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
        required
      />
    </Field>
  )

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <Panel
        title={editingId ? 'تعديل شركة التوصيل' : 'ربط شركة توصيل'}
        description="الرسوم التي تتقاضاها الشركة منكِ عن كل طرد حسب المنطقة"
      >
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field label="اسم الشركة" htmlFor={`${uid}-name`}>
            <Input
              id={`${uid}-name`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </Field>
          <Field label="رقم التواصل" htmlFor={`${uid}-phone`}>
            <Input
              id={`${uid}-phone`}
              type="tel"
              dir="ltr"
              className="text-end"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </Field>
          <Field label="مفتاح الربط البرمجي (اختياري)" htmlFor={`${uid}-integration`}>
            <Input
              id={`${uid}-integration`}
              dir="ltr"
              placeholder="مثال: courier_a"
              value={form.integrationKey}
              onChange={(e) => setForm((f) => ({ ...f, integrationKey: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
            />
            <p className="text-xs text-muted-foreground">يُستخدم لربط الشركة بإعدادات API الآمنة على الخادم. لا تضعي كلمة المرور أو مفتاح API هنا.</p>
          </Field>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {feeField('feeWestBank', 'الضفة')}
            {feeField('feeJerusalem', 'القدس')}
            {feeField('feeArea67', 'مناطق 67')}
            {feeField('feeInside', 'الداخل')}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={form.apiEnabled} onChange={(e) => setForm((f) => ({ ...f, apiEnabled: e.target.checked }))} />
            تفعيل الربط البرمجي (API) بعد تجهيز الرمز السري
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            شركة مفعّلة
          </label>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={pending}>
              {editingId ? 'حفظ التعديلات' : (
                <>
                  <Plus className="size-4" />
                  إضافة الشركة
                </>
              )}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" onClick={reset} aria-label="إلغاء التعديل">
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </form>
      </Panel>

      <Panel
        title="شركات التوصيل"
        description={`رسوم التوصيل على العميلة: الضفة ${REGIONS.west_bank.fee} ₪ · القدس ${REGIONS.jerusalem.fee} ₪ · مناطق 67 ${REGIONS.area_67.fee} ₪ · الداخل ${REGIONS.inside.fee} ₪`}
      >
        {couriers.length === 0 ? (
          <EmptyState>لم تتم إضافة أي شركة توصيل بعد.</EmptyState>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {couriers.map((c) => (
              <li key={c.id} className="flex flex-col gap-3 rounded-xl border border-border bg-background/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="flex items-center gap-2 font-semibold">
                      <span
                        className={c.active ? 'size-2 rounded-full bg-success' : 'size-2 rounded-full bg-muted-foreground'}
                        aria-hidden="true"
                      />
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground" dir="ltr">
                      {c.phone || '—'}
                    </p>
                    {c.integrationKey ? <p className="mt-1 text-xs text-muted-foreground" dir="ltr">API: {c.integrationKey} · {c.apiEnabled ? 'مفعّل' : 'متوقف'}</p> : null}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => edit(c)} aria-label={`تعديل ${c.name}`}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(c)}
                      disabled={pending}
                      aria-label={`حذف ${c.name}`}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                  {[
                    ['الضفة', c.feeWestBank],
                    ['القدس', c.feeJerusalem],
                    ['مناطق 67', c.feeArea67],
                    ['الداخل', c.feeInside],
                  ].map(([label, fee]) => (
                    <div key={label} className="rounded-lg bg-muted px-2 py-1.5">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-semibold tabular-nums">{formatMoney(Number(fee))}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
