'use client'

import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useId, useState, useTransition } from 'react'
import { createCourier, deleteCourier, updateCourier } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { EmptyState, Panel } from '@/components/ui/panel'
import { REGIONS } from '@/lib/constants'
import type { Courier } from '@/lib/db/schema'
import { formatMoney } from '@/lib/format'

const empty = { name: '', phone: '', feeWestBank: 15, feeJerusalem: 25, feeInside: 60, active: true }

export function CourierManager({ couriers }: { couriers: Courier[] }) {
  const uid = useId()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  function edit(c: Courier) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      phone: c.phone ?? '',
      feeWestBank: c.feeWestBank,
      feeJerusalem: c.feeJerusalem,
      feeInside: c.feeInside,
      active: c.active,
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

  function remove(c: Courier) {
    if (!window.confirm(`حذف شركة ${c.name}؟ ستُزال من الطلبات المرتبطة بها.`)) return
    startTransition(async () => {
      const result = await deleteCourier(c.id)
      if (!result.ok) setError(result.error)
    })
  }

  const feeField = (key: 'feeWestBank' | 'feeJerusalem' | 'feeInside', label: string) => (
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
          <div className="grid grid-cols-3 gap-2">
            {feeField('feeWestBank', 'الضفة')}
            {feeField('feeJerusalem', 'القدس')}
            {feeField('feeInside', 'الداخل')}
          </div>
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
        description={`رسوم التوصيل على العميلة: الضفة ${REGIONS.west_bank.fee} ₪ · القدس ${REGIONS.jerusalem.fee} ₪ · الداخل ${REGIONS.inside.fee} ₪`}
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
                <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                  {[
                    ['الضفة', c.feeWestBank],
                    ['القدس', c.feeJerusalem],
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
