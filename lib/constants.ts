export const REGIONS = {
  west_bank: { label: 'مناطق الضفة', fee: 20 },
  jerusalem: { label: 'القدس', fee: 30 },
  area_67: { label: 'مناطق 67', fee: 50 },
  inside: { label: 'مناطق الداخل', fee: 70 },
} as const

export type RegionKey = keyof typeof REGIONS

export const REGION_KEYS = Object.keys(REGIONS) as RegionKey[]

export function isRegion(value: string): value is RegionKey {
  return Object.prototype.hasOwnProperty.call(REGIONS, value)
}

export const STATUSES = {
  preparing: { label: 'قيد التجهيز', tone: 'muted' },
  shipped: { label: 'قيد التوصيل', tone: 'warning' },
  delivered: { label: 'تم التسليم', tone: 'success' },
  returned: { label: 'راجع', tone: 'destructive' },
  cancelled: { label: 'ملغي', tone: 'muted' },
} as const

export type StatusKey = keyof typeof STATUSES

export const STATUS_KEYS = Object.keys(STATUSES) as StatusKey[]

export function isStatus(value: string): value is StatusKey {
  return Object.prototype.hasOwnProperty.call(STATUSES, value)
}

export const INACTIVE_STATUSES: StatusKey[] = ['returned', 'cancelled']

export const CITY_REGIONS: Record<string, RegionKey> = {
  'رام الله': 'west_bank',
  'البيرة': 'west_bank',
  'نابلس': 'west_bank',
  'الخليل': 'west_bank',
  'جنين': 'west_bank',
  'طولكرم': 'west_bank',
  'قلقيلية': 'west_bank',
  'بيت لحم': 'west_bank',
  'أريحا': 'west_bank',
  'سلفيت': 'west_bank',
  'طوباس': 'west_bank',
  'القدس': 'jerusalem',
  'بيت حنينا': 'jerusalem',
  'شعفاط': 'jerusalem',
  'العيزرية': 'jerusalem',
  'الناصرة': 'inside',
  'حيفا': 'inside',
  'يافا': 'inside',
  'عكا': 'inside',
  'أم الفحم': 'inside',
  'الطيبة': 'inside',
  'الطيرة': 'inside',
  'سخنين': 'inside',
  'رهط': 'inside',
  'اللد': 'inside',
  'الرملة': 'inside',
  'باقة الغربية': 'inside',
  'كفر قاسم': 'inside',
}

export const CITIES = Object.keys(CITY_REGIONS)

export function courierFeeFor(
  courier: { feeWestBank: number; feeJerusalem: number; feeArea67: number; feeInside: number } | null | undefined,
  region: RegionKey,
) {
  if (!courier) return 0
  if (region === 'west_bank') return courier.feeWestBank
  if (region === 'jerusalem') return courier.feeJerusalem
  if (region === 'area_67') return courier.feeArea67
  return courier.feeInside
}
