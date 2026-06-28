# DAWAA V5.2 Real Sync Fix

## المشكلة
الإرسال من الهاتف يعمل لأن الهاتف يستخدم بياناته المحلية، لكن اللابتوب لا يرى نفس البيانات لأن دوال المزامنة كانت ناقصة وترجع `false`.

## استبدلي
- app.js
- styles.css
- api/guests-sync.js
- api/_lib/supabase.js
- api/_lib/meta.js
- api/webhook/meta.js

## ماذا يصلح؟
- تفعيل loadGuestsFromServer الحقيقي.
- تفعيل saveGuestsToServer الحقيقي.
- السحب من `/api/guests-sync` بدون كاش.
- الحفظ إلى `/api/guests-sync`.
- تحديث تلقائي عند دخول صفحات الإدارة والعميل.
- زر جانبي جديد: تحديث البيانات.
- اللابتوب والهاتف يقرؤون من Supabase بدل كل جهاز يعتمد على localStorage فقط.

## فحص
JavaScript syntax: ✅ ناجح

## بعد الرفع
1. افتحي الموقع من Incognito في اللابتوب.
2. اضغطي تحديث البيانات من القائمة.
3. افتحي نفس المناسبة.
4. تأكدي أن الضيوف الذين في الهاتف ظهروا.
