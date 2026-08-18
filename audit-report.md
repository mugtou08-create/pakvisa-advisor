# PakVisa Advisor — Full Audit Report

**Date:** 2025-06-18  
**Auditor:** Automated Agent Audit  
**Scope:** All API routes, components, lib files, config files

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| High | 8 |
| Medium | 10 |
| Low | 7 |

---

## CRITICAL Issues

### C-01: Turso Auth Token Hardcoded in Source Code
- **File:** `src/lib/db.ts`, line 10
- **Description:** The Turso database auth token (`eyJhbGci...`) is hardcoded directly in the source file. This token was also previously exposed in a public backup file. Anyone with source access (or the git history) has full read/write access to the production database.
- **Severity:** Critical
- **Fix:** Immediately rotate the Turso auth token from the Turso dashboard. Move credentials to environment variables (`TURSO_URL`, `TURSO_AUTH_TOKEN`) and reference via `process.env`. Add `db.ts` to `.gitignore` if it ever contained secrets, or use `git filter-branch` to scrub history.

### C-02: Forgeable Base64 Admin Auth Token
- **File:** `src/app/api/admin/route.ts`, line 56; `src/app/api/admin/analytics/route.ts`, line 7-16; `src/app/api/admin/settings/route.ts`, line 7-18
- **Description:** Admin authentication uses `Buffer.from(\`${admin.id}:${admin.username}:${admin.role}:${Date.now()}\`).toString('base64')` — a trivially forgeable token. Anyone who knows (or guesses) the admin's username and ID can construct a valid token. The validation only checks format and timestamp, never verifying against the database or a secret.
- **Severity:** Critical
- **Fix:** Replace with proper JWT tokens signed with a server-side secret (e.g., using `jose` or `jsonwebtoken`). Validate JWT signatures on all admin endpoints, not just base64 decoding.

### C-03: Hardcoded Backup Secret
- **File:** `src/app/api/download-backup/route.ts`, line 4
- **Description:** `BACKUP_SECRET` defaults to `'pakvisa-admin-backup-2026'` when the environment variable is unset. This is a weak, guessable secret that protects full database export (all countries, all site settings). If `BACKUP_SECRET` is not set in Vercel env, the default is used.
- **Severity:** Critical
- **Fix:** Ensure `BACKUP_SECRET` is set to a cryptographically random value (32+ chars) in Vercel environment variables. Remove the default fallback or fail closed (return 500 if unset).

### C-04: In-Memory Rate Limiting Ineffective on Serverless
- **File:** `src/lib/rate-limit.ts`, lines 1-26
- **Description:** Rate limiting uses an in-process `Map`. On Vercel serverless, each cold start creates a fresh Map, and different instances don't share state. An attacker can bypass rate limits by sending requests to different serverless instances. The chat endpoint's free-tier daily limit (`freeUsageCounts` Map in `chat/route.ts` line 24) has the same problem.
- **Severity:** Critical
- **Fix:** Use a distributed rate limiter backed by Vercel KV, Upstash Redis, or Turso itself (write a rate-limit row). For a quick fix, at minimum log warnings that rate limiting is best-effort.

---

## HIGH Issues

### H-01: No Authentication on Profile/Session/API Endpoints
- **File:** `src/app/api/profile/route.ts` (GET returns ALL profiles); `src/app/api/session/route.ts` (GET/POST); `src/app/api/score/route.ts`; `src/app/api/score-batch/route.ts`
- **Description:** The GET `/api/profile` endpoint returns ALL user profiles (including names, passport numbers, dates of birth) with zero authentication. Anyone can call it. The session and score endpoints accept arbitrary `userProfileId` / `sessionId` parameters and read/create data without auth.
- **Severity:** High
- **Fix:** Add authentication to all user-data endpoints. At minimum, use a session token or API key. The profile GET should require admin auth.

