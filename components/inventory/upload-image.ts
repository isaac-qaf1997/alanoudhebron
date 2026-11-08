async function prepareImage(file: File): Promise<File> {
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('حجم الصورة كبير جداً. الحد الأقصى قبل الضغط 25 ميغابايت.')
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('اختاري صورة بصيغة JPG أو PNG أو WebP')
  }

  try {
    const bitmap = await createImageBitmap(file)
    const maxDimension = 2200
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('تعذر تجهيز الصورة للرفع')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => value ? resolve(value) : reject(new Error('تعذر ضغط الصورة')),
        'image/webp',
        0.86,
      )
    })

    if (blob.size > 4 * 1024 * 1024) {
      throw new Error('الصورة ما زالت كبيرة بعد الضغط. جرّبي صورة بدقة أقل.')
    }

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() })
  } catch (error) {
    if (file.size <= 4 * 1024 * 1024) return file
    if (error instanceof Error && error.message.includes('بعد الضغط')) throw error
    throw new Error('تعذر ضغط الصورة على هذا الجهاز. جرّبي حفظها بصيغة JPG أو WebP.')
  }
}

export async function uploadInventoryImage(file: File): Promise<string> {
  const prepared = await prepareImage(file)
  const body = new FormData()
  body.append('file', prepared)
  const response = await fetch('/api/uploads', {
    method: 'POST',
    body,
  })
  const result = (await response.json()) as { url?: string; error?: string }
  if (!response.ok || !result.url) {
    throw new Error(result.error || 'تعذر رفع الصورة')
  }
  return result.url
}
