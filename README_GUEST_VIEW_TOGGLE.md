# DAWAA Guest View Toggle Patch

باتش واجهة فقط يضيف اختيار طريقة عرض الضيوف:

- مربعات
- جدول مثل Google Sheet

## الملفات
- app.js
- styles.css

## الملاحظات
- آخر اختيار يتم حفظه تلقائياً في المتصفح.
- لم يتم تعديل الإرسال أو الويبهوك أو Supabase.
- جدول الضيوف يعرض:
  - الاسم
  - الهاتف
  - عدد البطاقات
  - الحالة
  - الحضور مثل 4 / 6
  - المناسبة
  - الإجراءات

## لم يتم تعديل
- api/
- webhook
- send-invitations
- guests-sync
- supabase
- vercel
