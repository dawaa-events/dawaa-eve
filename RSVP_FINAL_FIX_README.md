# DAWAA RSVP Final Fix

## سبب المشكلة الحقيقي
التصميم المستقل يخزن الضيوف داخل `localStorage` بأرقام مثل `g1`, `g2`، بينما Webhook يعمل على السيرفر ولا يستطيع تحديث `localStorage` مباشرة.

الحل هنا يعمل كالتالي:

1. عند الإرسال، السيرفر ينشئ/يحدث سجل الضيف في Supabase حسب رقم الهاتف.
2. يخزن `meta_message_id` في Supabase.
3. عند ضغط الضيف على زر WhatsApp، Webhook يبحث بالـ `meta_message_id` أو رقم الهاتف.
4. يحدث حالة الضيف في Supabase.
5. يرسل قالب التأكيد أو الاعتذار.
6. الواجهة تسحب التحديثات من `/api/guests-sync` كل 10 ثوانٍ وتحدث شاشة النظام.

## الملفات المعدلة
- `api/_lib/supabase.js`
- `api/send-invitations.js`
- `api/webhook/meta.js`
- `api/guests-sync.js` جديد
- `app.js`

## مهم جداً للاختبار
بعد رفع هذه النسخة، اختبري بإرسال دعوة جديدة مرة ثانية. الدعوات القديمة التي أُرسلت قبل هذا الإصلاح قد لا تحتوي على `meta_message_id` محفوظ في Supabase.

## خطوات الرفع
1. ارفعي الملفات واستبدلي القديمة.
2. Commit.
3. في Vercel اعملي Redeploy.
4. افتحي `/api/health` وتأكدي أن `metaConfigured` و `supabaseConfigured` true.
5. أرسلي دعوة جديدة.
6. اضغطي زر الحضور من واتساب.
7. انتظري 10 ثوانٍ أو نفذي من Console:
   ```js
   syncGuestStatusesFromServer(false)
   ```

## إذا لم تصل رسالة التأكيد
افتحي Supabase جدول `webhook_events` وابحثي عن:
- `rsvp_button_press`
- `rsvp_confirmed_template_sent`
- `rsvp_declined_confirmation_sent`

إذا ظهر `result.status = failed` فالمشكلة من قالب Meta وليس من تحديث الحالة.
