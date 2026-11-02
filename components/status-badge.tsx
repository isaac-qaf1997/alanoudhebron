import { REGIONS, STATUSES, isRegion, isStatus } from '@/lib/constants'
import { cn } from '@/lib/utils'

const tones = {
  muted: 'border-border bg-muted text-muted-foreground',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  success: 'border-success/30 bg-success/10 text-success',
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
} as const

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = isStatus(status) ? STATUSES[status] : { label: status, tone: 'muted' as const }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[meta.tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {meta.label}
    </span>
  )
}

export function RegionBadge({ region }: { region: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-info/30 bg-info/10 px-2.5 py-0.5 text-xs font-medium text-info">
      {isRegion(region) ? REGIONS[region].label : region}
    </span>
  )
}
