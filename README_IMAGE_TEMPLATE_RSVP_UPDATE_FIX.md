# DAWAA Image Template RSVP Update Fix

## المشكلة
عند إرسال دعوة مع صورة، الضيف يضغط زر الحضور لكن حالة الحضور لا تتحدث. بينما الدعوة بدون صورة تعمل.

## السبب المحتمل
رسائل القالب المصور قد لا ترتبط بنفس `meta_message_id` المتوقع في الـ Webhook، أو تحديث الضيف يفشل إذا لم يكن id المخزن UUID.

## الإصلاح
- عند إرسال أي قالب، يتم حفظ `metaMessageId` أولاً بالـ id.
- إذا فشل التحديث بالـ id، يتم التحديث برقم الهاتف.
- في Webhook عند الضغط على زر الحضور:
  - يبحث بالـ context message id.
  - إذا لم يجد الضيف، يبحث برقم الهاتف.
  - إذا فشل تحديث الضيف بالـ id، يحدثه برقم الهاتف.
- نفس الإصلاح يشمل:
  - حضور
  - اعتذار
  - اختيار عدد البطاقات
  - delivered/read statuses

## ارفعي خصوصًا
- api/send-invitations.js
- api/webhook/meta.js
- api/_lib/supabase.js

## فحص
{
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
  "api/_lib/meta.js": {
    "ok": true,
    "error": ""
  },
  "app.js": {
    "ok": true,
    "error": ""
  }
}
