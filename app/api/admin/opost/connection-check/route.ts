import { NextResponse } from 'next/server'
import { authorizeRole } from '@/lib/auth/session'

const BASE = 'https://o.opost.ps'

type ApiRecord = Record<string, unknown>

function records(payload: unknown): ApiRecord[] {
  if (Array.isArray(payload)) {
    if (payload.length === 1 && payload[0] && typeof payload[0] === 'object' && 'data' in (payload[0] as ApiRecord)) {
      return records(payload[0])
    }
    return payload as ApiRecord[]
  }
  if (!payload || typeof payload !== 'object') return []
  const obj = payload as ApiRecord
  for (const key of ['data', 'results', 'cities', 'areas']) {
    if (Array.isArray(obj[key])) return obj[key] as ApiRecord[]
    if (obj[key] && typeof obj[key] === 'object') {
      const nested = records(obj[key])
      if (nested.length) return nested
    }
  }
  return []
}

function nextPageUrl(payload: unknown): string | null {
  const root = Array.isArray(payload) && payload.length === 1 ? payload[0] : payload
  if (!root || typeof root !== 'object') return null
  const pagination = (root as ApiRecord).pagination
  if (!pagination || typeof pagination !== 'object') return null
  const next = (pagination as ApiRecord).next_page_url
  return typeof next === 'string' && next.trim() ? next : null
}

function label(row: ApiRecord): string {
  return String(row.name ?? row.title ?? row.label ?? row.ar_name ?? row.name_ar ?? '').trim()
}

function idOf(row: ApiRecord): string {
  return String(row.id ?? row.value ?? '').trim()
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[\s_-]+/g, ' ').trim()
}

async function getAll(path: string, token: string): Promise<ApiRecord[]> {
  let nextUrl = new URL(path, BASE).toString()
  const visited = new Set<string>()
  const collected: ApiRecord[] = []

  for (let page = 0; page < 100 && nextUrl; page += 1) {
    const parsed = new URL(nextUrl, BASE)
    if (parsed.origin !== BASE || !parsed.pathname.startsWith('/api/resources/')) {
      throw new Error('رابط صفحة بيانات Opost غير موثوق.')
    }
    const url = parsed.toString()
    if (visited.has(url)) throw new Error('تكرار غير متوقع في صفحات بيانات Opost.')
    visited.add(url)

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) throw new Error(`Opost ردّ برمز HTTP ${response.status}.`)
    const payload: unknown = await response.json()
    collected.push(...records(payload))

    const candidate = nextPageUrl(payload)
    if (!candidate) return collected
    const next = new URL(candidate, BASE)
    if (next.origin !== BASE || !next.pathname.startsWith('/api/resources/')) {
      throw new Error('رابط الصفحة التالية في Opost غير صالح.')
    }
    nextUrl = next.toString()
  }

  if (nextUrl) throw new Error('تجاوز جلب بيانات Opost الحد الآمن لعدد الصفحات (100 صفحة).')
  return collected
}

export async function GET() {
  const user = await authorizeRole('admin')
  if (!user) {
    return NextResponse.json({ ok: false, error: 'غير مصرح. يلزم تسجيل دخول المدير.' }, { status: 401 })
  }

  const token = process.env.OPOST_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json({ ok: false, error: 'رمز اتصال Opost غير مضبوط في بيئة المعاينة.' }, { status: 503 })
  }

  try {
    const cities = await getAll('/api/resources/cities', token)
    const hebron = cities.find((city) => normalize(label(city)) === normalize('الخليل'))
      ?? cities.find((city) => normalize(label(city)) === normalize('Hebron'))

    if (!hebron || !idOf(hebron)) {
      return NextResponse.json({
        ok: false,
        error: 'تم الاتصال بـ Opost، لكن مدينة الخليل لم تظهر في قائمة المدن.',
        citiesCount: cities.length,
      }, { status: 502 })
    }

    const areas = await getAll(`/api/resources/areas?city=${encodeURIComponent(idOf(hebron))}`, token)

    return NextResponse.json({
      ok: true,
      message: 'اتصال Opost ناجح، وتم جلب المدن ومناطق الخليل.',
      citiesCount: cities.length,
      hebronAreasCount: areas.length,
      hebronFound: true,
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'تعذر الاتصال بخدمة Opost.'
    return NextResponse.json({ ok: false, error: message }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
