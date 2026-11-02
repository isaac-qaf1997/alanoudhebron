'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/field'
import { monthStart, shiftDays } from '@/lib/format'
import { cn } from '@/lib/utils'

export function DateRangeFilter({ from, to, today }: { from: string; to: string; today: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [range, setRange] = useState({ from, to })

  const presets = [
    { label: 'اليوم', from: today, to: today },
    { label: 'آخر 7 أيام', from: shiftDays(today, -6), to: today },
    { label: 'هذا الشهر', from: monthStart(today), to: today },
    { label: 'آخر 90 يوم', from: shiftDays(today, -89), to: today },
  ]

  function apply(next: { from: string; to: string }) {
    const ordered = next.from <= next.to ? next : { from: next.to, to: next.from }
    setRange(ordered)
    startTransition(() => router.push(`/?from=${ordered.from}&to=${ordered.to}`))
  }

  return (
    <div className={cn('flex flex-col gap-3 rounded-2xl border border-border bg-card p-3', pending && 'opacity-70')}>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const active = p.from === from && p.to === to
          return (
            <Button
              key={p.label}
              size="sm"
              variant={active ? 'default' : 'ghost'}
              onClick={() => apply(p)}
              aria-pressed={active}
            >
              {p.label}
            </Button>
          )
        })}
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          apply(range)
        }}
      >
        <div className="flex flex-col gap-1">
          <Label htmlFor="range-from" className="text-xs text-muted-foreground">
            من تاريخ
          </Label>
          <Input
            id="range-from"
            type="date"
            value={range.from}
            max={today}
            onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
            className="h-9 w-40"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="range-to" className="text-xs text-muted-foreground">
            إلى تاريخ
          </Label>
          <Input
            id="range-to"
            type="date"
            value={range.to}
            max={today}
            onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
            className="h-9 w-40"
            required
          />
        </div>
        <Button type="submit" variant="outline" className="h-9" disabled={pending}>
          تطبيق
        </Button>
      </form>
    </div>
  )
}
