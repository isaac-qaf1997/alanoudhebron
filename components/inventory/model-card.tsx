'use client'

import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, useTransition } from 'react'
import { addModelColor, deleteModel, deleteModelColor, setColorStock, updateModel } from '@/app/actions'
import type { ActionResult } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { formatMoney } from '@/lib/format'
import type { ModelWithColors } from '@/lib/queries'
import { cn } from '@/lib/utils'

export function ModelCard({ model }: { model: ModelWithColors }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [info, setInfo] = useState({ name: model.name, sku: model.sku ?? '', price: model.price, cost: model.cost })
  const [newColor, setNewColor] = useState({ color: '', stock: 1 })

  const total = model.colors.reduce((s, c) => s + c.stock, 0)

  function act(fn: () => Promise<ActionResult>, onDone?: () => void) {
    setError(null)
    startTransition(async () => {
      const result = await fn()
      if (result.ok) onDone?.()
      else setError(result.error)
    })
  }

  return (
    <article className={cn('flex flex-col gap-4 rounded-xl border border-border bg-background/40 p-4', pending && 'opacity-60')}>
      {editing ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            act(() => updateModel(model.id, info), () => setEditing(false))
          }}
        >
          <Input aria-label="اسم الموديل" value={info.name} onChange={(e) => setInfo((i) => ({ ...i, name: e.target.value }))} required />
          <div className="grid grid-cols-3 gap-2">
            <Input aria-label="الرمز" dir="ltr" placeholder="SKU" value={info.sku} onChange={(e) => setInfo((i) => ({ ...i, sku: e.target.value }))} />
            <Input aria-label="سعر البيع" type="number" min={0} step="0.5" value={info.price} onChange={(e) => setInfo((i) => ({ ...i, price: Number(e.target.value) }))} />
            <Input aria-label="التكلفة" type="number" min={0} step="0.5" value={info.cost} onChange={(e) => setInfo((i) => ({ ...i, cost: Number(e.target.value) }))} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              <Check className="size-4" />
              حفظ
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="size-4" />
              إلغاء
            </Button>
          </div>
        </form>
      ) : (
        <header className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">{model.name}</h3>
            <p className="text-xs text-muted-foreground">
              {model.sku ? `${model.sku} · ` : ''}
              سعر {formatMoney(model.price)} · تكلفة {formatMoney(model.cost)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{total} قطعة</span>
            <Button variant="ghost" size="icon-sm" onClick={() => setEditing(true)} aria-label={`تعديل ${model.name}`}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => window.confirm(`حذف موديل ${model.name}؟`) && act(() => deleteModel(model.id))}
              aria-label={`حذف ${model.name}`}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </header>
      )}

      <ul className="flex flex-col gap-2">
        {model.colors.map((c) => (
          <ColorRow
            key={`${c.id}-${c.stock}`}
            color={c.color}
            stock={c.stock}
            disabled={pending}
            onSave={(stock) => act(() => setColorStock(c.id, stock))}
            onDelete={() => window.confirm(`حذف اللون ${c.color}؟`) && act(() => deleteModelColor(c.id))}
          />
        ))}
      </ul>

      <form
        className="grid grid-cols-[1fr_72px_auto] gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          act(() => addModelColor(model.id, newColor.color, newColor.stock), () => setNewColor({ color: '', stock: 1 }))
        }}
      >
        <Input
          aria-label="لون جديد"
          placeholder="لون جديد"
          value={newColor.color}
          onChange={(e) => setNewColor((n) => ({ ...n, color: e.target.value }))}
          className="h-9"
          required
        />
        <Input
          aria-label="كمية اللون الجديد"
          type="number"
          min={0}
          value={newColor.stock}
          onChange={(e) => setNewColor((n) => ({ ...n, stock: Math.max(0, Number(e.target.value) || 0) }))}
          className="h-9"
        />
        <Button type="submit" variant="outline" size="icon" disabled={pending} aria-label="إضافة اللون">
          <Plus className="size-4" />
        </Button>
      </form>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </article>
  )
}

function ColorRow({
  color,
  stock,
  disabled,
  onSave,
  onDelete,
}: {
  color: string
  stock: number
  disabled: boolean
  onSave: (stock: number) => void
  onDelete: () => void
}) {
  const [value, setValue] = useState(stock)
  const low = stock <= 2

  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="flex-1 truncate">{color}</span>
      {low ? <span className="text-xs text-destructive">{stock === 0 ? 'نفد' : 'منخفض'}</span> : null}
      <Input
        aria-label={`كمية ${color}`}
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(Math.max(0, Number(e.target.value) || 0))}
        className={cn('h-8 w-20', low && 'border-destructive/50')}
      />
      <Button
        size="icon-sm"
        variant={value !== stock ? 'default' : 'ghost'}
        disabled={disabled || value === stock}
        onClick={() => onSave(value)}
        aria-label={`حفظ كمية ${color}`}
      >
        <Check className="size-4" />
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={onDelete} disabled={disabled} aria-label={`حذف اللون ${color}`}>
        <Trash2 className="size-4 text-muted-foreground" />
      </Button>
    </li>
  )
}
