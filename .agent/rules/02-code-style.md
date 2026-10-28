# Code style and conventions

## Folder structure
```
/api                 Vercel functions (file-based routes) + _lib/
  _lib/              db.ts, gcs.ts, auth.ts (getActor), errors.ts, validate.ts
/shared              Zod schemas, money.ts, split.ts, settlement.ts, types. No Vue, no Node-only imports.
/src
  /auth              AuthProvider interface, TokenPickerAuth
  /components        reusable UI (ui/ for primitives, feature folders for the rest)
  /composables       useXxx.ts
  /lib               pure helpers (categoryMatcher.ts, imageCompress.ts, apiClient.ts)
  /pages             route-level components
  /stores            Pinia stores
  /styles            tokens.css, base.css
  /assets            fonts, svg illustrations
/tests               mirrors source structure
.agent               rules, skills, workflows
```
Put anything used by both frontend and API in `/shared`.

## Naming
- Vue components: `PascalCase.vue`, multi-word (`ExpenseRow.vue`, not `Row.vue`).
- Composables: `useThing.ts`. Stores: `useThingStore`.
- Other files: `camelCase.ts`. Constants: `SCREAMING_SNAKE_CASE`.
- Types and interfaces: `PascalCase`. Zod schemas: `thingSchema`, inferred type `Thing`.
- API route files follow Vercel conventions (`[token].ts`, `[id].ts`).
- Money fields end in `Minor` (`amountMinor`). Ids referencing participants end in `Id`.

## Zod at every boundary
- Parse and validate: request bodies, query params, route params, env vars, and API responses on the client.
- Define each schema once in `/shared/schemas` and reuse for the API handler, the client method and the form.
- On failure return the standard error shape, never a raw Zod error.

## API conventions
- Error shape: `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`.
- Codes: `VALIDATION_ERROR` 400, `UNAUTHORIZED` 401, `NOT_FOUND` 404, `CONFLICT` 409, `INTERNAL` 500.
- Handlers stay thin: parse, authorise, call a function, return. Business logic goes in `/shared` or `_lib`.
- Wrap handlers with one shared `handler()` helper that handles method checks, errors and JSON responses.
- Never leak stack traces or internal ids in errors.

## Vue conventions
- `<script setup lang="ts">` only. No Options API.
- Props typed with `defineProps<{...}>()`, emits typed with `defineEmits`.
- Keep components under about 200 lines. Extract composables for stateful logic.
- Server data goes through the API client and Pinia stores, not scattered `fetch` calls.
- No business logic in templates. Compute in `computed` or in `/shared`.
- Use Tailwind utility classes with design tokens. Repeated class clusters become components, not `@apply` sprawl.

## Errors and UX states
- Every async action has loading, success, and error states. Disable submit while pending (no double submits).
- Use the Toast component for feedback. Destructive actions offer undo.
- Handle: invalid token page, trip not found, offline, upload failure with retry.

## Tests
- Vitest. Pure logic in `/shared` and `/src/lib` must have unit tests.
- Required coverage: even split, uneven remainder, custom amounts, percentages, excluded participant, all-settled case, settlement minimisation, category matcher (at least 40 phrases).
- Test names read as sentences: `it("gives the extra paise to the first participants")`.

## Git and hygiene
- Small commits with clear messages (`feat: add expense split calculator`).
- ESLint and Prettier must pass. Type-check (`vue-tsc --noEmit`) must pass with zero errors.
- No `console.log` in committed code. No commented-out code.
- No TODOs without a short reason.
