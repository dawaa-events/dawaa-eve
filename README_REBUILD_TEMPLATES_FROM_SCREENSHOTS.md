# DAWAA Rebuild Templates From Screenshots

## حسب الصور التي أرسلتيها

- `dawaa_wedding_invitation`: بدون صورة + 6 named variables.
- `dawaa_wedding_invitation_image`: Header Image + 6 named variables.
- `dawaa_rsvp_confirmed`: بدون متغيرات.
- `dawaa_rsvp_declined`: بدون متغيرات.
- `dawaa_rsvp_reminder`: بدون متغيرات، والأزرار موجودة داخل قالب Meta نفسه.
- `dawaa_entry_card`: بدون Header Image وبدون متغيرات، وزر رابط موقع المناسبة موجود داخل قالب Meta نفسه.

## الملفات المهمة للرفع
- app.js
- api/_lib/config.js
- api/_lib/meta.js
- api/send-invitations.js

## ملاحظة
هذا الباتش لا يلمس المزامنة ولا الضيوف ولا Supabase. فقط يعيد بناء منطق القوالب.

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
