# DAWAA Multi-Card RSVP Feature Patch

هذا الباتش يضيف/يثبت منطق البطاقات المتعددة بدون لمس التصميم.

## الملفات التي يتم استبدالها فقط

- `api/_lib/meta.js`
- `api/webhook/meta.js`

## المنطق

- إذا كان `cards_count = 1`:
  - ضغط "أرغب في الحضور" يؤكد مباشرة.
  - يتم تحديث `guests`.
  - يتم إرسال قالب التأكيد.

- إذا كان `cards_count > 1`:
  - ضغط "أرغب في الحضور" لا يؤكد مباشرة.
  - يرسل WhatsApp Interactive List لاختيار عدد البطاقات.
  - بعد اختيار العدد يتم تحديث:
    - `rsvp_status`
    - `confirmed_count`
    - `declined_count`
    - `pending_count`
    - `replied_at`
  - ثم يتم إرسال قالب التأكيد.

## ملاحظات

- لم يتم تعديل:
  - `index.html`
  - `styles.css`
  - `assets/`
  - `app.js`
  - `supabase.sql`
  - `vercel.json`
  - Environment Variables

## الاختبار المطلوب

1. ضيف بطاقة واحدة: يجب أن يتأكد مباشرة.
2. ضيف 3 بطاقات: يجب أن تصله قائمة اختيار.
3. اختيار 2 من 3: يجب أن يصبح:
   - confirmed_count = 2
   - declined_count = 1
   - pending_count = 0
   - rsvp_status = confirmed
