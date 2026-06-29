# DAWAA Hard Reset Old Status + Order Fix

## المشكلة
بعد حذف الضيوف وإضافتهم مرة ثانية، كانت تظهر حالاتهم القديمة لأن سجلات قديمة لنفس الاسم/الرقم بقيت في Supabase وترجع مع المزامنة.

## الإصلاح
- عند إضافة ضيف جديد أو استيراده من Excel:
  1. يحذف أي سجل قديم بنفس:
     - المناسبة
     - الاسم
     - الرقم
  2. ينشئ سجل جديد بحالة:
     - لم يؤكد
     - حاضر 0
     - معتذر 0
     - pending = عدد البطاقات
     - بدون meta_message_id قديم
- عند حذف ضيف:
  - يحذف بالـ id
  - ويحذف أيضًا بنفس الاسم والرقم من Supabase لمنع رجوع النسخة القديمة
- تأكيد تثبيت خانة رقم الترتيب وحفظها.

## ارفعي خصوصًا
- app.js
- api/_lib/supabase.js
- api/guests-sync.js

## بعد الرفع
1. احذفي الضيوف من الموقع.
2. انتظري رسالة تم حذف الضيف نهائياً من المزامنة.
3. ارفعي Excel مرة ثانية.
4. المفروض كل الحالات ترجع: لم يؤكد.

## فحص
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
  }
}
