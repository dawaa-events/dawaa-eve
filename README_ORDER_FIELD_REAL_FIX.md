# DAWAA Order Field Real Fix

## المشكلة
كان النظام يقول: لا يوجد ضيوف لديهم رقم ترتيب
لأن خانة رقم الترتيب لم تكن ظاهرة/محفوظة بشكل مضمون.

## الإصلاح
- إضافة خانة رقم الترتيب داخل نافذة إضافة/تعديل الضيف.
- عند إضافة ضيف يدويًا يحفظ:
  - orderNumber
  - startOrder
  - entryCardUrl
  - entryCardUrls
- عند التعديل تظهر الخانة وتُحفظ.
- يظهر رقم الترتيب في جدول الضيوف.
- يتم حفظ رقم الترتيب داخل Supabase عبر notes metadata.

## ارفعي خصوصًا
- app.js
- api/_lib/supabase.js

## فحص
- guestModal patched: True
- openGuestModal patched: True
- editGuest patched: True
- saveGuest patched: True

{
  "app.js": {
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
  },
  "api/_lib/meta.js": {
    "ok": true,
    "error": ""
  },
  "api/send-invitations.js": {
    "ok": true,
    "error": ""
  },
  "api/guests-sync.js": {
    "ok": true,
    "error": ""
  }
}
