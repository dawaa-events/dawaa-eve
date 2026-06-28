# DAWAA Card Status UI Patch

باتش واجهة فقط لعرض حالة البطاقات بوضوح.

## الملفات
- app.js
- styles.css

## ماذا يضيف؟
- داخل بطاقة الضيف يظهر:
  - تم تأكيد 2 من أصل 3
  - حاضر 2 • معتذر 1 • متبقي 0
- داخل تفاصيل الضيف يظهر نفس الملخص.
- يحافظ على منطق الإرسال والـ Webhook بدون تعديل.

## لم يتم تعديل
- api/
- webhook
- send-invitations
- guests-sync
- supabase
- vercel
