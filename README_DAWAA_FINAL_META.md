# DAWAA Events — التصميم النهائي مع إرسال Meta

هذه النسخة مبنية على ملف التصميم المستقل كما هو:
- `index.html`
- `styles.css`
- `app.js`
- `assets/`

ولم يتم تحويل التصميم إلى React ولم يتم تغيير شكله.

## ما الذي أضيف؟

تمت إضافة طبقة Backend خفيفة تعمل على Vercel:

- `api/send-invitations.js` لإرسال الدعوات عبر Meta WhatsApp Cloud API.
- `api/webhook/meta.js` لاستقبال ردود الضيوف من Meta.
- `api/health.js` لفحص إعدادات الربط.
- `api/_lib/*` دوال Meta وSupabase والأرقام.

## رحلة الإرسال

1. من لوحة الإدارة افتحي صفحة الإرسال.
2. اختاري المناسبة والضيوف.
3. اضغطي تنفيذ الإرسال.
4. الواجهة تستدعي:
   `/api/send-invitations`
5. السيرفر يرسل قالب:
   `dawaa_wedding_invitation`
6. يحفظ `meta_message_id` وحالة الإرسال في Supabase.
7. عند ضغط الضيف "أرغب في الحضور" أو "أعتذر":
   Meta يرسل الرد إلى:
   `/api/webhook/meta`
8. الـ Webhook يحدث حالة الضيف:
   `confirmed` أو `declined`
9. ثم يرسل قالب:
   `dawaa_rsvp_confirmed` أو `dawaa_rsvp_declined`

## متغيرات Vercel المطلوبة

انسخي القيم من `.env.vercel.ready` إلى:

Vercel → Project → Settings → Environment Variables

ثم Redeploy.

## رابط Webhook في Meta

```
https://YOUR-DOMAIN.vercel.app/api/webhook/meta
```

Verify Token:
```
dawaa2026
```

## اختبار الصحة

افتحي:

```
https://YOUR-DOMAIN.vercel.app/api/health
```

لازم يرجع `metaConfigured: true` و `supabaseConfigured: true`.

## ملاحظات

- التصميم لم يتغير.
- لا يوجد N8N.
- لا توجد Dependencies تحتاج تثبيت.
- يفضل إنشاء مشروع Vercel جديد ونظيف لهذه النسخة بدل خلطها مع مشروع React/Vite السابق.