### H-02: Passport Number Stored in Plain Text
- **File:** `src/app/api/profile/route.ts`, line 73; `prisma/schema.prisma`, line 112
- **Description:** Passport numbers are stored unencrypted in the database and returned in API responses. This is sensitive PII.
- **Severity:** High
- **Fix:** Encrypt passport numbers at rest (e.g., using AES-256 with a server-side key). Never return passport numbers in list APIs — only in detail views with auth.

### H-03: Export Endpoint Returns User PII in Profile
- **File:** `src/app/api/export/route.ts`, lines 96-101
- **Description:** The export endpoint echoes back the submitted `profile` object (including `fullName`, potentially `passportNumber`, `age`) in the response. An attacker could submit any profile data and get it reflected back, or the profile data could be logged.
- **Severity:** High
- **Fix:** Do not echo back raw profile data. If profile info is needed in the export, sanitize it (remove passport numbers) and validate fields.

### H-04: `countryCodes` Array Length Not Validated on Export
- **File:** `src/app/api/export/route.ts`, line 19
- **Description:** The `countryCodes` array is checked for emptiness but not for maximum length. An attacker could send hundreds of country codes, causing an expensive database query (`findMany` with `include` on 3 relations).
- **Severity:** High
- **Fix:** Add `countryCodes.length > 20` validation and return 400.

### H-05: `score-batch` Fetches ALL Countries Without Limit
- **File:** `src/app/api/score-batch/route.ts`, line 177
- **Description:** `db.country.findMany({ include: { visaTypes, requirements, costProfiles } })` fetches all 70+ countries with all relations in a single unbounded query. With growth, this will cause timeouts and memory pressure on serverless.
- **Severity:** High
- **Fix:** Add pagination or at minimum a `take` limit. For 70 countries this works now, but add a guard: `take: 500`.

### H-06: `countries/stats` Fetches ALL Countries Without Pagination
- **File:** `src/app/api/countries/stats/route.ts`, line 6
- **Description:** `db.country.findMany({ include: { costProfiles: true } })` loads all countries and cost profiles into memory for a stats aggregation. Should use database-level aggregation instead.
- **Severity:** High
- **Fix:** Use `db.country.aggregate()` with `_count`, `_avg`, `_min`, `_max` to compute stats without loading full rows. Or at minimum use `select` to only fetch needed fields.

### H-07: Admin `isOnline` Never Reset to `false`
- **File:** `src/app/api/admin/route.ts`, line 52
- **Description:** On login, `isOnline` is set to `true`, but there is no logout endpoint or TTL mechanism to set it back to `false`. All logged-in admins will permanently show as online.
- **Severity:** High (data integrity)
- **Fix:** Add a logout endpoint that sets `isOnline = false`. Or use a TTL-based approach (check `lastLogin` and consider offline after X minutes).

### H-08: Admin Analytics Returns Password Hash Info via Admin Users Query
- **File:** `src/app/api/admin/analytics/route.ts`, lines 79-81
- **Description:** While the query uses `select` to exclude `passwordHash`, the `adminUsers` array is returned to anyone with a valid (forgeable) token. Combined with C-02, this exposes admin usernames and last login times.
- **Severity:** High
- **Fix:** Fix the auth system (C-02). This data exposure becomes moot with proper JWT auth.

---

## MEDIUM Issues

