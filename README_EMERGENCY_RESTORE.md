# DAWAA Emergency Restore — Send + Sync Stable, Keep UI

هذا باتش طوارئ لإصلاح المشكلة التي ظهرت بعد باتش التصميم الجذري.

## المشكلة
باتش التصميم الأخير استبدل `app.js` بنسخة أقدم، وهذا ممكن يكسر:
- الإرسال من بعض الأجهزة
- مزامنة البيانات بين اللابتوب والجوال
- حفظ الضيوف في Supabase

## ماذا يفعل هذا الباتش؟
يرجع ملفات المنطق المستقرة من Sync v2 Light:
- app.js
- api/guests-sync.js
- api/_lib/supabase.js
- api/_lib/meta.js
- api/webhook/meta.js

ويحافظ قدر الإمكان على التصميم الجديد من خلال:
- styles.css

## الملفات التي يجب استبدالها
- app.js
- styles.css
- api/guests-sync.js
- api/_lib/supabase.js
- api/_lib/meta.js
- api/webhook/meta.js

## بعد الرفع
1. Commit
2. انتظري Vercel Deploy
3. افتحي الموقع من اللابتوب بصفحة Incognito أو امسحي الكاش
4. اختبري:
   - إضافة ضيف
   - ظهوره في Supabase
   - فتحه من الجوال
   - إرسال دعوة من اللابتوب
   - تأكيد الحضور

## مهم
بعد ما يرجع الإرسال والمزامنة، أي تغيير تصميم جذري لازم يكون مبني على هذه النسخة المستقرة فقط.
