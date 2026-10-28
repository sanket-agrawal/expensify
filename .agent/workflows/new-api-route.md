---
description: Add a new Vercel API route end to end (schema, handler, test, client method)
---

# Workflow: add a new API route

Use when adding or changing any endpoint under `/api`. Do the steps in order and report after each.

1. **Define the contract**
   - State the method, path, who may call it, request shape and response shape.
   - Add or update Zod schemas in `/shared/schemas/` (request body, params, response).
   - Export inferred types.

2. **Write the pure logic first (if any)**
   - Put calculations or transformations in `/shared` or `api/_lib`, not in the handler.
   - Add Vitest tests for it before wiring the route.

3. **Create the handler**
   - File: `api/trips/[token]/<resource>.ts` (or the matching path).
   - Wrap with the shared `handler()` helper. Allow only the intended HTTP methods.
   - Validate params, query and body with the Zod schemas.
   - Resolve the trip from `token` and the actor with `getActor(req)`. Return `UNAUTHORIZED` or `NOT_FOUND` as appropriate.
   - Scope every Mongo query by `tripId`.
   - Return the standard error shape on failure.

4. **Database**
   - If the route needs a new query pattern, add the index in `api/_lib/indexes.ts` and note it.
   - Never store floats for money. Amounts are `*Minor` integers.

5. **Test the route**
   - Add tests for: success, validation failure, invalid token, wrong trip, and any edge case specific to the route.

6. **Add the client method**
   - Add a typed function in `src/lib/apiClient.ts` that parses the response with the same Zod schema.
   - Expose it through the relevant Pinia store or composable.
   - Handle loading, error and success states in the UI that uses it.

7. **Verify and report**
   - Run `vue-tsc --noEmit`, lint, and `vitest run`. All must pass.
   - Update `.env.example` and the README if anything new was needed.
   - Summarise: files changed, how to call the route (curl example), and what to check manually.
