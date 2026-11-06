import { createHash, randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

function cloudinarySignature(params: Record<string, string>, apiSecret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')
  return createHash('sha1').update(`${toSign}${apiSecret}`).digest('hex')
}

export async function POST(request: Request) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: 'رفع الصور غير مفعّل بعد. أضيفي مفاتيح Cloudinary إلى إعدادات البيئة.' },
      { status: 503 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'تعذر قراءة ملف الصورة' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'اختاري صورة أولاً' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'صيغة الصورة يجب أن تكون JPG أو PNG أو WebP' }, { status: 415 })
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'حجم الصورة يجب ألا يتجاوز 4 ميغابايت' }, { status: 413 })
  }

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const folder = 'alanoud/inventory'
  const publicId = `image_${randomUUID()}`
  const params = { folder, public_id: publicId, timestamp }
  const body = new FormData()
  body.append('file', file, file.name)
  body.append('api_key', apiKey)
  body.append('timestamp', timestamp)
  body.append('folder', folder)
  body.append('public_id', publicId)
  body.append('signature', cloudinarySignature(params, apiSecret))

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body,
      cache: 'no-store',
    })
    const result = (await response.json()) as { secure_url?: string; error?: { message?: string } }
    if (!response.ok || !result.secure_url) {
      console.error('[image upload] Cloudinary rejected the upload:', result.error?.message ?? response.status)
      return NextResponse.json({ error: 'تعذر رفع الصورة إلى التخزين السحابي. تحققي من إعدادات Cloudinary.' }, { status: 502 })
    }
    return NextResponse.json({ url: result.secure_url })
  } catch (error) {
    console.error('[image upload]', error)
    return NextResponse.json({ error: 'تعذر الاتصال بخدمة تخزين الصور' }, { status: 502 })
  }
}
