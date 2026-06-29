# DAWAA Delete Guest Sync Fix

## المشكلة
لما تحذفين ضيف من الموقع، ينحذف محليًا فقط، لكنه يبقى في Supabase، وبعد المزامنة يرجع يظهر.

## الإصلاح
- إضافة حذف حقيقي من Supabase عبر `DELETE /api/guests-sync?id=...`
- زر حذف الضيف يحذف محليًا ثم يحذف من Supabase.
- إضافة قائمة محلية للضيوف المحذوفين حتى لا يرجع الضيف من المزامنة لو تأخر الحذف.
- دعم حذف الضيوف اللي IDs تبدأ بـ `remote_`.

## ارفعي خصوصًا
- app.js
- api/guests-sync.js
- api/_lib/supabase.js

## فحص
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
