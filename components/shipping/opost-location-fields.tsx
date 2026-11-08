'use client'

import { useEffect, useState } from 'react'

type LocationOption = { id: string; name: string }
// Reuse carrier locations while the shopper navigates between checkout/admin forms.
let citiesCache: LocationOption[] | null = null
let citiesRequest: Promise<LocationOption[]> | null = null
const areasCache = new Map<string, LocationOption[]>()
const areasRequests = new Map<string, Promise<LocationOption[]>>()

async function loadCities() {
  if (citiesCache) return citiesCache
  if (!citiesRequest) {
    citiesRequest = fetch('/api/shipping/opost/locations')
      .then(async response => {
        const data = await response.json()
        if (!response.ok || !data.ok || !Array.isArray(data.cities) || !data.cities.length) throw new Error('no city list')
        citiesCache = data.cities
        return citiesCache
      })
      .catch(error => { citiesRequest = null; throw error })
  }
  return citiesRequest
}

async function loadAreas(cityId: string) {
  const cached = areasCache.get(cityId)
  if (cached) return cached
  let request = areasRequests.get(cityId)
  if (!request) {
    request = fetch(`/api/shipping/opost/locations?cityId=${encodeURIComponent(cityId)}`)
      .then(async response => {
        const data = await response.json()
        if (!response.ok || !data.ok || !Array.isArray(data.areas)) throw new Error('no area list')
        areasCache.set(cityId, data.areas)
        return data.areas
      })
      .catch(error => { areasRequests.delete(cityId); throw error })
    areasRequests.set(cityId, request)
  }
  return request
}

type Props = {
  city: string
  area: string
  onCityChange: (value: string) => void
  onAreaChange: (value: string) => void
  cityId?: string
  onCityIdChange?: (value: string) => void
}

export function OpostLocationFields({ city, area, onCityChange, onAreaChange, cityId, onCityIdChange }: Props) {
  const [cities, setCities] = useState<LocationOption[]>([])
  const [areas, setAreas] = useState<LocationOption[]>([])
  const [loadingCities, setLoadingCities] = useState(true)
  const [loadingAreas, setLoadingAreas] = useState(false)
  const [failed, setFailed] = useState(false)
  const [manualCity, setManualCity] = useState(false)
  const [manualArea, setManualArea] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState(cityId || '')

  useEffect(() => {
    let active = true
    loadCities()
      .then(data => {
        if (!active) return
        setCities(data)
        const existing = data.find((item: LocationOption) => item.name === city)
        if (existing) {
          setSelectedCityId(existing.id)
          onCityIdChange?.(existing.id)
        } else if (city) {
          setManualCity(true)
        }
      })
      .catch(() => { if (active) setFailed(true) })
      .finally(() => { if (active) setLoadingCities(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedCityId || manualCity) { setAreas([]); return }
    let active = true
    setLoadingAreas(true)
    loadAreas(selectedCityId)
      .then(data => {
        if (!active) return
        setAreas(data)
        if (area && !data.some((item: LocationOption) => item.name === area)) {
          onAreaChange('')
        }
      })
      .catch(() => { if (active) setFailed(true) })
      .finally(() => { if (active) setLoadingAreas(false) })
    return () => { active = false }
  }, [selectedCityId, manualCity])

  function chooseCity(value: string) {
    if (value === '__manual__') {
      setManualCity(true)
      setSelectedCityId('')
      onCityIdChange?.('')
      onCityChange('')
      onAreaChange('')
      return
    }
    const option = cities.find(item => item.id === value)
    if (!option) return
    setManualCity(false)
    setSelectedCityId(option.id)
    onCityIdChange?.(option.id)
    onCityChange(option.name)
    onAreaChange('')
    setManualArea(false)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm">
        المدينة
        {manualCity || failed ? (
          <input required maxLength={80} value={city} onChange={e => { onCityChange(e.target.value); onAreaChange('') }} className="mt-2 w-full rounded-xl border p-3" placeholder="اكتبي المدينة"/>
        ) : (
          <select required value={selectedCityId} onChange={e => chooseCity(e.target.value)} className="mt-2 w-full rounded-xl border p-3" disabled={loadingCities}>
            <option value="">{loadingCities ? 'جارٍ تحميل المدن…' : 'اختاري المدينة'}</option>
            {cities.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            <option value="__manual__">المدينة غير موجودة — إدخال يدوي</option>
          </select>
        )}
      </label>
      <label className="block text-sm">
        المنطقة / الحي
        {manualArea || manualCity || failed ? (
          <input required maxLength={100} value={area} onChange={e => onAreaChange(e.target.value)} className="mt-2 w-full rounded-xl border p-3" placeholder="اكتبي المنطقة أو الحي"/>
        ) : (
          <select required value={manualArea ? '__manual__' : area} onChange={e => {
            if (e.target.value === '__manual__') {
              setManualArea(true)
              onAreaChange('')
            } else {
              setManualArea(false)
              onAreaChange(e.target.value)
            }
          }} className="mt-2 w-full rounded-xl border p-3" disabled={!selectedCityId || loadingAreas}>
            <option value="">{loadingAreas ? 'جارٍ تحميل الأحياء…' : selectedCityId ? 'اختاري المنطقة / الحي' : 'اختاري المدينة أولاً'}</option>
            {areas.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}
            <option value="__manual__">المنطقة غير موجودة — إدخال يدوي</option>
          </select>
        )}
        {manualArea && !manualCity && !failed ? (
          <button type="button" onClick={() => { setManualArea(false); onAreaChange('') }} className="mt-1 text-xs text-[#765637] underline">اختيار حي من قائمة شركة التوصيل</button>
        ) : null}
        {!manualArea && !manualCity && !failed && areas.length > 0 ? (
          <span className="mt-1 block text-xs text-stone-500">القائمة محدثة من شركة التوصيل؛ اختاري الحي كما يظهر عندهم.</span>
        ) : null}
      </label>
      {failed ? <p className="sm:col-span-2 text-xs text-amber-700">تعذر جلب القائمة من شركة التوصيل؛ يمكنكِ إدخال العنوان يدوياً، وسيُراجع قبل إرسال الشحنة.</p> : null}
    </div>
  )
}
