# DAWAA Webhook RSVP Button Fix

## المشكلة
بعد أن أصبح إرسال الدعوات يعمل، عند ضغط الضيف على زر:
- أرغب في الحضور
أو
- أعتذر عن الحضور

لم تعد:
- حالة الحضور تتغير في الموقع
- رسالة تأكيد الحضور تصل

## السبب المحتمل
Meta قد ترسل رد الزر بأكثر من صيغة:
- message.type = button
- message.button.payload
- message.button.text
- message.type = interactive
- message.interactive.button_reply.id
- message.interactive.button_reply.title
- message.interactive.list_reply.id
- message.interactive.list_reply.title

الكود القديم كان يقرأ قيمة واحدة فقط أحيانًا، مثل payload قبل text، فإذا كان payload لا يحتوي النص العربي، يفشل التعرف على الزر.

## الإصلاح
تم استبدال `api/webhook/meta.js` بمنطق أقوى:

- يجمع كل احتمالات الرد من Meta.
- يطبع Logs واضحة:
  - WEBHOOK_RECEIVED
  - PARSED_BUTTON_REPLY
  - MATCHED_GUEST
  - RSVP_UPDATE_RESULT
  - CONFIRMATION_SEND_RESULT
- يتعرف على الحضور والاعتذار من:
  - النص العربي
  - payload
  - id
  - title
  - list_reply
- يحدث حالة الضيف في Supabase.
- يرسل `dawaa_rsvp_confirmed` عند الحضور.
- يرسل `dawaa_rsvp_declined` عند الاعتذار.
- يدعم اختيار عدد البطاقات `card_count_X`.

## الملفات المهمة للرفع
- api/webhook/meta.js

يمكن رفع كل الملفات، لكن التغيير الحقيقي فقط في:
- api/webhook/meta.js

## بعد الرفع
1. أرسلي دعوة لنفسك.
2. اضغطي زر "أرغب في الحضور".
3. راقبي Vercel Logs وابحثي عن:
   - WEBHOOK_RECEIVED
   - PARSED_BUTTON_REPLY
   - MATCHED_GUEST
   - RSVP_UPDATE_RESULT
   - CONFIRMATION_SEND_RESULT
4. تأكدي أن الحالة تغيرت في الموقع.
5. تأكدي أن رسالة التأكيد وصلت.

## فحص JS
{
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
  },
  "api/_lib/supabase.js": {
    "ok": true,
    "error": ""
  },
  "api/send-invitations.js": {
    "ok": true,
    "error": ""
  },
  "app.js": {
    "ok": true,
    "error": ""
  }
}
