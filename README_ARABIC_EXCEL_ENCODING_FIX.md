# DAWAA Arabic Excel/CSV Encoding Fix

## المشكلة
أسماء الضيوف العربية كانت تظهر `????` عند رفع CSV/Excel أو عند تصدير القائمة.

## تم الإصلاح
- قراءة الملفات كـ ArrayBuffer بدل readAsText.
- محاولة فك الترميز بـ UTF-8 ثم Windows-1256 ثم ISO-8859-6.
- دعم CSV مع علامات اقتباس وفواصل.
- تصدير CSV مع BOM `UTF-8` حتى يقرأه Excel بالعربي.
- أسماء الأعمدة في التصدير أصبحت عربية.
- إصلاح تصدير تقرير المناسبة.

## ملاحظة مهمة
إذا كان الملف الأصلي نفسه محفوظ كـ `????` من قبل Excel، لا يمكن استرجاع العربي منه.
الأفضل حفظه من Google Sheets أو Excel بصيغة:
- CSV UTF-8

## فحص التعديل
- importGuestsFile replaced: True
- exportGuests replaced: True
- exportReportCsv replaced: True

## فحص JavaScript
{
  "app.js": {
    "ok": true,
    "error": ""
  },
  "api/guests-sync.js": {
    "ok": true,
    "error": ""
  },
  "api/_lib/meta.js": {
    "ok": true,
    "error": ""
  },
  "api/_lib/supabase.js": {
    "ok": true,
    "error": ""
  },
  "api/webhook/meta.js": {
    "ok": true,
    "error": ""
  },
  "api/send-invitations.js": {
    "ok": true,
    "error": ""
  }
}
