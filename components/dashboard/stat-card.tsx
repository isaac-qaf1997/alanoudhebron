import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const tones = {
  warning: 'bg-warning/10 text-warning',
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  destructive: 'bg-destructive/10 text-destructive',
} as const

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone: keyof typeof tones
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
      <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground text-pretty">{hint}</p> : null}
      </div>
    </div>
  )
}
