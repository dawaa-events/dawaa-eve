# DAWAA Rebuilt Meta Template Logic

## فهم المشكلة
الإرسال نفسه يعمل، لكن القوالب التي تم تحديثها في Meta تغيّر منطقها:
- الاسم
- النوع
- وجود Header Image
- طريقة المتغيرات named/numbered
- عدد المتغيرات

لذلك تم إعادة بناء طبقة القوالب من الصفر داخل:
api/_lib/meta.js

## القوالب حسب Meta الحالية
1. dawaa_wedding_invitation
   - Marketing
   - بدون صورة
   - 6 متغيرات named:
     guest_name, host_one, host_two, bride_name, groom_name, cards_count

2. dawaa_wedding_invitation_image
   - Marketing
   - Header Image
   - 6 متغيرات named:
     guest_name, host_one, host_two, bride_name, groom_name, cards_count

3. dawaa_rsvp_confirmed
   - Marketing
   - بدون متغيرات

4. dawaa_rsvp_declined
   - Marketing
   - بدون متغيرات

5. dawaa_entry_card
   - Utility
   - Header Image
   - متغيران:
     reception_time, location_link

6. dawaa_rsvp_reminder
   - Utility
   - بدون متغيرات

## الملفات المهمة للرفع
- app.js
- api/_lib/config.js
- api/_lib/meta.js
- api/send-invitations.js

## ما لم يتم لمسه
- المزامنة
- Supabase guests
- الحذف
- منطق الضيوف

## بعد الرفع
جربي بهذا الترتيب:
1. قالب التذكير
2. قالب الدعوة بدون صورة
3. قالب الدعوة مع صورة
4. قالب التأكيد
5. قالب الرفض

إذا فشل أي قالب، سيظهر خطأ Meta الحقيقي بدل رسالة نجاح وهمية.

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
