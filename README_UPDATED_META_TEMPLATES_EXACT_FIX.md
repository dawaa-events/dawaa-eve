# DAWAA Updated Meta Templates Exact Fix

## المشكلة
بعد تحديث القوالب في Meta:
- قالب التذكير يصل.
- قالب الدعوة المصورة/بدون صورة/التأكيد/الرفض لا يصل.

## الإصلاح
- تثبيت أسماء القوالب بالضبط حسب الصورة.
- استخدام named parameters لقوالب الدعوة لأن القوالب الحديثة عندك تظهر بمتغيرات مثل {guest_name}.
- عدم إظهار "تم الإرسال" إذا Meta رجعت فشل لكل الرسائل.
- إظهار خطأ Meta الحقيقي عند الفشل.

## أسماء القوالب المعتمدة
- dawaa_wedding_invitation
- dawaa_wedding_invitation_image
- dawaa_rsvp_confirmed
- dawaa_rsvp_declined
- dawaa_entry_card
- dawaa_rsvp_reminder

## ارفعي خصوصًا
- app.js
- api/_lib/config.js
- api/_lib/meta.js
- api/send-invitations.js

## متغيرات Vercel
تأكدي من:
- META_ACCESS_TOKEN
- META_PHONE_NUMBER_ID
- META_API_VERSION
- META_TEMPLATE_LANGUAGE = ar

## فحص JS
{
  "app.js": {
    "ok": true,
    "error": ""
  },
  "api/_lib/config.js": {
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
  "api/webhook/meta.js": {
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
  }
}
