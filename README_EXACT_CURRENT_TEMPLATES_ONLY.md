# DAWAA Exact Current Templates Only

## تم حذف منطق القوالب القديمة من المشروع

القوالب المعتمدة الآن فقط:

1. `dawaa_wedding_invitation`
   - Marketing
   - بدون Media
   - named variables:
     guest_name, host_one, host_two, bride_name, groom_name, cards_count
   - أزرار الحضور/الاعتذار داخل Meta

2. `dawaa_wedding_invitation_image`
   - Marketing
   - Header Image
   - named variables:
     guest_name, host_one, host_two, bride_name, groom_name, cards_count
   - أزرار الحضور/الاعتذار داخل Meta

3. `dawaa_rsvp_confirmed`
   - Marketing
   - بدون متغيرات
   - بدون Media

4. `dawaa_rsvp_declined`
   - Marketing
   - بدون متغيرات
   - بدون Media

5. `dawaa_rsvp_reminder`
   - Utility
   - بدون متغيرات
   - أزرار الحضور/الاعتذار داخل Meta

6. `dawaa_entry_card`
   - Utility
   - بدون متغيرات
   - بدون Media
   - زر رابط موقع المناسبة داخل Meta

## الملفات المهمة للرفع
- app.js
- api/_lib/config.js
- api/_lib/meta.js
- api/send-invitations.js

## لم يتم لمس
- Supabase
- guests-sync
- الحذف
- المزامنة

## ملاحظة مهمة
إذا Meta لا تسلّم قوالب Marketing رغم رجوع messageId، فهذا قرار تسليم من Meta وليس من المشروع. لكن هذا الباتش يضمن أن الـ payload يطابق القوالب الحالية تمامًا.

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
