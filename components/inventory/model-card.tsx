'use client'

import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import {
  addModelColor,
  deleteModel,
  deleteModelColor,
  setColorStock,
  saveColorSizes,
  setModelPublished,
  updateModel,
  updateModelColorImage,
} from '@/app/actions'
import type { ActionResult } from '@/app/actions'
import { ImagePicker } from '@/components/inventory/image-picker'
import { uploadInventoryImage } from '@/components/inventory/upload-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { formatMoney } from '@/lib/format'
import type { ModelWithColors } from '@/lib/queries'
import { cn } from '@/lib/utils'

export function ModelCard({ model }: { model: ModelWithColors }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [info, setInfo] = useState({ name: model.name, sku: model.sku ?? '', price: model.price, cost: model.cost })
  const [modelImageFile, setModelImageFile] = useState<File | null>(null)
  const [newColor, setNewColor] = useState({ color: '', stock: null as number | null, file: null as File | null })

  const total = model.colors.reduce((s, color) => s + (color.sizes.length ? color.sizes.reduce((n, size) => n + (size.stock ?? 0), 0) : (color.stock ?? 0)), 0)

  function act(fn: () => Promise<ActionResult>, onDone?: () => void) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await fn()
        if (result.ok) onDone?.()
        else setError(result.error)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'تعذر تنفيذ العملية')
      }
    })
  }

  return (
    <article className={cn('flex flex-col gap-4 rounded-xl border border-border bg-background/40 p-4', pending && 'opacity-60')}>
      {editing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            act(
              async () => {
                const imageUrl = modelImageFile ? await uploadInventoryImage(modelImageFile) : model.imageUrl
                return updateModel(model.id, { ...info, imageUrl })
              },
              () => {
                setEditing(false)
                setModelImageFile(null)
              },
            )
          }}
        >
          <Input aria-label="اسم الموديل" value={info.name} onChange={(e) => setInfo((i) => ({ ...i, name: e.target.value }))} required />
          <div className="grid grid-cols-3 gap-2">
            <Input aria-label="الرمز" dir="ltr" placeholder="SKU" value={info.sku} onChange={(e) => setInfo((i) => ({ ...i, sku: e.target.value }))} />
            <Input aria-label="سعر البيع" type="number" min={0} step="0.5" value={info.price} onChange={(e) => setInfo((i) => ({ ...i, price: Number(e.target.value) }))} />
            <Input aria-label="التكلفة" type="number" min={0} step="0.5" value={info.cost} onChange={(e) => setInfo((i) => ({ ...i, cost: Number(e.target.value) }))} />
          </div>
          <ImagePicker title="صورة الموديل" imageUrl={model.imageUrl} file={modelImageFile} onFileChange={setModelImageFile} compact />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              <Check className="size-4" />
              حفظ
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setEditing(false); setModelImageFile(null) }}>
              <X className="size-4" />
              إلغاء
            </Button>
          </div>
        </form>
      ) : (
        <header className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            {model.imageUrl ? (
              // Cloudinary-hosted inventory image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={model.imageUrl} alt={model.name} className="size-16 shrink-0 rounded-lg border border-border object-cover" />
            ) : null}
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="font-semibold">{model.name}</h3>
              <p className="text-xs text-muted-foreground">{model.isPublished ? 'منشور في المتجر' : 'مسودة — غير ظاهر للزبائن'}</p>
              <p className="text-xs text-muted-foreground">
                {model.sku ? `${model.sku} · ` : ''}
                سعر {formatMoney(model.price)} · تكلفة {formatMoney(model.cost)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{total} قطعة</span>
            <Button
              size="sm"
              variant={model.isPublished ? "outline" : "default"}
              disabled={pending}
              onClick={() => act(() => setModelPublished(model.id, !model.isPublished))}
            >
              {model.isPublished ? 'إلغاء النشر' : 'نشر'}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label={`تعديل ${model.name}`}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => window.confirm(`حذف موديل ${model.name}؟`) && act(() => deleteModel(model.id))}
              aria-label={`حذف ${model.name}`}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </header>
      )}

      <ul className="flex flex-col gap-3">
        {model.colors.map((c) => (
          <ColorRow
            key={`${c.id}-${c.stock}`}
            color={c.color}
            stock={c.stock}
            sizes={c.sizes}
            imageUrl={c.imageUrl}
            disabled={pending}
            onSave={(stock) => act(() => setColorStock(c.id, stock))}
            onSaveSizes={(sizes) => act(() => saveColorSizes(c.id, sizes))}
            onSaveImage={async (file) => {
              const url = await uploadInventoryImage(file)
              const result = await updateModelColorImage(c.id, url)
              if (!result.ok) throw new Error(result.error)
            }}
            onDelete={() => window.confirm(`حذف اللون ${c.color}؟`) && act(() => deleteModelColor(c.id))}
          />
        ))}
      </ul>

      <form
        className="flex flex-col gap-2 rounded-lg border border-border/70 p-2"
        onSubmit={(e) => {
          e.preventDefault()
          act(
            async () => {
              const imageUrl = newColor.file ? await uploadInventoryImage(newColor.file) : null
              return addModelColor(model.id, newColor.color, newColor.stock, imageUrl)
            },
            () => setNewColor({ color: '', stock: null, file: null }),
          )
        }}
      >
        <div className="grid grid-cols-[1fr_72px_auto] gap-2">
          <Input
            aria-label="لون جديد"
            placeholder="لون جديد"
            value={newColor.color}
            onChange={(e) => setNewColor((n) => ({ ...n, color: e.target.value }))}
            className="h-9"
            required
          />
          <Input
            aria-label="كمية اللون الجديد"
            type="number"
            min={0}
            value={newColor.stock ?? ''}
            placeholder="بدون تتبع"
            onChange={(e) => setNewColor((n) => ({ ...n, stock: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) }))}
            className="h-9"
          />
          <Button type="submit" variant="outline" size="icon" disabled={pending} aria-label="إضافة اللون">
            <Plus className="size-4" />
          </Button>
        </div>
        <ImagePicker
          compact
          title="صورة اللون الجديد (اختياري)"
          file={newColor.file}
          onFileChange={(file) => setNewColor((n) => ({ ...n, file }))}
        />
      </form>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </article>
  )
}

