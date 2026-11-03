'use client'

import { Plus, Trash2 } from 'lucide-react'
import { useId, useState, useTransition } from 'react'
import { createModel } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Panel } from '@/components/ui/panel'
import { ImagePicker } from '@/components/inventory/image-picker'
import { uploadInventoryImage } from '@/components/inventory/upload-image'

type DraftColor = { key: number; color: string; stock: number; file: File | null }

let key = 0
const newColor = (): DraftColor => ({ key: ++key, color: '', stock: 1, file: null })

export function ModelForm() {
  const uid = useId()
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', sku: '', price: '', cost: '' })
  const [modelImage, setModelImage] = useState<File | null>(null)
  const [colors, setColors] = useState<DraftColor[]>(() => [newColor()])
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      try {
        const [modelImageUrl, preparedColors] = await Promise.all([
          modelImage ? uploadInventoryImage(modelImage) : Promise.resolve(null),
          Promise.all(
            colors.map(async ({ color, stock, file }) => ({
              color,
              stock,
              imageUrl: file ? await uploadInventoryImage(file) : null,
            })),
          ),
        ])
        const result = await createModel({
          name: form.name,
          sku: form.sku,
          price: Number(form.price || 0),
          cost: Number(form.cost || 0),
          imageUrl: modelImageUrl,
          colors: preparedColors,
        })
        if (result.ok) {
          setForm({ name: '', sku: '', price: '', cost: '' })
          setModelImage(null)
          setColors([newColor()])
          setMessage({ type: 'success', text: 'تمت إضافة الموديل وصوره بنجاح' })
        } else {
          setMessage({ type: 'error', text: result.error })
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'تعذر رفع الصور، حاولي مرة أخرى',
        })
      }
    })
  }

  return (
    <Panel title="إضافة موديل" description="حدّدي التفاصيل والألوان والصور المتوفرة لكل لون" className="lg:sticky lg:top-4">
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Field label="اسم الموديل" htmlFor={`${uid}-name`}>
          <Input
            id={`${uid}-name`}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </Field>
        <Field label="رمز الموديل (اختياري)" htmlFor={`${uid}-sku`}>
          <Input
            id={`${uid}-sku`}
            dir="ltr"
            className="text-end"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="سعر البيع ₪" htmlFor={`${uid}-price`}>
            <Input
              id={`${uid}-price`}
              type="number"
              min={0}
              step="0.5"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              required
            />
          </Field>
          <Field label="التكلفة ₪" htmlFor={`${uid}-cost`} hint="لحساب صافي الربح">
            <Input
              id={`${uid}-cost`}
              type="number"
              min={0}
              step="0.5"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            />
          </Field>
        </div>

        <ImagePicker title="صورة الموديل الرئيسية (اختياري)" file={modelImage} onFileChange={setModelImage} />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">الألوان والكميات والصور</legend>
          {colors.map((c, index) => (
            <div key={c.key} className="flex flex-col gap-2 rounded-lg border border-border/70 p-2">
              <div className="grid grid-cols-[1fr_88px_auto] gap-2">
                <Input
                  aria-label={`اللون ${index + 1}`}
                  placeholder="مثال: أسود"
                  value={c.color}
                  onChange={(e) =>
                    setColors((list) => list.map((x) => (x.key === c.key ? { ...x, color: e.target.value } : x)))
                  }
                  required
                />
                <Input
                  aria-label={`كمية اللون ${index + 1}`}
                  type="number"
                  min={0}
                  value={c.stock}
                  onChange={(e) =>
                    setColors((list) =>
                      list.map((x) => (x.key === c.key ? { ...x, stock: Math.max(0, Number(e.target.value) || 0) } : x)),
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={colors.length === 1}
                  onClick={() => setColors((list) => list.filter((x) => x.key !== c.key))}
                  aria-label={`حذف اللون ${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <ImagePicker
                compact
                title={`صورة لون ${c.color || index + 1} (اختياري)`}
                file={c.file}
                onFileChange={(file) =>
                  setColors((list) => list.map((x) => (x.key === c.key ? { ...x, file } : x)))
                }
              />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setColors((l) => [...l, newColor()])}>
            <Plus className="size-4" />
            إضافة لون
          </Button>
        </fieldset>

        {message ? (
          <p
            role={message.type === 'error' ? 'alert' : 'status'}
            className={message.type === 'error' ? 'text-sm text-destructive' : 'text-sm text-success'}
          >
            {message.text}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">الصيغ المدعومة: JPG وPNG وWebP، بحد أقصى 4 ميغابايت للصورة الواحدة.</p>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? 'جارٍ رفع الصور وحفظ الموديل...' : 'حفظ الموديل'}
        </Button>
      </form>
    </Panel>
  )
}
