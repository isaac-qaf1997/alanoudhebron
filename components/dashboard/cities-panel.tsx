import { EmptyState, Panel } from '@/components/ui/panel'

export function CitiesPanel({ cities, className }: { cities: [string, number][]; className?: string }) {
  const max = cities[0]?.[1] ?? 0
  return (
    <Panel
      title="التحليل الجغرافي للمدن"
      description="عدد الطرود لكل مدينة لمعرفة أين تذهب أغلب الطلبات"
      className={className}
    >
      {cities.length === 0 ? (
        <EmptyState>ستظهر المدن هنا بعد إنشاء الطلبات.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {cities.slice(0, 10).map(([city, count]) => (
            <li key={city} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 truncate">{city}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${max ? (count / max) * 100 : 0}%` }}
                />
              </span>
              <span className="w-8 shrink-0 text-end font-semibold tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
