import { StatusBadge } from '@/components/status-badge'
import { Panel } from '@/components/ui/panel'
import { STATUS_KEYS, type StatusKey } from '@/lib/constants'

export function StatusPanel({ counts, total }: { counts: Record<StatusKey, number>; total: number }) {
  return (
    <Panel title="توزيع الحالات">
      <ul className="flex flex-col gap-3">
        {STATUS_KEYS.map((status) => {
          const count = counts[status] ?? 0
          const pct = total ? Math.round((count / total) * 100) : 0
          return (
            <li key={status} className="flex items-center justify-between text-sm">
              <StatusBadge status={status} />
              <span className="tabular-nums text-muted-foreground">
                {count} · {pct}%
              </span>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
