import Link from 'next/link'
import { ClipboardList, Package, ArrowLeft } from 'lucide-react'
import { getOrders } from '@/lib/queries'

export default async function StaffHomePage() {
  const orders = await getOrders()
  const activeOrders = orders.filter((order) => !['delivered', 'cancelled', 'returned'].includes(order.status)).length

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#493724] to-[#241b13] p-6 text-white shadow-lg">
        <p className="text-xs text-[#e8d1ad]">أهلاً بك في فريق العنود</p>
        <h1 className="mt-2 text-2xl font-bold">شو بدنا ننجز اليوم؟</h1>
        <p className="mt-2 text-sm text-[#e4d7c5]">تابع الطلبات وجهّز كشوف التوصيل من مكان واحد.</p>
        <div className="mt-6 flex items-end justify-between">
          <div><p className="text-xs text-[#d5c2a7]">الطلبات غير المكتملة</p><p className="mt-1 text-4xl font-bold tabular-nums">{activeOrders}</p></div>
          <Package className="size-12 text-[#d9b77d]" />
        </div>
      </section>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href="/staff/orders" className="flex min-h-28 items-center justify-between rounded-2xl border border-[#e8dfd2] bg-white p-5 shadow-sm transition hover:border-[#c6a574]">
          <div><Package className="mb-3 size-6 text-[#98703b]" /><h2 className="font-bold">إدارة الطلبات</h2><p className="mt-1 text-xs text-[#8a8175]">عرض الطلبات وتحديث حالتها</p></div><ArrowLeft className="size-5 text-[#a18c6d]" />
        </Link>
        <Link href="/staff/delivery-sheet" className="flex min-h-28 items-center justify-between rounded-2xl border border-[#e8dfd2] bg-white p-5 shadow-sm transition hover:border-[#c6a574]">
          <div><ClipboardList className="mb-3 size-6 text-[#98703b]" /><h2 className="font-bold">كشف التوصيل</h2><p className="mt-1 text-xs text-[#8a8175]">الكشف اليومي وتصدير Excel</p></div><ArrowLeft className="size-5 text-[#a18c6d]" />
        </Link>
      </div>
      <p className="rounded-xl bg-white px-4 py-3 text-xs leading-6 text-[#7d7263]">هذا التطبيق مخصص لفريق العمل. بيانات المنتجات والمخزون والطلبات متصلة مباشرة بقاعدة بيانات متجر العنود الحالية.</p>
    </div>
  )
}
