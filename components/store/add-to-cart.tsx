'use client'

import { useState } from 'react'
import Link from 'next/link'

const KEY = 'alanoud-cart-v1'
type SizeVariant = { size: string; stock: number | null }
type ColorVariant = { color: string; stock: number | null; imageUrl: string | null; galleryUrls: string[]; sizes: SizeVariant[] }
type CartLine = { modelId: number; color: string; size?: string; quantity: number }

export default function AddToCart({ modelId, colors }: { modelId: number; colors: ColorVariant[] }) {
  const [color, setColor] = useState(colors[0]?.color || '')
  const [selectedSizes, setSelectedSizes] = useState<Record<string, number>>({})
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const selected = colors.find((variant) => variant.color === color)
  const sizeVariants = selected?.sizes ?? []
  const availableSizes = sizeVariants.filter((variant) => variant.stock === null || variant.stock > 0)
  const trackedStock = selected?.stock
  const stock = trackedStock == null ? 500 : trackedStock
  const chosenCount = Object.keys(selectedSizes).length

  function toggleSize(size: string) {
    setSelectedSizes((current) => {
      const next = { ...current }
      if (size in next) delete next[size]
      else next[size] = 1
      return next
    })
    setMessage('')
  }

  function add() {
    if (!selected) return
    const additions: CartLine[] = sizeVariants.length
      ? Object.entries(selectedSizes).map(([size, amount]) => ({ modelId, color, size, quantity: amount }))
      : [{ modelId, color, quantity }]

    if (additions.reduce((sum, line) => sum + line.quantity, 0) > 50) {
      setMessage('الحد الأقصى للطلب 50 قطعة. قلّلي الكميات قبل الإضافة.')
      return
    }
    if (!additions.length || additions.some((line) => {
      const variant = sizeVariants.find((entry) => entry.size === line.size)
      const available = sizeVariants.length ? (variant?.stock ?? 500) : stock
      return line.quantity < 1 || line.quantity > Math.min(20, available)
    })) return

    let items: CartLine[] = []
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]')
      if (Array.isArray(saved)) items = saved
    } catch {
      items = []
    }

    for (const line of additions) {
      const found = items.find((entry) =>
        entry.modelId === modelId && entry.color === color && (entry.size || '') === (line.size || ''),
      )
      const variant = sizeVariants.find((entry) => entry.size === line.size)
      const available = sizeVariants.length ? (variant?.stock ?? 500) : stock
      if (found) found.quantity = Math.min(20, available, found.quantity + line.quantity)
      else items.push({ ...line, quantity: Math.min(20, available, line.quantity) })
    }

    localStorage.setItem(KEY, JSON.stringify(items))
    setMessage(sizeVariants.length
      ? `تمت إضافة ${additions.length} مقاس/مقاسات إلى السلة`
      : 'تمت إضافة المنتج إلى السلة')
    setSelectedSizes({})
    setQuantity(1)
  }

  return (
    <div className="mt-8 space-y-4">
      <label className="block text-sm font-semibold">
        اختاري اللون
        <select
          value={color}
          onChange={(event) => {
            setColor(event.target.value)
            setSelectedSizes({})
            setQuantity(1)
            setMessage('')
          }}
          className="mt-2 w-full rounded-xl border bg-white p-3"
        >
          {colors.map((variant) => <option key={variant.color} value={variant.color}>{variant.color}</option>)}
        </select>
      </label>

      {selected && (selected.imageUrl || selected.galleryUrls.length) ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">صور لون {selected.color}</p>
          <div className="flex flex-wrap gap-2">
            {[selected.imageUrl, ...(selected.galleryUrls ?? [])].filter((url): url is string => Boolean(url)).map((url, index) => (
              <img key={url + index} src={url} alt={`لون ${selected.color} - صورة ${index + 1}`} loading="lazy" className="size-20 rounded-lg border object-cover" />
            ))}
          </div>
        </div>
      ) : null}

      {sizeVariants.length > 0 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">اختاري المقاس أو أكثر</legend>
          <div className="flex flex-wrap gap-2">
            {availableSizes.map((variant) => {
              const active = variant.size in selectedSizes
              return (
                <button
                  key={variant.size}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSize(variant.size)}
                  className={`min-w-14 rounded-xl border px-4 py-3 text-sm font-semibold transition ${active ? 'border-[#765637] bg-[#765637] text-white' : 'border-stone-300 bg-white text-[#29251f] hover:border-[#765637]'}`}
                >
                  {variant.size}
                </button>
              )
            })}
          </div>
          {chosenCount > 0 ? (
            <div className="space-y-2">
              {Object.entries(selectedSizes).map(([size, amount]) => {
                const variant = sizeVariants.find((entry) => entry.size === size)
                const max = Math.min(20, variant?.stock ?? 500)
                return (
                  <div key={size} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-3">
                    <span className="text-sm font-semibold">مقاس {size}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-500">الكمية</span>
                      <input
                        aria-label={`كمية مقاس ${size}`}
                        type="number"
                        min={1}
                        max={max}
                        value={amount}
                        onChange={(event) => {
                          const next = Math.max(1, Math.min(max, Number(event.target.value) || 1))
                          setSelectedSizes((current) => ({ ...current, [size]: next }))
                        }}
                        className="w-20 rounded-lg border p-2 text-center"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-stone-500">اضغطي على المقاسات المطلوبة، وبعدها حددي كمية كل مقاس.</p>
          )}
        </fieldset>
      ) : (
        <label className="block text-sm font-semibold">
          الكمية
          <input
            type="number"
            min={1}
            max={Math.min(20, stock)}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Math.min(20, stock, Number(event.target.value) || 1)))}
            className="mt-2 w-28 rounded-xl border bg-white p-3"
          />
        </label>
      )}

      <button
        type="button"
        onClick={add}
        disabled={!selected || (sizeVariants.length > 0 ? chosenCount === 0 : quantity < 1 || quantity > Math.min(20, stock))}
        className="rounded-full bg-[#765637] px-7 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        أضيفي إلى السلة
      </button>
      {message && (
        <p role="status" className="text-sm text-green-700">
          {message} · <Link className="underline" href="/cart">عرض السلة</Link>
        </p>
      )}
    </div>
  )
}
