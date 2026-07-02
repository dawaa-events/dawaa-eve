# DAWAA Comprehensive Timeline Confirm Hotfix

## لماذا هذا الباتش؟
بعد رفع الباتش الشامل، رسالة تأكيد الحضور لم تعد تصل.

السبب المحتمل أن ملف `api/_lib/supabase.js` الذي رفعناه كجزء من إصلاح التكرار لم يكن متوافقًا بالكامل مع منطق الـ webhook الحالي، خصوصًا إذا كان webhook الحالي يعتمد على:
- `updateMessageByMetaId`
- أو تحديث الضيف بالرقم مباشرة.

## ماذا يفعل هذا Hotfix؟
يحافظ على:
- إصلاح التكرار.
- إصلاح الحذف.
- إصلاح المزامنة.
- إصلاح Timeline.

ويضيف/يثبت:
- `updateMessageByMetaId`
- `updateGuestByPhone` بطريقة آمنة لا تكسر webhook تأكيد الحضور.

## ارفعي فقط
- api/_lib/supabase.js

إذا كنتِ ترفعين كامل الملفات، لا مشكلة، لكن المهم فقط:
- api/_lib/supabase.js

## بعد الرفع
1. أرسلي دعوة جديدة لنفسك.
2. اضغطي "أرغب في الحضور".
3. راقبي:
   - هل الحالة تغيرت؟
   - هل رسالة `dawaa_rsvp_confirmed` وصلت؟

## فحص JS
{
  "app.js": {
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
  },
  "api/send-invitations.js": {
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
  "api/_lib/config.js": {
    "ok": true,
    "error": ""
  }
}
