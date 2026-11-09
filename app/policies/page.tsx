import Link from 'next/link'

export const metadata = {
  title: 'سياسات المتجر | العنود للزي الشرعي',
  description: 'سياسات فحص الطلب والتبديل والإرجاع والتوصيل في متجر العنود للزي الشرعي – الخليل.',
}

const fees = [
  { area: 'الضفة الغربية', amount: '20 شيكل' },
  { area: 'القدس', amount: '30 شيكل' },
  { area: 'مناطق 67', amount: '50 شيكل' },
  { area: 'المناطق داخل الخط الأخضر', amount: '70 شيكل' },
]

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#8f6a39]/60 bg-[#1b140f] p-5 shadow-[0_12px_35px_rgba(0,0,0,.2)] sm:p-7">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c69b5a]/70 bg-[#2b2016] text-sm font-bold text-[#e8c995]">{number}</span>
        <h2 className="text-xl font-bold text-[#f0d5a7] sm:text-2xl">{title}</h2>
      </div>
      <div className="space-y-4 text-sm leading-8 text-[#e5d5bd] sm:text-base">{children}</div>
    </section>
  )
}

function FeeTable({ perTrip = false }: { perTrip?: boolean }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#8f6a39]/60">
      <table className="w-full text-right text-sm">
        <thead className="bg-[#302317] text-[#f0d5a7]">
          <tr><th className="px-4 py-3 font-semibold">المنطقة</th><th className="px-4 py-3 font-semibold">{perTrip ? 'رسوم كل رحلة' : 'رسوم التبديل'}</th></tr>
        </thead>
        <tbody>
          {fees.map((fee) => <tr key={fee.area} className="border-t border-[#8f6a39]/35 odd:bg-[#211910] even:bg-[#19130e]">
            <td className="px-4 py-3">{fee.area}</td><td className="px-4 py-3 font-semibold text-[#e6c58f]">{fee.amount}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-2 pr-6 marker:text-[#c69b5a]">{items.map((item) => <li key={item}>{item}</li>)}</ul>
}

export default function PoliciesPage() {
  return (
    <main dir="rtl" className="min-h-dvh bg-[#100b08] px-4 py-8 text-[#f3dfbd] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-[#d9b475] transition hover:text-[#f3dfbd]">← العودة إلى متجر العنود</Link>

        <header className="relative my-8 overflow-hidden rounded-3xl border border-[#bd9457]/70 bg-gradient-to-br from-[#2b2016] via-[#19120d] to-[#100b08] px-6 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,.35)] sm:my-10 sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, #d2a968 0, transparent 58%)' }} />
          <p className="relative text-xs font-semibold tracking-[.22em] text-[#c69b5a]">ALANOUD HEBRON</p>
          <h1 className="relative mt-3 text-3xl font-bold text-[#f3dfbd] sm:text-4xl">سياسات متجر العنود</h1>
          <p className="relative mt-3 text-sm text-[#d8c4a4] sm:text-base">العنود للزي الشرعي · الخليل</p>
          <div className="relative mx-auto mt-5 flex max-w-xs items-center gap-3 text-[#c69b5a]"><span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c69b5a]" /><span>✥ ❖ ✥</span><span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c69b5a]" /></div>
        </header>

        <section className="mb-6 rounded-3xl border-2 border-[#c69b5a] bg-gradient-to-br from-[#302317] to-[#1b140f] p-6 shadow-[0_14px_45px_rgba(0,0,0,.3)] sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl text-[#e4c28a]">♡</span>
            <div><p className="text-xs font-semibold tracking-wide text-[#c69b5a]">لأن راحتك وثقتك بتهمّنا</p><h2 className="mt-1 text-2xl font-bold text-[#f4dfbd]">تسوّقي بثقة واطمئنان</h2></div>
          </div>
          <p className="text-sm leading-8 text-[#f0e2cb] sm:text-base">بنوفّر لكِ إمكانية فتح الطرد ومعاينة القطعة بحضور مندوب التوصيل قبل إتمام الاستلام والدفع، حتى تتأكدي من تفاصيل طلبك بكل راحة.</p>
          <p className="mt-3 text-xs leading-7 text-[#cdbb9f]">المعاينة مخصصة لفحص القطعة فقط، دون قياسها أو ارتدائها.</p>
        </section>

        <div className="space-y-5">
          <Section number="١" title="سياسة التبديل">
            <p>حرصاً من متجر العنود على رضا زبائنه، نتيح خدمة تبديل المنتجات وفق الشروط التالية:</p>
            <div><h3 className="font-bold text-[#f0d5a7]">1. مدة طلب التبديل</h3><p>يجب تقديم طلب التبديل خلال مدة لا تزيد عن 24 ساعة من استلام الطرد، حيث تُعد هذه المدة كافية للزبونة لفحص القطعة والتأكد من مطابقتها لطلبها والتحقق من حالتها قبل تقديم طلب التبديل.</p></div>
            <div><h3 className="font-bold text-[#f0d5a7]">2. طريقة تقديم الطلب</h3><p>يتم تقديم طلب التبديل عبر الواتساب الخاص بالمتجر، مع تزويدنا برقم الهاتف المسجل عند الطلب ورقم الطلب، لتسهيل التحقق من تفاصيله.</p></div>
            <div><h3 className="font-bold text-[#f0d5a7]">3. حالة المنتج</h3><p>يشترط لقبول التبديل أن تكون القطعة:</p><BulletList items={['جديدة وغير مستعملة أو مغسولة.','بحالتها الأصلية دون تلف أو تغيير.','مكتملة وبغلافها وتغليفها الأصلي.']} /></div>
            <div><h3 className="font-bold text-[#f0d5a7]">4. رسوم التبديل</h3><p>في حال كان التبديل بناءً على رغبة الزبونة، مثل تغيير المقاس أو اختيار قطعة أخرى، تتحمل الزبونة رسوم التبديل التالية:</p><FeeTable /></div>
            <div><h3 className="font-bold text-[#f0d5a7]">5. فرق السعر</h3><BulletList items={['إذا كانت القطعة البديلة بنفس سعر القطعة الأصلية، تدفع الزبونة رسوم التبديل فقط.','إذا كان سعر القطعة البديلة أعلى، تدفع الزبونة فرق السعر بالإضافة إلى رسوم التبديل.','إذا كان سعر القطعة البديلة أقل، يُعاد فرق السعر للزبونة نقداً عند تسليم القطعة البديلة.']} /></div>
            <div><h3 className="font-bold text-[#f0d5a7]">6. التبديل بسبب خطأ أو عيب من المتجر</h3><p>إذا وصل للزبونة منتج مختلف عن طلبها، أو بلون أو مقاس غير صحيح، أو كان المنتج يحتوي على عيب أو خلل مصنعي، يجب إرسال صور أو فيديو عبر واتساب المتجر لتوضيح المشكلة والتحقق منها.</p><p>بعد التأكد من الحالة، يتحمل المتجر كامل تكاليف التبديل والتوصيل، ولا تتحمل الزبونة أي رسوم.</p></div>
            <div><h3 className="font-bold text-[#f0d5a7]">7. فحص القطعة عند الاستلام</h3><p>يحق لمندوب التوصيل فحص القطعة عند استلامها، وفي حال عدم مطابقتها لشروط التبديل، يحق له رفض استلامها.</p></div>
            <div><h3 className="font-bold text-[#f0d5a7]">8. عدم توفر القطعة البديلة</h3><p>في حال عدم توفر القطعة المطلوبة للتبديل، يمكن للزبونة الانتظار حتى تتوفر، أو اختيار قطعة أخرى، أو الاتفاق مع المتجر على إلغاء عملية التبديل والوصول إلى حل مناسب.</p></div>
            <div><h3 className="font-bold text-[#f0d5a7]">9. المنتجات المشمولة بالتبديل</h3><p>تتوفر خدمة التبديل لجميع المنتجات، باستثناء المنتجات المشمولة بالعروض الترويجية الخاصة التي يعلن عنها المتجر.</p><p>ولا يسري هذا الاستثناء على حالات الخطأ أو العيب أو الخلل في المنتج من جانب المتجر، حيث يتحمل المتجر كامل المسؤولية وتكاليف المعالجة.</p></div>
          </Section>

          <Section number="٢" title="سياسة الإرجاع">
            <p>يتيح متجر العنود خدمة إرجاع المنتجات وفق الشروط التالية:</p>
            <div><h3 className="font-bold text-[#f0d5a7]">1. مدة طلب الإرجاع</h3><p>يجب تقديم طلب الإرجاع خلال مدة لا تزيد عن 24 ساعة من استلام الطرد، حيث تُعد هذه المدة كافية للزبونة لفحص القطعة والتأكد من مطابقتها لطلبها والتحقق من حالتها قبل تقديم طلب الإرجاع.</p></div>
            <div><h3 className="font-bold text-[#f0d5a7]">2. طريقة تقديم الطلب</h3><p>يتم تقديم طلب الإرجاع عبر الواتساب الخاص بالمتجر، مع تزويدنا برقم الهاتف المسجل عند الطلب ورقم الطلب.</p></div>
            <div><h3 className="font-bold text-[#f0d5a7]">3. حالة المنتج</h3><p>يشترط لقبول الإرجاع أن تكون القطعة:</p><BulletList items={['جديدة وغير مستعملة أو مغسولة.','بحالتها الأصلية دون تلف أو تغيير.','مكتملة وبغلافها وتغليفها الأصلي.']} /></div>
            <div><h3 className="font-bold text-[#f0d5a7]">4. رسوم الإرجاع في حال عدم وجود خطأ من المتجر</h3><p>إذا كان الإرجاع بناءً على رغبة الزبونة دون وجود خطأ أو عيب في المنتج من جانب المتجر، تتحمل الزبونة رسوم التوصيل الأصلية ورسوم إعادة القطعة إلى المتجر، وفق الأسعار التالية لكل رحلة:</p><FeeTable perTrip /><p>وبناءً على ذلك، يتم رد المبلغ المدفوع بعد خصم رسوم التوصيل الأصلية ورسوم إعادة القطعة إلى المتجر.</p></div>
            <div><h3 className="font-bold text-[#f0d5a7]">5. الإرجاع بسبب خطأ أو عيب من المتجر</h3><p>إذا وصل للزبونة منتج مختلف عن طلبها، أو بلون أو مقاس غير صحيح، أو كان المنتج يحتوي على عيب أو خلل مصنعي، يجب إرسال صور أو فيديو عبر واتساب المتجر لتوضيح المشكلة والتحقق منها.</p><p>بعد التأكد من الحالة، يتحمل المتجر كامل تكاليف التوصيل وإعادة المنتج، وتسترد الزبونة كامل المبلغ المدفوع دون أي خصومات.</p></div>
            <div><h3 className="font-bold text-[#f0d5a7]">6. استلام القطعة وإعادة المبلغ</h3><p>يتم عادةً تنسيق استلام القطعة خلال مدة تتراوح من يومين إلى خمسة أيام عمل.</p><p>يقوم مندوب التوصيل بفحص القطعة عند استلامها، وفي حال مطابقتها لشروط الإرجاع، يتم تسليم المبلغ المستحق للزبونة نقداً في نفس وقت استلام القطعة.</p><p>وفي حال عدم مطابقة القطعة لشروط الإرجاع، يحق لمندوب التوصيل رفض استلامها.</p></div>
            <div><h3 className="font-bold text-[#f0d5a7]">7. المنتجات المشمولة بالإرجاع</h3><p>تتوفر خدمة الإرجاع لجميع المنتجات، باستثناء المنتجات المشمولة بالعروض الترويجية الخاصة التي يعلن عنها المتجر.</p><p>ولا يسري هذا الاستثناء على حالات الخطأ أو العيب أو الخلل في المنتج من جانب المتجر، حيث يتحمل المتجر كامل المسؤولية وتكاليف المعالجة.</p></div>
          </Section>

          <Section number="٣" title="مدة التجهيز والتوصيل">
            <p>تستغرق مدة تجهيز وتوصيل الطلب عادةً من يومين إلى خمسة أيام عمل، اعتباراً من تاريخ تسجيل الطلب، وقد تختلف المدة تبعاً لمنطقة التوصيل والظروف اللوجستية.</p>
          </Section>

          <Section number="٤" title="اختلاف درجات الألوان">
            <p>نحرص في متجر العنود على عرض صور المنتجات بأكبر قدر ممكن من الدقة.</p>
            <p>قد يحدث اختلاف بسيط في درجة اللون بين الصورة والقطعة على الطبيعة، وذلك بسبب الإضاءة والتصوير وإعدادات شاشات الهواتف.</p>
            <p>هذا الاختلاف البسيط لا يُعتبر عيباً في المنتج، أما الاختلاف الجوهري أو إرسال لون غير اللون المطلوب فيُعالج وفق سياسة المتجر.</p>
          </Section>
        </div>

        <footer className="mt-8 border-t border-[#8f6a39]/50 pt-6 text-center">
          <Link href="/shop" className="inline-flex rounded-full border border-[#c69b5a] bg-[#c69b5a] px-7 py-3 text-sm font-bold text-[#1b140f] transition hover:bg-[#e0bd84]">العودة إلى التسوّق</Link>
          <p className="mt-5 text-xs text-[#9f8a6b]">العنود للزي الشرعي · الخليل</p>
        </footer>
      </div>
    </main>
  )
}
