'use client'

import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import {
  addModelColor,
  deleteModel,
  deleteModelColor,
  setColorStock,
  saveColorSizes,
  setModelPublished,
  updateModel,
  updateModelColorImage,
  updateModelGallery,
  updateModelColorGallery,
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
  const [modelGalleryFiles, setModelGalleryFiles] = useState<File[]>([])
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

      <div className="flex flex-col gap-2 rounded-lg border border-border/70 p-3">
        <div className="text-sm font-medium">معرض صور الموديل · {model.galleryUrls.length} صورة</div>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setModelGalleryFiles(Array.from(e.target.files ?? []).slice(0, 20))} className="text-xs" />
        {modelGalleryFiles.length ? <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => act(async () => {
          const urls = await Promise.all(modelGalleryFiles.map(uploadInventoryImage))
          return updateModelGallery(model.id, [...model.galleryUrls, ...urls])
        }, () => setModelGalleryFiles([]))}>رفع {modelGalleryFiles.length} صورة إضافية</Button> : null}
        {model.galleryUrls.length ? <div className="flex flex-wrap gap-2">{model.galleryUrls.map((url, index) => <img key={url + index} src={url} alt={`صورة إضافية ${index + 1}`} className="size-14 rounded-md object-cover" />)}</div> : <p className="text-xs text-muted-foreground">لا توجد صور إضافية بعد.</p>}
      </div>
      <ul className="flex flex-col gap-3">
        {model.colors.map((c) => (
          <ColorRow
            key={c.id}
            color={c.color}
            stock={c.stock}
            sizes={c.sizes}
            imageUrl={c.imageUrl}
            galleryUrls={c.galleryUrls}
            disabled={pending}
            onSave={(stock) => act(() => setColorStock(c.id, stock))}
            onSaveSizes={(sizes) => act(() => saveColorSizes(c.id, sizes))}
            onSaveGallery={async (files) => {
              const urls = await Promise.all(files.map(uploadInventoryImage))
              const result = await updateModelColorGallery(c.id, [...c.galleryUrls, ...urls])
              if (!result.ok) throw new Error(result.error)
            }}
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

let nextSizeDraftKey = -1

function ColorRow({
  color,
  stock,
  sizes,
  imageUrl,
  galleryUrls,
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
  galleryUrls: string[]
  disabled: boolean
  onSave: (stock: number | null) => void
  onSaveSizes: (sizes: { size: string; stock: number | null }[]) => void
  onSaveImage: (file: File) => Promise<void>
  onSaveGallery: (files: File[]) => Promise<void>
  onDelete: () => void
}) {
  const [value, setValue] = useState<number | null>(stock)
  const [sizeRows, setSizeRows] = useState(() => sizes.map((size) => ({
    key: size.id,
    size: size.size,
    stock: size.stock,
  })))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePending, setImagePending] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryPending, setGalleryPending] = useState(false)
  const [galleryError, setGalleryError] = useState<string | null>(null)
  const low = stock !== null && stock <= 2

  useEffect(() => {
    setValue(stock)
    setSizeRows(sizes.map((size) => ({ key: size.id, size: size.size, stock: size.stock })))
  }, [stock, sizes])

  const total = sizeRows.reduce((sum, size) => sum + (size.stock ?? 0), 0)
  const hasUntracked = sizeRows.some((size) => size.stock === null)

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

  function saveSizes() {
    const clean = sizeRows.filter((entry) => entry.size.trim()).map(({ size, stock: quantity }) => ({
      size: size.trim(),
      stock: quantity,
    }))
    onSaveSizes(clean)
  }

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border/60 p-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex-1 truncate font-medium">{color}</span>
        {sizeRows.length ? (
          <span className="text-xs text-muted-foreground">{sizeRows.length} مقاسات · {total} قطعة{hasUntracked ? ' + غير محدد' : ''}</span>
        ) : <>
          {low ? <span className="text-xs text-destructive">{stock === 0 ? 'نفد' : 'منخفض'}</span> : null}
          <Input aria-label={`كمية ${color}`} type="number" min={0} placeholder="غير متابع" value={value ?? ''} onChange={(e) => setValue(e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0))} className={cn('h-8 w-24', low && 'border-destructive/50')} />
          <Button size="icon-sm" variant={value !== stock ? 'default' : 'ghost'} disabled={disabled || value === stock} onClick={() => onSave(value)} aria-label={`حفظ كمية ${color}`}><Check className="size-4" /></Button>
        </>}
        <Button size="icon-sm" variant="ghost" onClick={onDelete} disabled={disabled} aria-label={`حذف اللون ${color}`}>
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="rounded-md bg-muted/30 p-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-xs font-medium">المقاسات والكميات</span>
          {sizeRows.length ? <span className="text-xs text-muted-foreground">المجموع: {total} قطعة{hasUntracked ? ' · بعض الكميات غير محددة' : ''}</span> : <span className="text-xs text-muted-foreground">لا توجد مقاسات</span>}
        </div>
        {sizeRows.map((entry, index) => (
          <div key={entry.key} className="mb-2 grid grid-cols-[1fr_88px_auto] gap-2">
            <Input aria-label={`اسم المقاس ${index + 1}`} placeholder="38 أو S أو ون سايز" value={entry.size} className="h-9"
              onChange={(e) => setSizeRows((rows) => rows.map((row) => row.key === entry.key ? { ...row, size: e.target.value } : row))} />
            <Input aria-label={`كمية المقاس ${entry.size || index + 1}`} type="number" min={0} placeholder="الكمية" value={entry.stock ?? ''} className="h-9"
              onChange={(e) => setSizeRows((rows) => rows.map((row) => row.key === entry.key ? { ...row, stock: e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0) } : row))} />
            <Button type="button" size="icon" variant="ghost" aria-label="حذف المقاس" onClick={() => setSizeRows((rows) => rows.filter((row) => row.key !== entry.key))}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setSizeRows((rows) => [...rows, { key: nextSizeDraftKey--, size: '', stock: 0 }])}>
            <Plus className="size-3.5" /> إضافة مقاس
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={saveSizes}>
            <Check className="size-3.5" /> حفظ المقاسات والكميات
          </Button>
          {sizeRows.length ? <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => setSizeRows([])}>إلغاء المقاسات</Button> : null}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium">صور إضافية للون {color} · {galleryUrls.length}</div>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []).slice(0, 20))} className="text-xs" />
        {galleryFiles.length ? <Button type="button" size="sm" variant="outline" disabled={galleryPending || disabled} onClick={async () => {
          setGalleryPending(true); setGalleryError(null)
          try { await onSaveGallery(galleryFiles); setGalleryFiles([]) }
          catch (error) { setGalleryError(error instanceof Error ? error.message : 'تعذر حفظ الصور') }
          finally { setGalleryPending(false) }
        }}>{galleryPending ? 'جارٍ رفع الصور...' : `رفع ${galleryFiles.length} صور`}</Button> : null}
        {galleryError ? <p role="alert" className="text-xs text-destructive">{galleryError}</p> : null}
        {galleryUrls.length ? <div className="flex flex-wrap gap-2">{galleryUrls.map((url, index) => <img key={url + index} src={url} alt={`صورة ${color} ${index + 1}`} className="size-12 rounded-md object-cover" />)}</div> : null}
        <ImagePicker compact title={`الصورة الرئيسية للون ${color}`} imageUrl={imageUrl} file={imageFile} onFileChange={setImageFile} />
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
