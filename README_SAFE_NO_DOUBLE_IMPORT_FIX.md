# DAWAA Safe No Double Import Fix

## المشكلة
عند رفع Excel، إذا كان الملف فيه 4 ضيوف يظهرون 8.
السبب أن الواجهة تضيف الضيوف محلياً، ثم تحفظهم في Supabase، ثم المزامنة ترجع نفسهم كسجلات ثانية.

## الإصلاح
- عند رفع Excel لا تتم إضافة الضيوف محليًا مباشرة.
- يتم حفظهم في Supabase أولاً.
- بعدها يتم سحب النسخة الرسمية من Supabase.
- منع تكرار نفس الاسم + نفس الرقم داخل نفس المناسبة.
- إزالة التكرار الظاهر في القائمة بدون تنظيف عنيف أو حذف خطر.

## ارفعي خصوصًا
- app.js
- styles.css

## ملاحظة
هذا باتش خفيف وآمن، لا يحتوي على تنظيف قاسي ولا يحذف ضيوف من Supabase.

## فحص
- importGuestsFile replaced: True
- filteredGuestsList patched: True

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
