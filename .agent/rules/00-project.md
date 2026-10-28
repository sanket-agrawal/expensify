# Project rules: Tripsplit

Trip expense splitting web app for small friend groups. Mobile-first. Deployed on Vercel.

## Stack (do not substitute)
- Frontend: Vue 3 (Composition API, `<script setup lang="ts">`), Vite, Vue Router, Pinia, Tailwind CSS
- Icons: `lucide-vue-next`
- Backend: Vercel Serverless Functions in `/api` (TypeScript). No separate server.
- Database: MongoDB with the official `mongodb` driver. No Mongoose.
- Storage: Google Cloud Storage, private bucket, signed URLs only
- Validation: Zod, schemas shared between frontend and API from `/shared`
- Tests: Vitest

## TypeScript
- `strict: true`. No `any`, no `@ts-ignore`, no non-null `!` unless commented with why it is safe.
- Prefer `unknown` plus Zod parsing at boundaries over casting.
- Derive types from Zod schemas with `z.infer`. Do not hand-write a type that duplicates a schema.

## Money (critical)
- All amounts are **integers in minor units** (paise). Never store or compute with floats.
- Convert to display strings only at the UI edge, through the single `MoneyText` component or `formatMoney()` in `shared/money.ts`.
- Parse user input (`"1,240.50"`) to minor units in one function: `parseMoneyInput()`.
- Equal split remainders are distributed deterministically: the first N participants (by participant order) get +1 minor unit.
- Balance per person = total paid - total owed.
- Settlement logic lives in `shared/settlement.ts` as pure functions. Every change to money logic needs a Vitest test.

## Serverless and database
- Cache the Mongo client on `globalThis` so hot reloads and warm lambdas do not exhaust connections.
- Every API route requires and validates the trip access token before touching data.
- Every query is scoped by `tripId`. Never query expenses without it.
- Soft delete expenses with `deletedAt`. Filter deleted ones out in queries by default.
- Store GCS **object keys**, never public URLs.

## Photos
- Browser uploads directly to GCS using V4 signed PUT URLs. Never proxy image bytes through Vercel functions (body limit about 4.5MB).
- Compress client-side before upload (max about 1600px, JPEG quality about 0.8).
- Server validates content type (jpeg, png, webp, heic) and max size (10MB) when signing. Object keys are namespaced by trip id.

## Secrets
- Env vars: `MONGODB_URI`, `MONGODB_DB`, `GCS_BUCKET`, `GCP_SERVICE_ACCOUNT_JSON_BASE64`.
- Never commit secrets. Never log connection strings, tokens or signed URLs.
- Keep `.env.example` in sync whenever a variable is added.

## Auth seam
- All components read the current user through `useCurrentUser()`. Never touch localStorage directly for identity.
- On the API, resolve the actor in one `getActor(req)` function.
- Google Sign-In comes later. Do not build it now, only keep this seam clean.

## Working agreement
- Work in phases and stop for review after each one.
- Before each phase, state what you will build. After, list what changed and how to verify it.
- Do not add dependencies without saying why. Prefer small, well-known libraries.
- If a requirement is ambiguous, ask once, then proceed with the most reasonable assumption and state it.
