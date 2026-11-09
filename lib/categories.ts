export const PRODUCT_CATEGORIES = ['أثواب', 'فستان تطريز', 'أثواب بناتي', 'عبايات', 'غير مصنف'] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]
export function isProductCategory(value: unknown): value is ProductCategory {
  return typeof value === 'string' && (PRODUCT_CATEGORIES as readonly string[]).includes(value)
}
