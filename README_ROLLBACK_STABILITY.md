# DAWAA Rollback Stability Patch — Keep Multi-Card RSVP

هذا الباتش يرجع سرعة الموقع واستقراره بعد مشكلة v1.1 Data Sync.

## ماذا يفعل؟
- يرجع `app.js` إلى النسخة المستقرة قبل محاولة التزامن.
- يرجع `api/guests-sync.js` إلى النسخة المستقرة.
- يحافظ على إصلاح البطاقات المتعددة V2 الذي كان يعمل.

## الملفات التي يتم استبدالها فقط
- app.js
- api/guests-sync.js
- api/_lib/supabase.js
- api/_lib/meta.js
- api/webhook/meta.js

## لا يلمس
- index.html
- styles.css
- assets/
- supabase.sql
- vercel.json
- Environment Variables

## بعد الرفع
1. Commit
2. انتظري Vercel Deploy
3. اختبري الإرسال والبطاقات المتعددة
4. لا تختبري التزامن الآن لأنه سيتم بناؤه من جديد بطريقة أخف لاحقاً
