# IREWIN Admin Dashboard

A Job Listing Admin Dashboard built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, and Firebase (Auth, Firestore, Storage). Scope is strictly job-listing management — no candidate/ATS features.

**This project is admin-only.** Every page requires a signed-in, authorized admin; there are no public pages. The public-facing IREWIN job site (category + job listings for visitors) is a **separate project** that reads the same Firestore collections anonymously — which is why the security rules still grant public read access to published jobs, categories and companies (see [Security model](#security-model)).

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

- [http://localhost:3000](http://localhost:3000) — redirects to `/admin`, which sends you to `/login` if you aren't signed in
- Login page directly: [http://localhost:3000/login](http://localhost:3000/login)

### 4. Grant yourself Super Admin access

Three roles:

| Role | `role` value | Can do |
|---|---|---|
| Super Admin | `owner` | Everything: full CRUD on jobs/categories/companies, add Admins/Employees, **remove an Admin** (only role that can) |
| Admin | `admin` | Full create/edit/**delete** on jobs/categories/companies; can add Admins and Employees; can remove Employees (not Admins) |
| Employee | `employee` | Create jobs/categories/companies and edit **their own** — never delete, never edit someone else's entry |

Exactly one email is ever bootstrapped as Super Admin, via `SUPER_ADMIN_EMAIL` — this is intentionally **not** self-serve from the UI (a client-writable `admins` collection would let anyone grant themselves access, Super Admin included). To bootstrap yourself as the first Super Admin:

1. In Project settings → Service accounts, generate a private key and save it as `service-account.json` in the project root (already gitignored), **or** set `FIREBASE_SERVICE_ACCOUNT_JSON` in `.env.local` to the key's JSON contents.
2. Set `SUPER_ADMIN_EMAIL` in `.env.local` to your email.
3. Pick how you'll sign in:
   - **Google** — sign in once at `/login` first (you'll see "Not authorized", expected), then run the seed script below.
   - **Email/password** — no need to sign in first: set `ADMIN_DEFAULT_PASSWORD` in `.env.local`, and the seed script creates the account for you.
4. Run:
   ```bash
   npm run seed:admin
   ```
5. Sign in — you now have Super Admin access. If you used `ADMIN_DEFAULT_PASSWORD`, use "Forgot password?" on the login page afterward to set your own.

From then on, **add or remove Admins/Employees from the UI**: Settings → Admin Management → Add Admin (visible to any Admin or the Super Admin; both can grant either role). The `ADMIN_EMAILS` / `npm run seed:admin` path still exists for bulk/initial bootstrap of Admins, but day-to-day people management should go through the UI.

## Project structure

- `src/app/page.tsx` — site root, redirects to `/admin`
- `src/app/admin/` — admin dashboard, jobs/categories/companies CRUD, settings (all gated by `admin/layout.tsx`)
- `src/app/login/` — Google + email/password sign-in
- `src/lib/firebase/` — client SDK singleton, Admin SDK (server-only), Firestore converters
- `src/lib/queries/` — typed Firestore CRUD/filter/pagination/aggregation functions
- `src/lib/auth/` — auth context and the admin-status check
- `firestore.rules` / `firestore.indexes.json` / `storage.rules` — security rules and composite indexes
- `scripts/seed-admin.ts` — admin bootstrap script (see above)

## Security model

- **Every page in this app requires an authorized admin.** The gate is `src/app/admin/layout.tsx` (redirects to `/login` unless a matching `admins/{uid}` doc exists), backed by Firestore Security Rules, which are the actual server-side enforcement.
- **Three roles, enforced in `firestore.rules` (not just hidden UI buttons):**
  - `create` on jobs/categories/companies — any of the three roles, and only as themselves (`createdBy` must equal their own uid).
  - `update` — Admin or Super Admin can edit anything; an Employee can only edit a document they created, and can't reassign `createdBy` to dodge that check.
  - `delete` — Admin or Super Admin only. An Employee can never delete, even their own document — enforced in the rule itself, so a raw `deleteDoc()`/`updateDoc()` call from the browser console is rejected regardless of what the UI shows.
  - Who can remove *another admin* is finer-grained than the content rules and lives in `POST /api/admin/remove-admin` (see below), not in `firestore.rules`, since every write to the `admins` collection goes through the Admin SDK regardless of role.
- **Reads are deliberately still public** for `status == 'published'` jobs, `categories`, `companies` and company logos. That is *not* for this app; it exists so the separate public IREWIN job site can read listings without authenticating. Draft, unpublished and expired jobs are never readable by anonymous users.
- **The `admins` collection is never client-writable, Super Admin included** (`allow write: if false` unconditionally) — it can only be read by a user for their own document. Granting/revoking admin access always goes through the Admin SDK (bypassing rules), from one of three trusted server-side entry points, each of which independently re-verifies the caller's role server-side before touching the collection:
  - `scripts/seed-admin.ts` — CLI bootstrap, assigns `role: 'owner'` only to `SUPER_ADMIN_EMAIL`, `role: 'admin'` to everyone else in `ADMIN_EMAILS`. The only path that can ever mint an owner.
  - `POST /api/admin/add-admin` — used by the Admin Management UI; callable by an Admin or the Super Admin; the `role` in the request body is validated against an explicit `['admin', 'employee']` allowlist, so it can never be tricked into granting `'owner'`.
  - `POST /api/admin/remove-admin` — used by the Admin Management UI; callable by an Admin or the Super Admin, but an Admin caller may only remove an Employee (removing another Admin is Super-Admin-only). Also blocks removing yourself or the `SUPER_ADMIN_EMAIL` account, to prevent locking the project out of its only Super Admin.

## Known v1 limitations (documented tradeoffs)

- **Search** uses a `searchKeywords` array-contains match on one token — not true substring/fuzzy search (would need Algolia/Typesense).
- **Job expiry** is enforced by an explicit `status: 'expired'` transition, not a live deadline check — there's no Cloud Scheduler in this scope, so a job whose deadline has passed stays `published` (and therefore publicly readable) until an admin marks it expired.
- **Dashboard aggregations** (jobs by category/location/employment type) are computed client-side over a bounded fetch — fine at admin scale; a much larger dataset should move to stored counters or a BigQuery export.
- The `middleware`/`proxy.ts` file is a documented no-op — Firebase's client-side auth state isn't visible to edge middleware without a session-cookie exchange, so the real access gate is `admin/layout.tsx` (client) backed by Firestore Security Rules (server-enforced).

## Testing checklist

- `npm run lint`, `npx tsc --noEmit`, `npm run build` should all pass clean.
- `npm run check:rules` probes the live project anonymously and verifies the deployed Firestore rules actually match `firestore.rules`. **Run this first if sign-in mysteriously fails** — undeployed (default-deny) rules block the app from reading `admins/{uid}`, which looks like broken auth.
- `npm run build`'s route table should list only `/`, `/admin/*`, `/login` and `/api/admin/list-admins` — any `/jobs` or `/categories` route reappearing means public pages crept back in.
- Logged out, `/` should land you on `/login`.
- Role enforcement: signed in as `role: 'employee'`, confirm Delete is never offered anywhere, Edit only appears on documents they created, and a direct `deleteDoc()`/`updateDoc()` on someone else's document from the browser console still fails with `permission-denied`. Signed in as `role: 'admin'`, confirm they can delete jobs/categories/companies and add other Admins/Employees, but the Remove action never appears next to another Admin or the Super Admin (and `POST /api/admin/remove-admin` rejects it with a 403 if forced).
- Firestore rules unit tests (not yet included) can be written with `@firebase/rules-unit-testing` against the emulator to verify: published jobs are publicly readable, drafts are not, any staff member can create a document as themselves, an Admin/Super Admin can edit or delete anything, an Employee can edit only their own document and never delete, and the `admins` collection is never client-writable by anyone regardless of role.
