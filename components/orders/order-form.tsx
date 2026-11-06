'use client'

import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react'
import { useId, useState, useTransition } from 'react'
import { createOrder } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/field'
import { Panel } from '@/components/ui/panel'
import { CITIES, CITY_REGIONS, REGIONS, REGION_KEYS, type RegionKey } from '@/lib/constants'
import type { Courier } from '@/lib/db/schema'
import { formatMoney } from '@/lib/format'
import type { ModelWithColors } from '@/lib/queries'

type ItemLine = { key: number; modelId: string; color: string; quantity: number }
type ExchangeLine = {
  key: number
  returnedModelId: string
  returnedColor: string
  returnedQty: number
  newModelId: string
  newColor: string
  newQty: number
}

let lineKey = 0
const newItem = (): ItemLine => ({ key: ++lineKey, modelId: '', color: '', quantity: 1 })
const newExchange = (): ExchangeLine => ({
  key: ++lineKey,
  returnedModelId: '',
  returnedColor: '',
  returnedQty: 1,
  newModelId: '',
  newColor: '',
  newQty: 1,
})

const emptyCustomer = {
  customerName: '',
  phone: '',
  city: '',
  region: '' as RegionKey | '',
  address: '',
  courierId: '',
  trackingNumber: '',
  notes: '',
}

