import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 1800

const BASE = 'https://o.opost.ps'
type ApiRecord = Record<string, unknown>

function root(payload: unknown): ApiRecord | null {
  if (Array.isArray(payload)) {
    if (payload.length === 1 && payload[0] && typeof payload[0] === 'object') return root(payload[0])
    return null
  }
  return payload && typeof payload === 'object' ? payload as ApiRecord : null
}
function records(payload: unknown): ApiRecord[] {
  const r = root(payload)
  if (!r) return Array.isArray(payload) ? payload as ApiRecord[] : []
  for (const key of ['data', 'results', 'cities', 'areas']) {
    if (Array.isArray(r[key])) return r[key] as ApiRecord[]
    if (r[key] && typeof r[key] === 'object') {
      const nested = records(r[key])
      if (nested.length) return nested
    }
  }
  return []
}
function nextPage(payload: unknown): string | null {
  const r = root(payload)
  const pagination = r?.pagination
  if (!pagination || typeof pagination !== 'object') return null
  const next = (pagination as ApiRecord).next_page_url
  return typeof next === 'string' && next.trim() ? next : null
}
function name(row: ApiRecord) {
  return String(row.name ?? row.title ?? row.label ?? row.ar_name ?? row.name_ar ?? row.area_name ?? row.areaName ?? row.name_arabic ?? row.arabic_name ?? row.name_en ?? row.english_name ?? '').trim()
}
function id(row: ApiRecord) {
  return String(row.id ?? row.value ?? row.area_id ?? row.areaId ?? '').trim()
}
async function getAll(path: string, token: string) {
  let url = new URL(path, BASE).toString()
  const seen = new Set<string>()
  const output: ApiRecord[] = []
  for (let page = 0; page < 30 && url; page++) {
    const parsed = new URL(url)
    if (parsed.origin !== BASE || !parsed.pathname.startsWith('/api/resources/')) throw new Error('Invalid Opost pagination URL')
    if (seen.has(parsed.toString())) throw new Error('Repeated Opost pagination URL')
    seen.add(parsed.toString())
    const response = await fetch(parsed, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      next: { revalidate: 1800 },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(`Opost HTTP ${response.status}`)
    const payload: unknown = await response.json()
    output.push(...records(payload))
    const next = nextPage(payload)
    if (!next) return output
    const nextUrl = new URL(next, BASE)
    if (nextUrl.origin !== BASE || !nextUrl.pathname.startsWith('/api/resources/')) throw new Error('Invalid Opost next page')
    // Opost's pagination links may omit the original filters (e.g. `city=3`).
    // Carry forward every original query parameter except `page` so later pages
    // remain scoped to the selected city instead of silently loading all areas.
    const originalUrl = new URL(path, BASE)
    for (const [key, value] of originalUrl.searchParams) {
      if (key !== 'page' && !nextUrl.searchParams.has(key)) nextUrl.searchParams.set(key, value)
    }
    url = nextUrl.toString()
  }
  if (url) throw new Error('Opost location list exceeds the safe page limit')
  return output
}

export async function GET(request: NextRequest) {
  const token = process.env.OPOST_ACCESS_TOKEN
  if (!token) return NextResponse.json({ ok: false, error: 'قائمة شركة التوصيل غير متاحة حالياً.' }, { status: 503 })
  try {
    const cityId = request.nextUrl.searchParams.get('cityId')
    if (cityId) {
      if (!/^\d{1,12}$/.test(cityId)) return NextResponse.json({ ok: false, error: 'المدينة المحددة غير صالحة.' }, { status: 400 })
      const cities = await getAll('/api/resources/cities', token)
      const city = cities.find(row => id(row) === cityId)
      if (!city) return NextResponse.json({ ok: false, error: 'المدينة غير موجودة في قائمة شركة التوصيل.' }, { status: 404 })
      const areas = await getAll(`/api/resources/areas?city=${encodeURIComponent(cityId)}`, token)
      return NextResponse.json({
        ok: true,
        areas: areas.map(row => ({ id: id(row), name: name(row) })).filter(row => row.id && row.name),
      }, { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } })
    }
    const cities = await getAll('/api/resources/cities', token)
    return NextResponse.json({
      ok: true,
      cities: cities.map(row => ({ id: id(row), name: name(row) })).filter(row => row.id && row.name),
    }, { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } })
  } catch (error) {
    console.error('[opost-locations]', error)
    return NextResponse.json({ ok: false, error: 'تعذر تحميل مناطق شركة التوصيل حالياً.' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
