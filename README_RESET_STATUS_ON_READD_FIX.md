# DAWAA Reset Status On Re-Add Fix

## المشكلة
إذا حذفتي الضيوف ثم أضفتيهم مرة ثانية، يرجعون بحالاتهم السابقة مثل حاضر/معتذر.

## الإصلاح
- أي ضيف جديد من Excel أو إضافة يدوية يأخذ علامة `forceNew`.
- backend ينشئ له سجل جديد بحالة:
  - لم يؤكد
  - confirmed_count = 0
  - declined_count = 0
  - pending_count = عدد البطاقات
  - بدون meta_message_id سابق
- لا يعيد استخدام حالة قديمة لنفس الاسم أو الرقم.

## ارفعي خصوصًا
- app.js
- api/_lib/supabase.js
- api/guests-sync.js

## فحص
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
