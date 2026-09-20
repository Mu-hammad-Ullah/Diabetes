# Diabetes Care — Setup গাইড

এই project চালু করতে তিনটা জিনিস লাগবে: **Supabase** (database + auth + storage), **Vercel** (hosting), আর **GitHub** (code)। সব free tier-এ চলে, credit card লাগে না।

---

## ধাপ ১: Supabase project বানান (৫ মিনিট)

1. https://supabase.com → **Start your project** → GitHub দিয়ে login
2. **New project** → নাম দিন `diabetes-care`, একটা শক্ত database password দিন (কোথাও লিখে রাখুন), Region: **Singapore (Southeast Asia)** — বাংলাদেশ থেকে সবচেয়ে কাছে
3. Project তৈরি হতে ১–২ মিনিট লাগবে

### Database schema চালান

4. বাম মেনু → **SQL Editor** → **New query**
5. এই repo-র [`supabase/schema.sql`](supabase/schema.sql) ফাইলের **পুরো content** copy করে paste → **Run** (নিচে ডান দিকে)
   - "Success. No rows returned" দেখালে হয়েছে
6. আবার **New query** → [`supabase/seed_hospitals.sql`](supabase/seed_hospitals.sql) paste → **Run** (বাংলাদেশের ৪৫+ হাসপাতাল ঢুকবে)

### Auth settings

7. বাম মেনু → **Authentication** → **URL Configuration**
   - **Site URL**: `https://diabetes-zeta-wine.vercel.app` (আপনার Vercel URL)
   - **Redirect URLs** → Add: `https://diabetes-zeta-wine.vercel.app/auth/callback` এবং `http://localhost:3000/auth/callback`
8. **Authentication** → **Sign In / Providers** → **Email**:
   - Testing-এর সময় **Confirm email** বন্ধ রাখতে পারেন (signup করলেই login হয়ে যাবে)
   - Live-এ গেলে চালু করুন। Free tier-এ ঘণ্টায় ২টা email পাঠানো যায় — বেশি user হলে **SMTP Settings**-এ নিজের SMTP (যেমন Resend, Brevo — free) বসাতে হবে

### Super admin (migration 002)

7b. **SQL Editor** → **New query** → [`supabase/migration_002_admin.sql`](supabase/migration_002_admin.sql) paste → **Run**
   (নতুন project-এ `schema.sql`-এর ভেতরেই এটা আছে, আলাদা চালাতে হবে না)

7c. Admin panel থেকে password reset / block / delete করতে **secret key** লাগে:
   **Project Settings → API Keys → Secret keys → Create new** → নাম `server` → key copy করুন (`sb_secret_...`)
   - Local: `.env.local`-এ `SUPABASE_SECRET_KEY=sb_secret_...`
   - Vercel: Environment Variables-এ `SUPABASE_SECRET_KEY` (Type: **Secret**) → Redeploy
   - ⚠️ এই key কখনো chat, GitHub বা browser-এ দেবেন না — এটা দিয়ে RLS bypass হয়। শুধু server-এ থাকে।

### API keys নিন

9. বাম মেনু → **Project Settings** (gear icon) → **API**
   - **Project URL** → এটা `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → এটা `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ⚠️ **service_role** key কখনো ব্যবহার করবেন না, কোথাও paste করবেন না

---

## ধাপ ২: Local-এ চালিয়ে দেখুন

```bash
# project folder-এ
cp .env.example .env.local
# .env.local খুলে Supabase URL ও anon key বসান
npm install
npm run dev
```

http://localhost:3000 খুলুন → **অ্যাকাউন্ট খুলুন** → রোগী হিসেবে signup → dashboard-এ reading যোগ করে দেখুন।

---

## ধাপ ৩: নিজেকে admin বানান

Signup করার পর Supabase → **SQL Editor**:

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'আপনার@email.com');
```

এরপর nav-এ **অ্যাডমিন** আসবে, সেখান থেকে ডাক্তার verify করতে পারবেন।

**ডাক্তার যোগ করার পদ্ধতি:** ডাক্তার নিজে signup পেজে "ডাক্তার" select করে account খুলবেন → নিজের প্রোফাইল (chamber, fee, দিন) পূরণ করবেন → আপনি admin panel থেকে **ভেরিফাই** করবেন → তখন রোগীরা তাকে দেখতে পাবে।

---

## ধাপ ৪: GitHub-এ push করুন

```bash
git add .
git commit -m "Next.js + Supabase platform"
git remote add origin https://github.com/<আপনার-username>/<repo>.git
git push -u origin main
```

(যদি আগের static site-এর repo-তেই push করেন, Vercel নিজে থেকেই Next.js detect করবে।)

---

## ধাপ ৫: Vercel-এ deploy

1. https://vercel.com → আপনার project → **Settings** → **Environment Variables** — এই ৪টা যোগ করুন (Production + Preview দুটোতেই):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
   | `NEXT_PUBLIC_SITE_URL` | `https://diabetes-zeta-wine.vercel.app` |
   | `CRON_SECRET` | যেকোনো লম্বা random string (যেমন `openssl rand -hex 32` দিয়ে বানান) |