function ColorRow({
  color,
  stock,
  sizes,
  imageUrl,
  disabled,
  onSave,
  onSaveSizes,
  onSaveImage,
  onDelete,
}: {
  color: string
  stock: number | null
  sizes: { id: number; size: string; stock: number | null }[]
  imageUrl: string | null
  disabled: boolean
  onSave: (stock: number | null) => void
  onSaveSizes: (sizes: { size: string; stock: number | null }[]) => void
  onSaveImage: (file: File) => Promise<void>
  onDelete: () => void
}) {
  const [value, setValue] = useState<number | null>(stock)
  const [sizesValue, setSizesValue] = useState(sizes.map((s) => s.stock == null ? s.size : s.size + ':' + s.stock).join(', '))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePending, setImagePending] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const low = stock !== null && stock <= 2

  async function saveImage() {
    if (!imageFile) return
    setImagePending(true)
    setImageError(null)
    try {
      await onSaveImage(imageFile)
      setImageFile(null)
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'تعذر حفظ صورة اللون')
    } finally {
      setImagePending(false)
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border/60 p-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex-1 truncate font-medium">{color}</span>
        {sizes.length ? <span className="text-xs text-muted-foreground">{sizes.length} مقاسات</span> : <>
          {low ? <span className="text-xs text-destructive">{stock === 0 ? 'نفد' : 'منخفض'}</span> : null}
          <Input aria-label={`كمية ${color}`} type="number" min={0} placeholder="غير متابع" value={value ?? ''} onChange={(e) => setValue(e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))} className={cn('h-8 w-24', low && 'border-destructive/50')} />
          <Button size="icon-sm" variant={value !== stock ? 'default' : 'ghost'} disabled={disabled || value === stock} onClick={() => onSave(value)} aria-label={`حفظ كمية ${color}`}><Check className="size-4" /></Button>
        </>}

        <Button size="icon-sm" variant="ghost" onClick={onDelete} disabled={disabled} aria-label={`حذف اللون ${color}`}>
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>
      <div className="flex gap-2">
        <Input aria-label={`مقاسات ${color}`} placeholder="مقاسات: S:2, M:4 أو S, M" value={sizesValue} onChange={(e) => setSizesValue(e.target.value)} className="h-8"/>
        <Button size="sm" variant="outline" disabled={disabled} onClick={() => {
          const parsed = sizesValue.trim() ? sizesValue.split(',').map((entry) => {
            const [size, quantity] = entry.trim().split(':')
            return { size: size.trim(), stock: quantity === undefined || quantity.trim() === '' ? null : Number(quantity) }
          }) : []
          onSaveSizes(parsed)
        }}>حفظ المقاسات</Button>
      </div>
      <div className="flex flex-col gap-1">
        <ImagePicker compact title={`صورة ${color}`} imageUrl={imageUrl} file={imageFile} onFileChange={setImageFile} />
        {imageFile ? (
          <Button type="button" size="sm" variant="outline" disabled={imagePending || disabled} onClick={saveImage}>
            <Check className="size-3.5" />
            {imagePending ? 'جارٍ رفع الصورة...' : 'حفظ صورة اللون'}
          </Button>
        ) : null}
        {imageError ? <p role="alert" className="text-xs text-destructive">{imageError}</p> : null}
      </div>
    </li>
  )
}
