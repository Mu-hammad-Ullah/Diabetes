# WORKLOG — Diabetes Care

এই project-এ যা যা করা হয়েছে তার ধারাবাহিক log। নতুন কাজ হলে নিচে নতুন entry যোগ হবে (সবচেয়ে পুরনো উপরে, নতুন নিচে)।
প্রতিটা entry-তে: কী করা হলো, কেন, কোন ফাইল, আর কোনো সিদ্ধান্ত থাকলে সেটা।

---

## 2026-09-20 — Session 1: পুরনো সাইট fix + Next.js/Supabase-এ পুরো platform তৈরি

### প্রেক্ষাপট
- আগের অবস্থা: `index.html` + `script.js` + `style.css` — static site, Vercel-এ host (https://diabetes-zeta-wine.vercel.app)।
- লক্ষ্য: login, sugar tracker (cloud), report upload, doctor appointment, nearest hospital, reading অনুযায়ী পরামর্শ।
- আলোচনার পর সিদ্ধান্ত:
  - **Database/Auth/Storage: Supabase free tier** (এক জায়গায় তিনটাই, credit card লাগে না)
  - **Framework: Next.js 16 App Router** (doctor/admin role আর server-side logic-এর জন্য)
  - Hospital finder: নিজের curated table + OpenStreetMap Overpass fallback
  - Report থেকে value পড়া: এখন হাতে entry (OCR/AI পরে)
  - Appointment: request → doctor accept/reject; ডাক্তার admin verify করবে
  - ভাষা: বাংলা primary + English toggle

### ধাপ ১ — পুরনো static site-এর bug fix
পাওয়া সমস্যা:
- `script.js` line 424: `document.getElementById('clearHistoryBtn').onclick` — element নেই → JS crash → tracker, BMI, সব handler বন্ধ
- `printBtn`, `langToggleBtn`, `reminderBtn`, `helpBtn` ইত্যাদি — আগের HTML-এর dead code, প্রতিটা crash করত
- `index.html` line 61: `<div class="col-md-4"></div>` ভুলভাবে বন্ধ → "খাবারের পর" input layout-এর বাইরে
- Chart.js `script.js`-এর পরে load হচ্ছিল

করা হলো:
- `script.js` সম্পূর্ণ নতুন করে লেখা (শুধু HTML-এ যা আছে): tracker + reading অনুযায়ী পরামর্শ (fasting/after-meal আলাদা threshold), "ইতিহাস মুছুন" button, BMI (দক্ষিণ এশীয় cut-off ২৩/২৭.৫), hospital map (Overpass + দূরত্ব sort + Google Maps direction link), range chart
- `index.html`: div fix, clear button, chart.js আগে load, chart caption ঠিক
- এই তিনটা ফাইল পরে `legacy/` folder-এ সরানো হয়েছে (reference; নতুন app-এ serve হয় না)

### ধাপ ২ — Next.js project scaffold
- `npx create-next-app@latest` (TypeScript, Tailwind v4, App Router, `src/`), root-এ বসানো
- Packages: `@supabase/supabase-js`, `@supabase/ssr`, `recharts`, `browser-image-compression`, `lucide-react`, `zod`, `leaflet` (+ `@types/leaflet`)
- Next.js 16-এর নতুন নিয়ম (bundled docs পড়ে): `middleware.ts` → `proxy.ts`; `cookies()`, `params`, `searchParams` সব async
- ফাইল: `.env.example`, `vercel.json` (daily cron), `CLAUDE.md` (project notes), `README.md`

### ধাপ ৩ — Database schema + RLS → `supabase/schema.sql`
Tables:
| Table | কাজ |
|---|---|
| `profiles` | প্রতিটা user (role: patient/doctor/admin, নাম, ফোন, DOB, diabetes type, height/weight, locale) — signup trigger-এ auto-create |
| `glucose_readings` | sugar reading (type: fasting/after_meal/random/bedtime, mmol/L, সময়, note) |
| `reports` | upload করা report-এর metadata (file path, HbA1c/fasting/PP হাতে লেখা মান) |
| `doctors` | ডাক্তারের চেম্বার/fee/দিন; `is_verified` শুধু admin বদলায় |
| `appointments` | রোগী → ডাক্তার request; status pending/accepted/rejected/cancelled/completed |
| `hospitals` | curated hospital list (lat/lng) — public read |

Security:
- সব table-এ RLS; রোগী শুধু নিজের row দেখে/বদলায়
- ডাক্তার রোগীর reading/report দেখে **শুধু** accepted/completed appointment থাকলে (`doctor_can_view_patient()`)
- DB trigger: `role` ও `is_verified` শুধু admin বদলাতে পারে; appointment status transition guard
- Storage bucket `reports` private (10 MB, jpg/png/webp/pdf), path `<user_id>/<uuid>.<ext>`, signed URL (১০ মিনিট)
- Helper function: `is_admin()`, `my_role()`, `my_doctor_id()`, `nearby_hospitals(lat,lng,radius,limit)` (haversine, PostGIS ছাড়া)
- পুরো ফাইল idempotent — বারবার চালানো নিরাপদ
- Fix: function নাম `current_role` → `my_role` (SQL reserved word)

`supabase/seed_hospitals.sql`: বাংলাদেশের ৪৭টা হাসপাতাল (BADAS network, মেডিকেল কলেজ, বিভাগীয় ডায়াবেটিক হাসপাতাল) — coordinates OpenStreetMap-ভিত্তিক, ±১০০ মিটার

### ধাপ ৪ — App foundation
- `src/lib/supabase/client.ts` (browser), `server.ts` (RSC/action + `getCurrentUser()` cached), `proxy.ts` (session refresh + protected route guard)
- `src/proxy.ts` — `/dashboard`, `/readings`, `/reports`, `/doctors`, `/appointments`, `/hospitals`, `/profile`, `/doctor`, `/admin` login ছাড়া → `/login?next=...`
- `src/lib/database.types.ts` — schema-র TypeScript type
- `src/lib/glucose.ts` — reading classification (ADA/WHO threshold) + bn/en পরামর্শ + disclaimer; ওষুধের dose কখনো suggest করে না
- `src/lib/i18n/` — `dict.ts` (bn source of truth, en type-checked), `server.ts` (`getT()`), `client.tsx` (`useI18n()`); cookie `locale`, বদল `POST /api/locale`
- `src/app/layout.tsx` — Noto Sans Bengali + Inter font, Nav, footer disclaimer
- `src/app/globals.css` — Tailwind v4 + `.btn`, `.card`, `.input`, `.badge` component class (নোট: v4-এ custom class-এর ভেতরে `@apply btn` চলে না, তাই JSX-এ `btn btn-primary` compose)
- `src/components/nav.tsx` (role অনুযায়ী menu, mobile hamburger, ভাষা switch), `ui.tsx` (PageHeader, Alert, StatusBadge, Field…), `submit-button.tsx`
- Routes: `/auth/callback` (email confirm/reset link), `/auth/signout`, `/api/locale`, `/api/cron/keepalive` (Vercel cron daily → Supabase pause হবে না; `CRON_SECRET` দিয়ে protected)

### ধাপ ৫ — Auth (`src/app/(auth)/`)
- `actions.ts`: login, signup (role patient/doctor metadata → DB trigger profile বানায়), forgotPassword, updatePassword — সব zod validated
- `login/` (forgot-password toggle সহ), `signup/` (রোগী/ডাক্তার select)

### ধাপ ৬ — রোগীর app (`src/app/(app)/`)
- `actions.ts`: addReading (mg/dL → mmol/L convert), deleteReading, saveReportMeta, deleteReport, requestAppointment, cancelAppointment, setAppointmentStatus (doctor), updateProfile, updateDoctorProfile, setDoctorVerified (admin)
- `dashboard/` — stat tile (সর্বশেষ reading, ৭/৩০ দিনের গড়, BMI), সর্বশেষ reading-এর পরামর্শ, quick action, আসন্ন appointment, সাম্প্রতিক report
- `readings/` — form (type, mmol/mg-dL unit, সময়, note), সর্বশেষ reading-এর পরামর্শ panel, ৩০ দিনের line chart (recharts; ৪ series fixed color, dataviz validator pass, 3.9/14 reference line), history table (delete সহ)
- `reports/` — upload form: ছবি হলে browser-এ compress (~600 KB, webp) → private bucket → metadata save; fail হলে orphan ফাইল মুছে দেয়। `reports/[id]` — signed URL-এ preview (pdf iframe / image), হাতে লেখা মান, HbA1c + fasting/PP অনুযায়ী পরামর্শ, delete
- `doctors/` — verified ডাক্তার list, শহর দিয়ে search; `doctors/[id]` — details + appointment request form
- `appointments/` — নিজের request list, status badge, cancel
- `hospitals/` — "আমার কাছের খুঁজুন": geolocation → `nearby_hospitals` RPC (৫০ কিমি) + Overpass (৮ কিমি, duplicate বাদ) → Leaflet map (specialized = কমলা pin) + list (দূরত্ব, call, direction)
- `profile/` — নাম, ফোন, DOB, লিঙ্গ, diabetes type, উচ্চতা/ওজন, ভাষা; `profile/password`

### ধাপ ৭ — ডাক্তার প্যানেল ও admin
- `doctor/` — pending request, আসন্ন appointment, রোগী সংখ্যা; verify না হলে warning
- `doctor/appointments/` — status filter, accept/reject (note সহ), complete
- `doctor/patients/[id]` — রোগীর ৯০ দিনের chart, reading table (read-only), report list (RLS-এ শুধু নিজের রোগী)
- `doctor/profile/` — specialty, BMDC no, chamber, fee, দিন (checkbox), সময়, bio
- `admin/doctors/` — সব ডাক্তার, verify/unverify

### যাচাই
- `tsc --noEmit` ✔ · `eslint` ✔ (React compiler rule অনুযায়ী ৩টা fix) · `next build` ✔ (২২ route)
- `next start` চালিয়ে: `/` বাংলায় render, `/dashboard` → login redirect, ভাষা switch → English render ✔
- Real Supabase-এর বিপক্ষে test **হয়নি** (credential নেই) — প্রথম signup/SQL run-এ error এলে জানাবেন

### Documentation
- `SETUP.md` — Supabase project, SQL run, auth URL, env var, Vercel deploy, admin বানানো — click-by-click
- `CLAUDE.md` — future Claude session-এর জন্য project convention
- `README.md`

### বাকি / পরের ধাপ (user-এর দিক থেকে)
1. Supabase project → `schema.sql` + `seed_hospitals.sql` চালানো
2. `.env.local`-এ key বসিয়ে local test
3. GitHub push → Vercel env var → redeploy
4. নিজেকে admin বানানো (SQL)

### ভবিষ্যতের candidate
- Appointment status বদলালে email/SMS notification
- Custom SMTP (built-in limit ঘণ্টায় ২ email)
- AI/OCR দিয়ে report থেকে মান পড়া
- আরও দেশের hospital data, আরও ভাষা
- Git commit এখনো করা হয়নি

---
