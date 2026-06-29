# DAWAA Export Excel Arabic Status Colors Fix

## المشكلة
زر تصدير CSV لا يعمل أو لا يدعم العربي/الألوان.

## الإصلاح
- الزر أصبح: تصدير Excel.
- ينزل ملف `.xlsx`.
- الأعمدة عربية.
- الحالة تظهر بالعربي:
  - حاضر
  - معتذر
  - لم يؤكد
  - مرسل
  - تم التسليم
  - تمت القراءة
- تلوين الحالة:
  - حاضر: أخضر
  - معتذر: أحمر
  - لم يؤكد: أصفر
  - مرسل/تم التسليم/قراءة: أزرق
- يوجد fallback إلى CSV عربي لو تعذر Excel.

## ملاحظة
يعتمد على مكتبة SheetJS من CDN:
https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js

## ارفعي خصوصًا
- app.js
- styles.css

## فحص
- exportGuests replaced: True
- exportReportCsv patched: True

{
  "app.js": {
    "ok": true,
    "error": ""
  },
  "api/guests-sync.js": {
    "ok": true,
    "error": ""
  },
  "api/_lib/supabase.js": {
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
  }
}
