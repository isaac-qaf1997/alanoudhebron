'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useId, useState, useTransition } from 'react'
import { createModel } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Panel } from '@/components/ui/panel'
import { ImagePicker } from '@/components/inventory/image-picker'
import { uploadInventoryImage } from '@/components/inventory/upload-image'

type DraftSize = { key: number; size: string; stock: number | null }
type DraftColor = { key: number; color: string; stock: number | null; sizes: DraftSize[]; file: File | null }
let colorKey = 0
let sizeKey = 0
const newSize = (): DraftSize => ({ key: ++sizeKey, size: '', stock: 0 })
const newColor = (): DraftColor => ({ key: ++colorKey, color: '', stock: 1, sizes: [], file: null })

export function ModelForm() {
  const uid = useId()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', sku: '', price: '', cost: '' })
  const [modelImage, setModelImage] = useState<File | null>(null)
  const [colors, setColors] = useState<DraftColor[]>(() => [newColor()])
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  function updateColor(colorId: number, update: (color: DraftColor) => DraftColor) {
    setColors((list) => list.map((color) => color.key === colorId ? update(color) : color))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      try {
        const [modelImageUrl, preparedColors] = await Promise.all([
          modelImage ? uploadInventoryImage(modelImage) : Promise.resolve(null),
          Promise.all(colors.map(async ({ color, stock, sizes, file }) => ({
            color,
            stock: sizes.length ? null : stock,
            sizes: sizes.filter((entry) => entry.size.trim()).map(({ size, stock: quantity }) => ({ size: size.trim(), stock: quantity })),
            imageUrl: file ? await uploadInventoryImage(file) : null,
          }))),
        ])
        const result = await createModel({
          name: form.name, sku: form.sku, price: Number(form.price || 0), cost: Number(form.cost || 0),
          imageUrl: modelImageUrl, colors: preparedColors,
        })
        if (result.ok) {
          setForm({ name: '', sku: '', price: '', cost: '' })
          setModelImage(null)
          setColors([newColor()])
          setMessage({ type: 'success', text: 'تمت إضافة الموديل وصوره بنجاح. سيبقى مسودة حتى تنشريه.' })
        } else setMessage({ type: 'error', text: result.error })
      } catch (error) {
        setMessage({ type: 'error', text: error instanceof Error ? error.message : 'تعذر رفع الصور، حاولي مرة أخرى' })
      }
    })
  }

  return (
    <Panel title="إضافة موديل" description="أضيفي كل مقاس وكمية بشكل مستقل، والمجموع يظهر تلقائياً" className="lg:sticky lg:top-4">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="اسم الموديل" htmlFor={`${uid}-name`}>
          <Input id={`${uid}-name`} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </Field>
        <Field label="رمز الموديل (اختياري)" htmlFor={`${uid}-sku`}>
          <Input id={`${uid}-sku`} dir="ltr" className="text-end" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="سعر البيع ₪" htmlFor={`${uid}-price`}>
            <Input id={`${uid}-price`} type="number" min={0} step="0.5" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
          </Field>
          <Field label="التكلفة ₪" htmlFor={`${uid}-cost`} hint="لحساب صافي الربح">
            <Input id={`${uid}-cost`} type="number" min={0} step="0.5" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} />
          </Field>
        </div>
        <ImagePicker title="صورة الموديل الرئيسية (اختياري)" file={modelImage} onFileChange={setModelImage} />
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">الألوان والمخزون</legend>
          {colors.map((color, index) => {
            const total = color.sizes.reduce((sum, size) => sum + (size.stock ?? 0), 0)
            const untracked = color.sizes.some((size) => size.stock === null)
            return (
              <div key={color.key} className="flex flex-col gap-2 rounded-lg border border-border/70 p-3">
                <div className="grid grid-cols-[1fr_92px_auto] gap-2">
                  <Input aria-label={`اللون ${index + 1}`} placeholder="مثال: أسود" value={color.color} onChange={(e) => updateColor(color.key, (c) => ({ ...c, color: e.target.value }))} required />
                  <Input aria-label="إجمالي كمية اللون" type="number" min={0} placeholder="الكمية" disabled={color.sizes.length > 0} value={color.sizes.length ? '' : color.stock ?? ''} onChange={(e) => updateColor(color.key, (c) => ({ ...c, stock: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) }))} />
                  <Button type="button" variant="ghost" size="icon" disabled={colors.length === 1} onClick={() => setColors((list) => list.filter((c) => c.key !== color.key))} aria-label="حذف اللون"><Trash2 className="size-4" /></Button>
                </div>
                {color.sizes.length ? (
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">مقاسات اللون</span>
                      <span className="text-xs text-muted-foreground">المجموع: {total} قطعة{untracked ? ' + كميات غير محددة' : ''}</span>
                    </div>
                    {color.sizes.map((size, sizeIndex) => (
                      <div key={size.key} className="mb-2 grid grid-cols-[1fr_92px_auto] gap-2">
                        <Input aria-label={`اسم المقاس ${sizeIndex + 1}`} placeholder="38 أو S أو ون سايز" value={size.size} onChange={(e) => updateColor(color.key, (c) => ({ ...c, sizes: c.sizes.map((s) => s.key === size.key ? { ...s, size: e.target.value } : s) }))} />
                        <Input aria-label="كمية المقاس" type="number" min={0} placeholder="الكمية" value={size.stock ?? ''} onChange={(e) => updateColor(color.key, (c) => ({ ...c, sizes: c.sizes.map((s) => s.key === size.key ? { ...s, stock: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) } : s) }))} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => updateColor(color.key, (c) => ({ ...c, sizes: c.sizes.filter((s) => s.key !== size.key) }))} aria-label="حذف المقاس"><Trash2 className="size-4" /></Button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-muted-foreground">بدون مقاسات: الكمية بالأعلى هي إجمالي القطع.</p>}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => updateColor(color.key, (c) => ({ ...c, stock: null, sizes: [...c.sizes, newSize()] }))}><Plus className="size-4" /> إضافة مقاس</Button>
                  {color.sizes.length ? <Button type="button" size="sm" variant="ghost" onClick={() => updateColor(color.key, (c) => ({ ...c, sizes: [] }))}>إلغاء المقاسات</Button> : null}
                </div>
                <ImagePicker compact title={`صورة لون ${color.color || index + 1} (اختياري)`} file={color.file} onFileChange={(file) => updateColor(color.key, (c) => ({ ...c, file }))} />
              </div>
            )
          })}
          <Button type="button" variant="outline" size="sm" onClick={() => setColors((list) => [...list, newColor()])}><Plus className="size-4" /> إضافة لون</Button>
        </fieldset>
        {message ? <p role={message.type === 'error' ? 'alert' : 'status'} className={message.type === 'error' ? 'text-sm text-destructive' : 'text-sm text-success'}>{message.text}</p> : null}
        <p className="text-xs text-muted-foreground">الصيغ المدعومة: JPG وPNG وWebP، بحد أقصى 4 ميغابايت للصورة الواحدة.</p>
        <Button type="submit" size="lg" disabled={pending}>{pending ? 'جارٍ رفع الصور وحفظ الموديل...' : 'حفظ الموديل'}</Button>
      </form>
    </Panel>
  )
}
