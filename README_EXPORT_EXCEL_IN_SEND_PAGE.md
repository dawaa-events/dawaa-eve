# DAWAA Export Excel In Send Page

## الجديد
- إضافة زر "تصدير Excel" داخل صفحة الإرسال.
- يستخدم نفس دالة التصدير العربية الملوّنة الموجودة في صفحة الضيوف.
- يصدّر ضيوف المناسبة الحالية فقط حسب الفلاتر الظاهرة.

## ارفعي
- app.js
- styles.css

## فحص
- button patched: True

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
