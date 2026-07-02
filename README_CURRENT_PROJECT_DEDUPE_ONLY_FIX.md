# DAWAA Current Project Dedupe Only Fix

هذا الباتش مبني على نفس النسخة التي رفعتيها:
DAWAA_HARD_RESET_OLD_STATUS_AND_ORDER_FIX(1).zip

## مهم
لم يتم لمس أي ملف منطق إرسال واتساب:
- api/send-invitations.js
- api/webhook/meta.js
- api/_lib/meta.js
- api/_lib/supabase.js
- api/guests-sync.js

التعديل فقط في:
- app.js

## ماذا يصلح؟
- يمنع ظهور نفس الضيف مرتين: مرة برقم الترتيب ومرة بالأبجدية.
- يمنع عدّ الضيف المكرر دبل في الإحصائيات.
- يدمج النسخ محليًا بعد المزامنة بدون تغيير منطق الإرسال.

## كيف يعتمد الدمج؟
1. إذا عند الضيف رقم ترتيب، يستخدم:
   booking + orderNumber/startOrder
2. إذا لا يوجد ترتيب، يستخدم:
   booking + phone + name
3. إذا نسخة ناقصة رقم أو ترتيب، يستخدم:
   booking + name + cards
4. تمريرة ثانية تدمج نفس الاسم داخل نفس المناسبة.

## ارفعي فقط
app.js

## بعد الرفع
1. Hard Refresh.
2. افتحي نفس المناسبة.
3. تأكدي أن الضيف يظهر مرة واحدة.
4. جرّبي الإرسال، منطق الإرسال بقي كما هو.

## فحص JS
node --check app.js: OK
