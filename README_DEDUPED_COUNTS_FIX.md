# DAWAA Deduped Counts Fix

## المشكلة
عند تكرار الضيف، عدد الضيوف وعدد البطاقات ينحسب دبل.

## الإصلاح
كل الإحصائيات والقوائم صارت تعتمد على نسخة Deduped من الضيوف:
- totalPeople
- totalCards
- confirmed
- declined
- pending
- sent
- failed
- قائمة الضيوف
- إرسال الدعوات الجماعي لا يرسل للنسخة المكررة

## لا يلمس
- api/_lib/supabase.js
- api/send-invitations.js
- api/webhook/meta.js
- api/_lib/meta.js

## ارفعي فقط
- app.js
- api/guests-sync.js

## بعد الرفع
1. Hard Refresh.
2. اضغطي تنظيف التكرار.
3. راقبي العدد، المفروض ما ينحسب دبل.

## فحص JS
{
  "app.js": {
    "ok": true,
    "error": ""
  },
  "api/guests-sync.js": {
    "ok": true,
    "error": ""
  }
}