2. **Settings → General → Framework Preset** = Next.js, Root Directory = `./` (default)
3. **Deployments** → সর্বশেষ deployment → **Redeploy** (env var যোগ করার পর redeploy লাগে)

`vercel.json`-এ একটা daily cron আছে (`/api/cron/keepalive`) যেটা প্রতিদিন Supabase-কে একবার ping করে — এতে free project ৭ দিন inactive থেকে pause হবে না।

---

## নিয়মিত করণীয়

- **Backup:** Free tier-এ automatic backup নেই। মাসে একবার Supabase → **Database → Backups** থেকে না পেলে, SQL Editor-এ `select * from glucose_readings` চালিয়ে CSV export করুন, বা `pg_dump` চালান (Project Settings → Database → Connection string)।
- **Storage:** Free 1 GB। ছবি upload-এর আগে browser-এই ~৬০০ KB-র নিচে compress হয়, তাই ~১৫০০ report জায়গা হবে। Dashboard → **Storage** থেকে usage দেখুন।
- **Auth email limit:** ঘণ্টায় ২টা (built-in)। User বাড়লে custom SMTP দিন।

---

## Folder structure

```
supabase/
  schema.sql            # সব table, trigger, RLS policy, storage bucket
  seed_hospitals.sql    # বাংলাদেশের হাসপাতাল list
src/
  proxy.ts              # session refresh + protected route guard
  lib/
    supabase/           # client.ts (browser), server.ts (RSC/actions), proxy.ts
    glucose.ts          # reading classification + পরামর্শ (bn/en)
    i18n/               # dict.ts (সব UI text), server.ts, client.tsx
    database.types.ts   # TypeScript types (schema-র সাথে মিলিয়ে রাখুন)
  components/           # nav, ui, glucose-advice, report-advice
  app/
    page.tsx            # landing
    (auth)/             # login, signup, actions.ts
    (app)/              # login-required pages
      dashboard/ readings/ reports/ doctors/ appointments/ hospitals/ profile/
      doctor/           # ডাক্তার প্যানেল: appointments, patients/[id], profile
      admin/doctors/    # admin: ডাক্তার verify
      actions.ts        # সব server action (zod validation সহ)
    auth/callback, auth/signout, api/locale, api/cron/keepalive
legacy/                 # আগের static site (reference; serve হয় না)
```

## Admin panel (`/admin`)

| Page | কী করা যায় |
|---|---|
| `/admin` | সারসংক্ষেপ: user, reading, report, storage, appointment, hospital সংখ্যা; নতুন user |
| `/admin/users` | সব user খোঁজা (নাম/ইমেইল/ফোন), role filter; user page-এ: নাম/ফোন edit, **role বদল**, **নতুন password set**, **reset link পাঠানো**, **block/unblock**, **delete** (সব data সহ), user-এর reading/report দেখা |
| `/admin/doctors` | ডাক্তার verify/unverify |
| `/admin/appointments` | সব appointment, status filter/বদল, delete |
| `/admin/hospitals` | hospital যোগ/edit/delete (map-এ lat/lng) |
| `/admin/announcements` | নোটিশ প্রকাশ (info/সুখবর/সতর্কতা/জরুরি; সবাই/রোগী/ডাক্তার; শেষ তারিখ) — user-দের dashboard-এ দেখায় |

Admin নিজের role বদলাতে/নিজেকে block বা delete করতে পারে না (ভুলে lock-out রোধ)।

## Security note

- সব table-এ Row Level Security চালু। রোগী শুধু নিজের data দেখে/বদলায়।
- ডাক্তার রোগীর reading/report দেখতে পারে **শুধু** যখন তাদের মধ্যে accepted বা completed appointment আছে।
- `role` আর `is_verified` column শুধু admin বদলাতে পারে — database trigger দিয়ে enforce করা, API দিয়ে bypass সম্ভব না।
- Report file private bucket-এ, ১০ মিনিটের signed URL দিয়ে দেখানো হয়।
- Browser-এ শুধু anon key যায়; সেটা public হলেও RLS-এর কারণে কেউ অন্যের data পড়তে পারবে না।
