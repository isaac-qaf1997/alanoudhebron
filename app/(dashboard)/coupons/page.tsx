import { requireRole } from '@/lib/auth/session'
import { getCoupons } from '@/lib/queries'
import { CouponManager } from '@/components/dashboard/coupon-manager'

export default async function CouponsPage() {
  await requireRole('admin')
  const coupons = await getCoupons()
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">أكواد الخصم</h1><p className="mt-1 text-sm text-muted-foreground">أنشئي عروضاً ترويجية وشاركي أكوادها مع زبائن المتجر.</p></div>
    <CouponManager coupons={coupons}/>
  </div>
}
