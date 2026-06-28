# DAWAA V6 Full State Sync

هذا الباتش يوسّع المزامنة من الضيوف فقط إلى:
- المناسبات / الحجوزات
- الحسابات
- الرسائل
- صلاحيات العميل
- إعدادات مطابقة البطاقات العامة

## الملفات التي يجب رفعها
- app.js
- styles.css
- api/data-sync.js
- api/guests-sync.js
- api/_lib/supabase.js
- api/_lib/meta.js
- api/webhook/meta.js

## مهم جدًا
هذا الباتش يضيف endpoint جديد:
- `/api/data-sync`

ويستخدم جدول عام في Supabase باسم:
- `app_state`

إذا لم يكن الجدول موجودًا، المزامنة الجديدة للمناسبات/الحسابات لن تعمل، لكن مزامنة الضيوف ستبقى كما هي.

## SQL المطلوب في Supabase

نفذي هذا في Supabase SQL Editor مرة واحدة:

```sql
create table if not exists public.app_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "service role manages app_state" on public.app_state;

create policy "service role manages app_state"
on public.app_state
for all
using (true)
with check (true);
```

## ماذا تم تعديله؟
- إضافة `/api/data-sync`.
- `loadStateFromServer` يسحب المناسبات والحسابات والرسائل.
- `saveStateToServer` يحفظ المناسبات والحسابات والرسائل.
- عند إنشاء مناسبة جديدة يتم حفظها في Supabase.
- عند تعديل صلاحيات/حسابات يتم حفظها.
- زر "تحديث البيانات" يسحب كل شيء: المناسبات + الضيوف.
- afterRender صار يحدث البيانات من السيرفر في صفحات الإدارة والعميل.

## فحص
JavaScript syntax: ✅ ناجح

## الاختبار
1. ارفعي الملفات.
2. نفذي SQL أعلاه في Supabase.
3. افتحي الرابط الشغال: https://dawaa-eve.vercel.app/
4. من القائمة اضغطي تحديث البيانات.
5. أضيفي مناسبة من اللابتوب.
6. افتحي من الهاتف أو Incognito واضغطي تحديث البيانات، المفروض تظهر المناسبة.
