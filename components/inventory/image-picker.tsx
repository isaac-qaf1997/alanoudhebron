'use client'

import { ImagePlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { cloudinaryImageUrl } from '@/lib/images'

type ImagePickerProps = {
  title: string
  imageUrl?: string | null
  file: File | null
  onFileChange: (file: File | null) => void
  compact?: boolean
}

const MAX_FILE_SIZE = 4 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function ImagePicker({ title, imageUrl, file, onFileChange, compact = false }: ImagePickerProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null
    event.target.value = ''
    setError(null)
    if (!selected) return
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError('اختاري صورة بصيغة JPG أو PNG أو WebP')
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setError('حجم الصورة أكبر من 4 ميغابايت')
      return
    }
    onFileChange(selected)
  }

  const source = previewUrl || cloudinaryImageUrl(imageUrl, compact ? 160 : 240)

  return (
    <div className={cn('flex min-w-0 items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-2', compact ? 'gap-2' : 'p-3')}>
      <div className={cn('grid shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground', compact ? 'size-11' : 'size-16')}>
        {source ? (
          // The source is a Cloudinary URL or a temporary local preview URL.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={source} alt={`معاينة ${title}`} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <ImagePlus className={compact ? 'size-4' : 'size-6'} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn('truncate text-sm font-medium', compact && 'text-xs')}>{title}</span>
        <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted">
          <ImagePlus className="size-3.5" />
          {file ? 'تغيير الصورة المختارة' : imageUrl ? 'تغيير الصورة' : 'اختيار صورة'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleChange} />
        </label>
        {file ? <span className="truncate text-[11px] text-muted-foreground">{file.name}</span> : null}
        {error ? <span role="alert" className="text-xs text-destructive">{error}</span> : null}
      </div>
    </div>
  )
}