### M-01: Client-Side `isProUser` Can Be Toggled Freely
- **File:** `src/components/visa/ai-chat-panel.tsx`, lines 177, 360; `src/lib/store.ts`, line 189-190
- **Description:** The "Enable Pro" button calls `useAppStore.getState().setIsProUser(true)` — a client-side state toggle. While the server ignores `isPro` (line 52 of chat/route.ts), the UI shows Pro badges and "Database Verified" indicators, misleading users.
- **Severity:** Medium
- **Fix:** Either remove the client-side Pro toggle (it's misleading), or implement real Pro auth. If keeping it for demo, add a clear "Demo Mode" indicator.

### M-02: No Error Boundary in the App
- **File:** `src/app/page.tsx`, `src/app/layout.tsx`
- **Description:** There is no React Error Boundary wrapping the application. If any component throws during render, the entire page crashes with a white screen.
- **Severity:** Medium
- **Fix:** Add an Error Boundary component in `layout.tsx` that catches render errors and shows a friendly fallback UI with a retry button.

### M-03: Currency `refresh` Parameter Clears Global Cache for All Users
- **File:** `src/app/api/currency/route.ts`, lines 128-131
- **Description:** `?refresh=true` clears the in-memory `cachedRates` for the entire serverless instance. While rate-limited, this means one user's refresh affects all concurrent users on the same instance.
- **Severity:** Medium
- **Fix:** Acceptable for now due to rate limiting, but document this behavior. Consider using Next.js `revalidate` tags instead.

### M-04: `whatif` Route Missing IP `.split(',')[0]` for Multi-IP Headers
- **File:** `src/app/api/whatif/route.ts`, line 156
- **Description:** `request.headers.get('x-forwarded-for') || 'unknown'` does not call `.split(',')[0].trim()` unlike other routes. If the header contains multiple IPs (common with CDNs), the full comma-separated string is used as the rate-limit key, making it ineffective.
- **Severity:** Medium
- **Fix:** Add `.split(',')[0].trim()` consistent with other routes.

### M-05: `analytics/track` Route Missing IP `.split(',')[0]`
- **File:** `src/app/api/analytics/track/route.ts`, line 23
- **Description:** Same issue as M-04. The raw `x-forwarded-for` header is stored and used for rate limiting without extracting the first IP.
- **Severity:** Medium
- **Fix:** Add `.split(',')[0].trim()`.

### M-06: `admin` Login Route Missing IP `.split(',')[0]`
- **File:** `src/app/api/admin/route.ts`, line 9
- **Description:** Same issue as M-04 and M-05.
- **Severity:** Medium
- **Fix:** Add `.split(',')[0].trim()`.

### M-07: Score Route Writes Audit Logs Even for Non-Existent Sessions
- **File:** `src/app/api/score/route.ts`, lines 146-168
- **Description:** When `sessionId` is provided but not found, the route returns 404. But when `sessionId` is not provided at all, audit logs are written with `sessionId: 'no-session'`, creating orphaned audit log entries that are not associated with any real session.
- **Severity:** Medium
- **Fix:** Only write audit logs when a valid `sessionId` is provided and verified.

### M-08: `countryCodes` Not Sanitized for Length in Compare Route
- **File:** `src/app/api/compare/route.ts`, line 164
- **Description:** While there is a `countryCodes.length > 10` check, each country fetch includes 3 relations (visaTypes, requirements, costProfiles). With 10 countries, this could return a very large payload.
- **Severity:** Medium
- **Fix:** Current limit of 10 is reasonable, but consider reducing to 5 or adding response size monitoring.

### M-09: No `Content-Security-Policy` Header
- **File:** `next.config.ts`, lines 15-28
- **Description:** Security headers include `X-Frame-Options`, `X-Content-Type-Options`, etc., but there is no `Content-Security-Policy` header. This leaves the site more vulnerable to XSS.
- **Severity:** Medium
- **Fix:** Add a CSP header, e.g., `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;`

### M-10: `ignoreBuildErrors: true` in next.config.ts
- **File:** `next.config.ts`, line 5
- **Description:** TypeScript build errors are silently ignored. This means type errors can slip into production without blocking deploys.
- **Severity:** Medium
- **Fix:** Set `ignoreBuildErrors: false` and fix existing type errors. This may require fixing typing issues first.

---

## LOW Issues

### L-01: Duplicate `transformCountryToData` Function Across 3 Files
- **File:** `src/app/api/score/route.ts`, `src/app/api/score-batch/route.ts`, `src/app/api/compare/route.ts`, `src/app/api/whatif/route.ts`
- **Description:** The same ~60-line `transformCountryToData` function is copy-pasted across 4 route files. Any bug fix must be applied 4 times.
- **Severity:** Low
- **Fix:** Extract to a shared utility in `src/lib/transform.ts` and import in all routes.

### L-02: Duplicate `safeJsonParse` Function Across 4 Files
- **File:** `src/app/api/session/route.ts`, `src/app/api/profile/route.ts`, `src/app/api/score/route.ts`, `src/app/api/score-batch/route.ts`, `src/app/api/whatif/route.ts`
- **Description:** Same 4-line function duplicated 5 times.
- **Severity:** Low
- **Fix:** Extract to `src/lib/utils.ts`.

### L-03: Duplicate `validateToken` Function in Admin Routes
- **File:** `src/app/api/admin/analytics/route.ts`, `src/app/api/admin/settings/route.ts`
- **Description:** Identical token validation function duplicated. (Though the whole auth mechanism needs replacement per C-02.)
- **Severity:** Low
- **Fix:** Create `src/lib/admin-auth.ts` with shared auth utilities.

### L-04: Footer/Modal JSX Duplicated in Tool Panel View
- **File:** `src/app/page.tsx`, lines 470-494 vs 1096-1122
- **Description:** The footer and modal rendering code is duplicated for the tool panel view and the main view.
- **Severity:** Low
- **Fix:** Extract footer and modals into a shared component.

### L-05: Structured Data (JSON-LD) Uses Fake Rating
- **File:** `src/app/layout.tsx`, lines 97-101
- **Description:** The schema.org `aggregateRating` claims `ratingValue: "4.8"` and `ratingCount: "2450"` — these are hardcoded, not from real data. Google may penalize fake structured data.
- **Severity:** Low
- **Fix:** Remove the `aggregateRating` block until real review data exists, or use a review platform's embed.

### L-06: Google Site Verification is Placeholder
- **File:** `src/app/layout.tsx`, line 67
- **Description:** `google: "google-site-verification-code-here"` is a placeholder that should be replaced with the actual verification code or removed.
- **Severity:** Low
- **Fix:** Replace with actual verification meta tag or remove the `verification` block.

### L-07: `reactStrictMode: false` in next.config.ts
- **File:** `next.config.ts`, line 7
- **Description:** React Strict Mode is disabled. This skips helpful development warnings about deprecated patterns and side effects.
- **Severity:** Low
- **Fix:** Enable `reactStrictMode: true` and fix any resulting warnings.

---

## Observed Patterns (Informational)

### P-01: `MonthlyTemps` Parsing Pattern
Multiple files use `try { JSON.parse(str) } catch { return str }` to parse `monthlyTemps`. This is handled correctly with a fallback.

### P-02: Prisma Singleton Pattern
`src/lib/db.ts` correctly uses the global singleton pattern to prevent multiple Prisma instances in development.

### P-03: Consistent Error Response Format
Most routes use `{ success: false, error: '...' }` with proper HTTP status codes. Minor inconsistency: `export/route.ts` uses `{ error: '...' }` without `success` key on 400/500 responses (lines 20, 118).

### P-04: `type="button"` Correctly Used
Clear search button in the form correctly uses `type="button"` to prevent form submission.

### P-05: LiveClock Interval Cleanup
`src/components/visa/country-detail.tsx` properly clears the `setInterval` in the `useEffect` cleanup function (line 49).

### P-06: Compare Panel Outside Click Handler
`src/components/visa/compare-panel.tsx` properly adds/removes the `mousedown` event listener (lines 32-41).

---

## Priority Action Items

1. **Immediate (today):** Rotate the Turso auth token (C-01). Set a strong `BACKUP_SECRET` env var (C-03).
2. **This week:** Replace base64 admin auth with JWT (C-02). Add auth to profile/session endpoints (H-01).
3. **This sprint:** Implement distributed rate limiting (C-04). Add error boundaries (M-02). Extract duplicated utilities (L-01, L-02, L-03).
4. **Next sprint:** Add CSP header (M-09). Fix `ignoreBuildErrors` (M-10). Encrypt PII at rest (H-02).

---

*Report generated by automated audit. No files were modified.*