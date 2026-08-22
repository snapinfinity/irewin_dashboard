# IREWIN Admin Dashboard

A Job Listing Admin Dashboard built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, and Firebase (Auth, Firestore, Storage). Scope is strictly job-listing management + a public job board — no candidate/ATS features.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS + shadcn/ui (Radix base) — theme tokens in `src/app/globals.css`
- Recharts for the dashboard charts
- Firebase Authentication (Google Sign-In), Cloud Firestore, Firebase Storage

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Firebase

You need a Firebase project either way. Two options:

**Option A — develop against the local Firebase emulators (no live project needed yet):**

```bash
cp .env.local.example .env.local
```

Set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` in `.env.local` (the placeholder Firebase config values are fine for the emulator). Then run the emulators (requires Java 11+ installed):

```bash
npx firebase-tools emulators:start --project demo-project --only auth,firestore,storage
```

**Option B — point at a real Firebase project:**

1. Create a project at the [Firebase console](https://console.firebase.google.com).
2. Enable **Authentication → Sign-in method → Google**.
3. Create a **Firestore** database and a **Storage** bucket.
4. Project settings → General → "Your apps" → add a Web app → copy the config into `.env.local` (`NEXT_PUBLIC_FIREBASE_*` vars), and set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=false`.
5. Deploy security rules and indexes once you have the Firebase CLI logged in to that project:
   ```bash
   npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
   ```

### 3. Run the app

```bash
npm run dev
```

- Public site: [http://localhost:3000](http://localhost:3000)
- Admin login: [http://localhost:3000/login](http://localhost:3000/login)

### 4. Grant yourself admin access

The login page supports both **Google sign-in** and **email/password**. Admin access itself is intentionally **not** self-serve from the UI (a client-writable `admins` collection would let anyone grant themselves access). Instead:

1. In Project settings → Service accounts, generate a private key and save it as `service-account.json` in the project root (already gitignored), **or** set `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env.local` to the key's JSON contents.
2. Add your email to `ADMIN_EMAILS` in `.env.local` (comma-separated for multiple).
3. Pick how you'll sign in:
   - **Google** — sign in once at `/login` first (you'll see "Not authorized", expected), then run the seed script below.
   - **Email/password** — no need to sign in first: set `ADMIN_DEFAULT_PASSWORD` in `.env.local`, and the seed script creates the account for you.
4. Run:
   ```bash
   npm run seed:admin
   ```
5. Sign in — you now have dashboard access. If you used `ADMIN_DEFAULT_PASSWORD`, use "Forgot password?" on the login page afterward to set your own. Repeat with the new person's email to add further admins; `/admin/settings` shows the current admin list read-only.

## Project structure

- `src/app/(public)/` — public job board (home, `/jobs`, `/jobs/[jobId]`, `/categories`)
- `src/app/admin/` — admin dashboard, jobs/categories/companies CRUD, settings
- `src/app/login/` — Google sign-in
- `src/lib/firebase/` — client SDK singleton, Admin SDK (server-only), Firestore converters
- `src/lib/queries/` — typed Firestore CRUD/filter/pagination/aggregation functions
- `src/lib/auth/` — auth context and the admin-status check
- `firestore.rules` / `firestore.indexes.json` / `storage.rules` — security rules and composite indexes
- `scripts/seed-admin.ts` — admin bootstrap script (see above)

## Known v1 limitations (documented tradeoffs)

- **Search** uses a `searchKeywords` array-contains match on one token — not true substring/fuzzy search (would need Algolia/Typesense).
- **Job expiry** is enforced by an explicit `status: 'expired'` transition, not a live deadline check — there's no Cloud Scheduler in this scope, so a job whose deadline has passed stays visible until an admin (or a future scheduled job) marks it expired.
- **Dashboard aggregations** (jobs by category/location/employment type) are computed client-side over a bounded fetch — fine at admin scale; a much larger dataset should move to stored counters or a BigQuery export.
- The `middleware`/`proxy.ts` file is a documented no-op — Firebase's client-side auth state isn't visible to edge middleware without a session-cookie exchange, so the real access gate is `admin/layout.tsx` (client) backed by Firestore Security Rules (server-enforced).

## Testing checklist

- `npm run lint`, `npx tsc --noEmit`, `npm run build` should all pass clean.
- Firestore rules unit tests (not yet included) can be written with `@firebase/rules-unit-testing` against the emulator to verify: published jobs are publicly readable, drafts are not, only admins can write jobs/categories/companies, and the `admins` collection is never client-writable.