export function OrderForm({ models, couriers }: { models: ModelWithColors[]; couriers: Courier[] }) {
  const uid = useId()
  const [pending, startTransition] = useTransition()
  const [customer, setCustomer] = useState(emptyCustomer)
  const [items, setItems] = useState<ItemLine[]>(() => [newItem()])
  const [exchanges, setExchanges] = useState<ExchangeLine[]>([])
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const modelById = (id: string) => models.find((m) => String(m.id) === id)
  const priceOf = (id: string) => modelById(id)?.price ?? 0

  const itemsTotal = items.reduce((s, i) => s + priceOf(i.modelId) * i.quantity, 0)
  const exchangeDiff = exchanges.reduce(
    (s, e) => s + priceOf(e.newModelId) * e.newQty - priceOf(e.returnedModelId) * e.returnedQty,
    0,
  )
  const shipping = customer.region ? REGIONS[customer.region].fee : 0
  const total = Math.max(itemsTotal + shipping + exchangeDiff, 0)

  const set = <K extends keyof typeof customer>(key: K, value: (typeof customer)[K]) =>
    setCustomer((c) => ({ ...c, [key]: value }))

  function updateItem(key: number, patch: Partial<ItemLine>) {
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)))
  }
  function updateExchange(key: number, patch: Partial<ExchangeLine>) {
    setExchanges((list) => list.map((e) => (e.key === key ? { ...e, ...patch } : e)))
  }

  function onCityChange(city: string) {
    const region = CITY_REGIONS[city.trim()]
    setCustomer((c) => ({ ...c, city, region: region ?? c.region }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const filledItems = items.filter((i) => i.modelId)
    const filledExchanges = exchanges.filter((x) => x.returnedModelId && x.newModelId)
    if (filledItems.some((i) => !i.color) || filledExchanges.some((x) => !x.newColor)) {
      setMessage({ type: 'error', text: 'اختاري اللون لكل موديل' })
      return
    }
    startTransition(async () => {
      const result = await createOrder({
        ...customer,
        region: customer.region,
        courierId: customer.courierId ? Number(customer.courierId) : null,
        items: filledItems.map((i) => ({ modelId: Number(i.modelId), color: i.color, quantity: i.quantity })),
        exchanges: filledExchanges.map((x) => ({
          returnedModelId: Number(x.returnedModelId),
          returnedColor: x.returnedColor,
          returnedQty: x.returnedQty,
          newModelId: Number(x.newModelId),
          newColor: x.newColor,
          newQty: x.newQty,
        })),
      })
      if (result.ok) {
        setCustomer(emptyCustomer)
        setItems([newItem()])
        setExchanges([])
        setMessage({ type: 'success', text: 'تم إنشاء الطلب وخصم المخزون' })
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    })
  }

  return (
    <Panel title="طلب جديد" description="يُخصم المخزون تلقائياً عند الحفظ" className="lg:sticky lg:top-4">
      {models.length === 0 ? (
        <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          أضيفي موديلاً من صفحة المخزون أولاً لتتمكني من إنشاء الطلبات.
        </p>
      ) : null}
      <form onSubmit={submit} className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold text-primary">المنتجات</legend>
          {items.map((item, index) => {
            const model = modelById(item.modelId)
            const selectedColor = model?.colors.find((c) => c.color === item.color)
            const productImage = selectedColor?.imageUrl || model?.imageUrl
            return (
              <div key={item.key} className="flex flex-col gap-2 rounded-xl border border-border bg-background/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">منتج {index + 1}</span>
                  {items.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setItems((l) => l.filter((i) => i.key !== item.key))}
                      aria-label={`حذف المنتج ${index + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
                <Select
                  aria-label="الموديل"
                  value={item.modelId}
                  onChange={(e) => updateItem(item.key, { modelId: e.target.value, color: '' })}
                >
                  <option value="">اختاري الموديل</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {formatMoney(m.price)}
                    </option>
                  ))}
                </Select>
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <Select
                    aria-label="اللون"
                    value={item.color}
                    disabled={!model}
                    onChange={(e) => updateItem(item.key, { color: e.target.value })}
                  >
                    <option value="">اللون</option>
                    {model?.colors.map((c) => (
                      <option key={c.id} value={c.color} disabled={c.stock <= 0}>
                        {c.color} ({c.stock} متوفر)
                      </option>
                    ))}
                  </Select>
                  <Input
                    aria-label="الكمية"
                    type="number"
                    min={1}
                    max={500}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.key, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
                {productImage ? <ProductImagePreview src={productImage} label={`${model?.name ?? ''} — ${item.color}`} /> : null}
              </div>
            )
          })}
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((l) => [...l, newItem()])}>
            <Plus className="size-4" />
            إضافة منتج آخر
          </Button>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-semibold text-primary">الاستبدال</legend>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setExchanges((l) => [...l, newExchange()])}
            >
              <ArrowLeftRight className="size-4" />
              إضافة استبدال
            </Button>
          </div>
          {exchanges.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              لاستبدال قطعة سابقة بقطعة جديدة، يُحسب فرق السعر تلقائياً.
            </p>
          ) : null}
          {exchanges.map((ex, index) => {
            const returned = modelById(ex.returnedModelId)
            const replacement = modelById(ex.newModelId)
            const returnedColor = returned?.colors.find((c) => c.color === ex.returnedColor)
            const replacementColor = replacement?.colors.find((c) => c.color === ex.newColor)
            const returnedImage = returnedColor?.imageUrl || returned?.imageUrl
            const replacementImage = replacementColor?.imageUrl || replacement?.imageUrl
            const diff = priceOf(ex.newModelId) * ex.newQty - priceOf(ex.returnedModelId) * ex.returnedQty
            return (
              <div key={ex.key} className="flex flex-col gap-2 rounded-xl border border-info/25 bg-info/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">استبدال {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setExchanges((l) => l.filter((x) => x.key !== ex.key))}
                    aria-label={`حذف الاستبدال ${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <p className="text-xs font-medium text-muted-foreground">القطعة المُرجعة</p>
                <Select
                  aria-label="الموديل المُرجع"
                  value={ex.returnedModelId}
                  onChange={(e) => updateExchange(ex.key, { returnedModelId: e.target.value, returnedColor: '' })}
                >
                  <option value="">اختاري الموديل المُرجع</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {formatMoney(m.price)}
                    </option>
                  ))}
                </Select>
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <Select
                    aria-label="لون القطعة المُرجعة"
                    value={ex.returnedColor}
                    disabled={!returned}
                    onChange={(e) => updateExchange(ex.key, { returnedColor: e.target.value })}
                  >
                    <option value="">اللون</option>
                    {returned?.colors.map((c) => (
                      <option key={c.id} value={c.color}>
                        {c.color}
                      </option>
                    ))}
                  </Select>
                  <Input
                    aria-label="كمية القطع المُرجعة"
                    type="number"
                    min={1}
                    value={ex.returnedQty}
                    onChange={(e) => updateExchange(ex.key, { returnedQty: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
                {returnedImage ? <ProductImagePreview src={returnedImage} label={`${returned?.name ?? ''} — ${ex.returnedColor}`} /> : null}
                <p className="text-xs font-medium text-muted-foreground">القطعة الجديدة</p>
                <Select
                  aria-label="الموديل الجديد"
                  value={ex.newModelId}
                  onChange={(e) => updateExchange(ex.key, { newModelId: e.target.value, newColor: '' })}
                >
                  <option value="">اختاري الموديل الجديد</option>
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {formatMoney(m.price)}
                    </option>
                  ))}
                </Select>
                <div className="grid grid-cols-[1fr_96px] gap-2">
                  <Select
                    aria-label="لون القطعة الجديدة"
                    value={ex.newColor}
                    disabled={!replacement}
                    onChange={(e) => updateExchange(ex.key, { newColor: e.target.value })}
                  >
                    <option value="">اللون</option>
                    {replacement?.colors.map((c) => (
                      <option key={c.id} value={c.color} disabled={c.stock <= 0}>
                        {c.color} ({c.stock} متوفر)
                      </option>
                    ))}
                  </Select>
                  <Input
                    aria-label="كمية القطع الجديدة"
                    type="number"
                    min={1}
                    value={ex.newQty}
                    onChange={(e) => updateExchange(ex.key, { newQty: Math.max(1, Number(e.target.value) || 1) })}
                  />
                </div>
                {replacementImage ? <ProductImagePreview src={replacementImage} label={`${replacement?.name ?? ''} — ${ex.newColor}`} /> : null}
                {returned && replacement ? (
                  <p className="text-xs">
                    فرق السعر:{' '}
                    <span className={diff >= 0 ? 'font-semibold text-success' : 'font-semibold text-destructive'}>
                      {diff >= 0 ? '+' : ''}
                      {formatMoney(diff)}
                    </span>
                  </p>
                ) : null}
              </div>
            )
          })}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold text-primary">بيانات العميلة والتوصيل</legend>
          <Field label="اسم العميلة" htmlFor={`${uid}-name`}>
            <Input
              id={`${uid}-name`}
              value={customer.customerName}
              onChange={(e) => set('customerName', e.target.value)}
              required
              autoComplete="off"
            />
          </Field>
          <Field label="رقم الهاتف" htmlFor={`${uid}-phone`}>
            <Input
              id={`${uid}-phone`}
              type="tel"
              inputMode="tel"
              dir="ltr"
              className="text-end"
              value={customer.phone}
              onChange={(e) => set('phone', e.target.value)}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المدينة" htmlFor={`${uid}-city`}>
              <Input
                id={`${uid}-city`}
                list={`${uid}-cities`}
                value={customer.city}
                onChange={(e) => onCityChange(e.target.value)}
                required
              />
              <datalist id={`${uid}-cities`}>
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="المنطقة" htmlFor={`${uid}-region`}>
              <Select
                id={`${uid}-region`}
                value={customer.region}
                onChange={(e) => set('region', e.target.value as RegionKey)}
                required
              >
                <option value="">اختاري المنطقة</option>
                {REGION_KEYS.map((r) => (
                  <option key={r} value={r}>
                    {REGIONS[r].label} ({REGIONS[r].fee} ₪)
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="العنوان التفصيلي" htmlFor={`${uid}-address`}>
            <Input id={`${uid}-address`} value={customer.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="شركة التوصيل" htmlFor={`${uid}-courier`}>
              <Select
                id={`${uid}-courier`}
                value={customer.courierId}
                onChange={(e) => set('courierId', e.target.value)}
              >
                <option value="">لاحقاً</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="رقم التتبع" htmlFor={`${uid}-tracking`}>
              <Input
                id={`${uid}-tracking`}
                dir="ltr"
                className="text-end"
                value={customer.trackingNumber}
                onChange={(e) => set('trackingNumber', e.target.value)}
              />
            </Field>
          </div>
          <Field label="ملاحظات" htmlFor={`${uid}-notes`}>
            <Textarea id={`${uid}-notes`} rows={2} value={customer.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </fieldset>

        <dl className="flex flex-col gap-2 rounded-xl border border-border bg-background/40 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">قيمة المنتجات</dt>
            <dd className="tabular-nums">{formatMoney(itemsTotal)}</dd>
          </div>
          {exchanges.length > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">فرق الاستبدال</dt>
              <dd className="tabular-nums">{formatMoney(exchangeDiff)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              التوصيل {customer.region ? `(${REGIONS[customer.region].label})` : ''}
            </dt>
            <dd className="tabular-nums">{formatMoney(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>الإجمالي</dt>
            <dd className="tabular-nums text-primary">{formatMoney(total)}</dd>
          </div>
        </dl>

        {message ? (
          <p
            role={message.type === 'error' ? 'alert' : 'status'}
            className={
              message.type === 'error'
                ? 'rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'
                : 'rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success'
            }
          >
            {message.text}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={pending || models.length === 0}>
          {pending ? 'جارٍ الحفظ...' : 'إنشاء الطلب'}
        </Button>
      </form>
    </Panel>
  )
}


function ProductImagePreview({ src, label }: { src: string; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-muted/20 p-2">
      {/* Cloudinary-hosted product image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="size-14 rounded-md object-cover" />
      <span className="text-xs text-muted-foreground">صورة المنتج المختار</span>
    </div>
  )
}
