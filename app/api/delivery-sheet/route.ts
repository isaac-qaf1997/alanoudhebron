import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { REGIONS, STATUSES, isRegion, isStatus } from '@/lib/constants'
import { isDateString, localDateString } from '@/lib/format'
import { getDeliverySheet } from '@/lib/queries'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const url = new URL(request.url)
  const dateParam = url.searchParams.get('date')
  const date = isDateString(dateParam) ? dateParam : localDateString()
  const courierId = Number(url.searchParams.get('courier')) || null

  const rows = await getDeliverySheet(date, courierId)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'العنود للزي الشرعي'
  const sheet = workbook.addWorksheet(`كشف ${date}`, { views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }] })

  sheet.columns = [
    { header: 'رقم الطلب', key: 'id', width: 10 },
    { header: 'اسم العميلة', key: 'name', width: 22 },
    { header: 'الهاتف', key: 'phone', width: 16 },
    { header: 'المدينة', key: 'city', width: 14 },
    { header: 'الحي', key: 'area', width: 18 },
    { header: 'المنطقة', key: 'region', width: 12 },
    { header: 'العنوان', key: 'address', width: 28 },
    { header: 'وصف الطرد', key: 'items', width: 20 },
    { header: 'عدد القطع', key: 'pieces', width: 10 },
    { header: 'شركة التوصيل', key: 'courier', width: 16 },
    { header: 'رقم التتبع', key: 'tracking', width: 16 },
    { header: 'المبلغ المطلوب', key: 'total', width: 14 },
    { header: 'الحالة', key: 'status', width: 12 },
  ]

  for (const o of rows) {
    sheet.addRow({
      id: o.id,
      name: o.customerName,
      phone: o.phone,
      city: o.city,
      area: o.area ?? '',
      region: isRegion(o.region) ? REGIONS[o.region].label : o.region,
      address: o.address ?? '',
      items: 'ملابس',
      pieces: o.items.reduce((s, i) => s + i.quantity, 0),
      courier: o.courierName ?? '',
      tracking: o.trackingNumber ?? '',
      total: o.total,
      status: isStatus(o.status) ? STATUSES[o.status].label : o.status,
    })
  }

  const totalRow = sheet.addRow({
    id: 'المجموع',
    pieces: rows.reduce((s, o) => s + o.items.reduce((is, i) => is + i.quantity, 0), 0),
    total: rows.reduce((s, o) => s + o.total, 0),
  })
  totalRow.font = { bold: true }

  const header = sheet.getRow(1)
  header.font = { bold: true, color: { argb: 'FF1A1A1A' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4AF37' } }
  sheet.eachRow((row) => {
    row.alignment = { vertical: 'top', horizontal: 'right', wrapText: true, readingOrder: 'rtl' }
  })
  sheet.getColumn('total').numFmt = '#,##0.00 "₪"'

  const buffer = await workbook.xlsx.writeBuffer()
  const filename = `delivery-sheet-${date}.xlsx`
  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
