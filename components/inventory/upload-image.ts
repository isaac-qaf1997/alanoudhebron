export async function uploadInventoryImage(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
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
