# DAWAA Template Selector Patch

## الجديد
- إضافة اختيار قالب واتساب كبطاقات واضحة:
  - دعوة بدون صورة
  - دعوة مع صورة
  - بطاقة الدخول
  - تذكير
  - تأكيد الحضور
  - الاعتذار
- خانة رابط الصورة تظهر فقط للقوالب التي تحتاج صورة.
- معاينة واتساب داخل الصفحة.
- يتم حفظ اسم القالب داخل المناسبة.
- عند الإرسال يرسل للـ API:
  - template
  - invitationImageUrl

## ملاحظة مهمة
حتى يعمل الإرسال المصور، يجب أن يكون api/send-invitations يدعم اختيار template و invitationImageUrl.
إذا كان API الحالي ثابت على قالب واحد، سنحتاج باتش صغير للـ API بعد اختبار هذه الواجهة.

## فحص
{
  "app.js": {
    "ok": true,
    "error": ""
  },
  "api/guests-sync.js": {
    "ok": true,
    "error": ""
  },
  "api/_lib/meta.js": {
    "ok": true,
    "error": ""
  },
  "api/_lib/supabase.js": {
    "ok": true,
    "error": ""
  },
  "api/webhook/meta.js": {
    "ok": true,
    "error": ""
  }
}
