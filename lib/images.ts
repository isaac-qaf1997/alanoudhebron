export function cloudinaryImageUrl(url: string | null | undefined, width: number): string | null {
  if (!url) return null
  if (!url.startsWith('https://res.cloudinary.com/')) return url
  return url.replace(
    '/image/upload/',
    `/image/upload/f_auto,q_auto:good,w_${width},c_limit/`,
  )
}
