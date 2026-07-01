# DAWAA Force Send Buttons Debug Fix

## المشكلة التي ظهرت من الصور
- عندك 1 محدد.
- تضغطين إرسال المحددين.
- لكن Network لا يظهر أي request إلى send-invitations.

هذا يعني أن المشكلة قبل Meta وقبل API: الزر لا ينفذ دالة الإرسال.

## الإصلاح
- ربط زر "إرسال المحددين" بدالة إرسال مباشرة.
- إضافة debug في Console:
  - [DAWAA SEND] CLICK selected button
  - [DAWAA SEND API START]
  - [DAWAA SEND API RESPONSE]
- لم يتم تعديل Supabase ولا منطق القوالب.

## ارفعي
- app.js فقط
أو ارفعي كل الملفات إذا تحبين، لكن المهم app.js.

## بعد الرفع
1. Hard Refresh.
2. حددي ضيف واحد.
3. افتحي Console + Network.
4. اضغطي إرسال المحددين.
5. لازم يظهر في Console:
   [DAWAA SEND API START]
6. ولازم يظهر في Network:
   send-invitations

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
