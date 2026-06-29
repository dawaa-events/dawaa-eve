# DAWAA Stop Refresh Loop Fix

## المشكلة
بعد باتش منع التكرار، الموقع صار كأنه يحدث نفسه طول الوقت.

## السبب
دالة عرض الضيوف كانت تشغل إزالة التكرار أثناء الرسم، وهذا يغير البيانات أثناء عرض الصفحة، فيسبب تحديث متكرر.

## الإصلاح
- جعل `filteredGuestsList` دالة عرض فقط بدون أي تعديل على البيانات.
- إزالة التكرار تصير فقط بعد الاستيراد، وليس مع كل عرض.
- إيقاف render التلقائي المتكرر بعد المزامنة.

## ارفعي خصوصًا
- app.js

## فحص
- filteredGuestsList patched: True
- removeVisibleDuplicateGuests patched: True

{
  "app.js": {
    "ok": true,
    "error": ""
  },
  "api/guests-sync.js": {
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
  "api/webhook/meta.js": {
    "ok": true,
    "error": ""
  }
}
