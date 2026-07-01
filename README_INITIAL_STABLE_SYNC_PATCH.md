# DAWAA Initial Stable Sync Patch

## الهدف
نسخة أولية قابلة للاستخدام تركّز فقط على الاستقرار:
- الإرسال
- المزامنة حسب المناسبة
- منع تكرار الضيوف
- حفظ المناسبة الجديدة في Supabase
- عدم إنشاء ضيف جديد وقت الإرسال إذا كان موجودًا

## الملفات المهمة للرفع
- app.js
- api/_lib/supabase.js
- api/guests-sync.js
- api/bookings-sync.js
- api/send-invitations.js

## ملاحظات مهمة
- هذا الباتش لا يضيف ميزات جديدة.
- لا تفعّلين ميزات بطاقات الدخول التلقائية قبل اختبار الإرسال الأساسي.
- الأفضل اختبار مناسبة جديدة فارغة بعد الرفع.

## اختبار سريع بعد الرفع
1. Hard Refresh.
2. أنشئي مناسبة جديدة.
3. أضيفي ضيف واحد.
4. اضغطي تحديث البيانات.
5. تأكدي أن الضيف لم يتكرر.
6. ارسلي الدعوة لنفسك فقط.
7. تأكدي أن الحالة تغيرت إلى مرسل/تم الإرسال.
8. احذفي الضيف واضغطي تحديث البيانات.
9. تأكدي أنه لا يرجع.

## فحص JavaScript
{
  "app.js": {
    "ok": true,
    "error": ""
  },
  "api/_lib/supabase.js": {
    "ok": true,
    "error": ""
  },
  "api/guests-sync.js": {
    "ok": true,
    "error": ""
  },
  "api/bookings-sync.js": {
    "ok": true,
    "error": ""
  },
  "api/send-invitations.js": {
    "ok": true,
    "error": ""
  },
  "api/webhook/meta.js": {
    "ok": true,
    "error": ""
  },
  "api/_lib/meta.js": {
    "ok": true,
    "error": ""
  }
}
