# DAWAA Urgent Client Ready Version

نسخة عاجلة هدفها أن العميل يقدر يستخدم البوابة غداً بتفاصيل أوضح.

## أهم ما تمت إضافته
- بوابة عميل مفصلة بدل dashboard مختصر.
- ملخص المناسبة.
- آخر تحديث بالوقت.
- عداد تنازلي.
- حالة العمل خطوة بخطوة.
- جدول ضيوف مفصل.
- عند الضغط على اسم الضيف يظهر:
  - عدد البطاقات
  - حاضر / معتذر / لم يؤكد
  - Timeline إثبات الإرسال بالدقيقة
- تعليمات الدخول.
- زر تسجيل خروج واضح.
- حساب عميل اختياري عبر Vercel:
  - DAWAA_CLIENT_EMAIL
  - DAWAA_CLIENT_PASSWORD

## ملفات الرفع
ارفعي كل ما داخل ZIP.

## متغيرات Vercel المقترحة
للإدارة:
- DAWAA_ADMIN_EMAIL
- DAWAA_ADMIN_PASSWORD
- DAWAA_AUTH_SECRET

للعميل المؤقت:
- DAWAA_CLIENT_EMAIL
- DAWAA_CLIENT_PASSWORD

## ملاحظة
هذه نسخة إنقاذ عاجلة للعرض على العميل، وليست إعادة بناء كاملة.

## الفحص
{
  "app.js": {
    "ok": true,
    "error": ""
  },
  "api/auth-login.js": {
    "ok": true,
    "error": ""
  },
  "api/_lib/auth.js": {
    "ok": true,
    "error": ""
  },
  "api/guests-sync.js": {
    "ok": true,
    "error": ""
  },
  "api/data-sync.js": {
    "ok": true,
    "error": ""
  }
}
