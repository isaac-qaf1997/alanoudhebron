'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Input, Label, Select } from '@/components/ui/field'
import type { Courier } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

export function SheetFilters({
  date,
  courierId,
  couriers,
  today,
}: {
  date: string
  courierId: number | null
  couriers: Courier[]
  today: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function go(next: { date: string; courier: number | null }) {
    const qs = `date=${next.date}${next.courier ? `&courier=${next.courier}` : ''}`
    startTransition(() => router.push(`/delivery-sheet?${qs}`))
  }

  return (
    <div className={cn('flex flex-wrap items-end gap-2', pending && 'opacity-70')}>
      <div className="flex flex-col gap-1">
        <Label htmlFor="sheet-date" className="text-xs text-muted-foreground">
          التاريخ
        </Label>
        <Input
          id="sheet-date"
          type="date"
          value={date}
          max={today}
          onChange={(e) => e.target.value && go({ date: e.target.value, courier: courierId })}
          className="h-9 w-40"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="sheet-courier" className="text-xs text-muted-foreground">
          شركة التوصيل
        </Label>
        <Select
          id="sheet-courier"
          value={courierId ?? ''}
          onChange={(e) => go({ date, courier: Number(e.target.value) || null })}
          className="h-9 w-44"
        >
          <option value="">كل الشركات</option>
          {couriers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
