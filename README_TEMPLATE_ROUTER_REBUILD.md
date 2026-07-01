# DAWAA Template Router Rebuild

تمت إعادة بناء منطق القوالب بالكامل بدون لمس المزامنة أو الضيوف.

## القوالب الحالية
- dawaa_wedding_invitation: named variables بدون صورة.
- dawaa_wedding_invitation_image: named variables + Header Image.
- dawaa_rsvp_confirmed: بدون متغيرات.
- dawaa_rsvp_declined: بدون متغيرات.
- dawaa_rsvp_reminder: بدون متغيرات.
- dawaa_entry_card: بدون صورة وبدون متغيرات حسب صورتك.

## دعم قوالب Utility الجديدة
إذا أنشأتِ نسخ Utility بدل Marketing، فعّلي في Vercel:
DAWAA_USE_UTILITY_TEMPLATE_ROUTER=true

ثم ضعي الأسماء:
DAWAA_UTILITY_WEDDING_INVITATION_TEMPLATE
DAWAA_UTILITY_WEDDING_INVITATION_IMAGE_TEMPLATE
DAWAA_UTILITY_RSVP_CONFIRMED_TEMPLATE
DAWAA_UTILITY_RSVP_DECLINED_TEMPLATE

## ارفعي
- app.js
- api/_lib/config.js
- api/_lib/meta.js
- api/send-invitations.js

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
