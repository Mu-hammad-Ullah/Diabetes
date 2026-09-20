@AGENTS.md

# Diabetes Care — project notes

- Next.js 16 (App Router, `src/`), Tailwind v4, Supabase (Postgres + Auth + Storage). Deployed on Vercel.
- Next 16 conventions: `src/proxy.ts` (not middleware), `cookies()`/`params`/`searchParams` are async.
- DB schema + RLS live in `supabase/schema.sql` (idempotent; paste into Supabase SQL editor). Types are hand-written in `src/lib/database.types.ts` — keep both in sync.
- Security model: every table has RLS; patients see only their rows; doctors see a patient's readings/reports only while an `accepted`/`completed` appointment exists (`doctor_can_view_patient()`); `role` and `is_verified` can only be changed by admin (DB triggers). Storage bucket `reports` is private, path `<user_id>/<uuid>.<ext>`, served via signed URLs.
- Glucose classification/advice lives in `src/lib/glucose.ts` — general lifestyle guidance only, never diagnosis or dosing.
- i18n: `src/lib/i18n/dict.ts` (`bn` is source of truth, `en` is type-checked against it). Server: `getT()`; client: `useI18n()`. Locale cookie set via `POST /api/locale`.
- `legacy/` is the original static site (kept for reference, not served).
- Do not use `@apply` with custom component classes in Tailwind v4 — compose `btn btn-primary` in JSX instead.
- Every piece of work must be appended as an entry to `WORKLOG.md` (Bengali, dated, what/why/which files/decisions). User relies on it as the history of the project.
