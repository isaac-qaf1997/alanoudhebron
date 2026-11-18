export default function DashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-5 md:px-6 md:py-6" aria-label="جاري تحميل لوحة الإدارة">
      <div className="mb-6 h-8 w-40 rounded-lg bg-muted" />
      <div className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-border bg-card" />
        ))}
      </div>
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-64 rounded-2xl border border-border bg-card lg:col-span-2" />
        <div className="h-64 rounded-2xl border border-border bg-card" />
      </div>
      <div className="h-56 rounded-2xl border border-border bg-card" />
    </div>
  )
}
