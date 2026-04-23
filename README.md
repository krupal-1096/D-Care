# D-Care (Admin + Doctor apps)

D-Care is a dermatology case review platform with an admin console (React + Vite + Zustand) and a Node/Express backend backed by Firebase. Admins manage cases, doctors, and team access; doctors review and verify patient cases.

## Getting started

```bash
pnpm install
pnpm dev
```

## Requirements
- Node 18+ and pnpm 9+
- Firebase project credentials (service account JSON as base64 in `FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`)
- `AUTH_SECRET` for local JWT logins; optional `DEFAULT_ADMIN_EMAIL`/`DEFAULT_ADMIN_PASSWORD` for bootstrap

## Setup
1) Install deps: `pnpm install`
2) Backend env: create `.env` in `backend/` with `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT`, `AUTH_SECRET`, optional defaults.  
3) Run backend: `cd backend && pnpm dev`
4) Run admin app: `pnpm dev:admin` (served from `/admin`)
5) Run doctor app (if needed): `pnpm dev:doctor`

## Scripts
- `pnpm dev:admin` / `build:admin` / `preview:admin`
- `pnpm dev:doctor` / `build:doctor` / `preview:doctor`

## What’s included

- Persistent login store (email + password or Google ID) until logout.
- Patient data seeded from `src/data/patients.ts` with Zustand persistence.
- Home (patient cards), patient form (sliders per disease), and verified patients filtered by the logged-in doctor.
- Dynamic header title and bottom navigation.
