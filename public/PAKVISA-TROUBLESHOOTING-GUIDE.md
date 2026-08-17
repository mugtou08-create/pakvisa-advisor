# PakVisa Advisor — Complete Troubleshooting & Fix Guide
## Prisma + Turso + Vercel: The "Catch-22" That Wasn't

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [The Problem](#2-the-problem)
3. [Our Tech Stack](#3-our-tech-stack)
4. [Every Error We Hit (Chronological)](#4-every-error-we-hit-chronological)
5. [The Root Cause — Finally Discovered](#5-the-root-cause--finally-discovered)
6. [The Complete Fix (Step by Step)](#6-the-complete-fix-step-by-step)
7. [Key Files Explained](#7-key-files-explained)
8. [Lessons Learned](#8-lessons-learned)
9. [How to Deploy This Project from Scratch](#9-how-to-deploy-this-project-from-scratch)
10. [Quick Reference for AI Agents](#10-quick-reference-for-ai-agents)

---

## 1. PROJECT OVERVIEW

**PakVisa Advisor** is a Next.js 16 web application that helps Pakistani passport holders check visa requirements for 70+ countries. It displays:

- Country cards with flags, visa types (Free, On Arrival, e-Visa, Embassy), fees, processing times, and safety ratings
- Search, filter by region/visa type, and sort functionality
- AI visa consultant chatbot
- Visa quiz questionnaire
- Country comparison tool
- Currency converter
- Cost profiles and travel budget estimates

**Live URL:** https://pakvisa-advisor.vercel.app/

**GitHub:** https://github.com/mugtou08-create/pakvisa-advisor

**Database:** Turso (a serverless SQLite-compatible database hosted in the cloud)

---

## 2. THE PROBLEM

After deploying to Vercel, the website loaded perfectly — the layout, header, footer, buttons, and text all appeared correctly. But **no country data was displayed**. The country grid was completely empty with only a "Retry" button.

Every single API route that touched the database returned **HTTP 500 (Internal Server Error)**:

```
GET /api/countries?limit=200     → 500
GET /api/countries/stats          → 500
GET /api/countries/[code]         → 500
```

The database connection simply was not working on Vercel's serverless platform.

---

## 3. OUR TECH STACK

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.3 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | v4 |
| UI Library | shadcn/ui | New York style |
| ORM | Prisma | 6.19.2 |
| Database (Cloud) | Turso | libsql |
| Database (Local) | SQLite | (via Prisma) |
| Adapter | @prisma/adapter-libsql | latest |
| Hosting | Vercel | Hobby plan |
| Package Manager | bun | latest |

### How the Database Connection Works (Conceptually)

```
┌─────────────┐     ┌──────────────────┐     ┌───────────┐
│  Next.js    │────▶│  Prisma Client   │────▶│  Database  │
│  API Route  │     │  (ORM)           │     │            │
└─────────────┘     └──────────────────┘     └───────────┘
                          │                        │
                          ▼                        ▼
                    In production:           In production:
                    Uses @prisma/           Turso (cloud)
                    adapter-libsql          libsql://...
                    
                    In development:
                    Direct SQLite           Local file:
                    connection               file:./dev.db
```

**The Prisma adapter** acts as a translator between Prisma's query engine and the Turso database. Prisma normally talks to SQLite files directly, but Turso is a remote cloud database. The adapter bridges this gap.

---

## 4. EVERY ERROR WE HIT (CHRONOLOGICAL)

This section documents every single error encountered, what we tried, and why it failed. This is the "journey" so you can understand how we arrived at the solution.

---

### ❌ Error 1: `URL_INVALID: The URL 'undefined' is not in a valid format`

**When:** First deployment to Vercel
**Why:** We forgot to set the `DATABASE_URL` environment variable in Vercel's dashboard. Prisma reads this at startup.

**Fix:** Added `DATABASE_URL` in Vercel → Settings → Environment Variables → set to the Turso connection URL `libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io`

**Result:** New error appeared (see Error 2)

---

### ❌ Error 2: `URL must start with file:` (after setting DATABASE_URL)

**When:** After adding the Turso URL as DATABASE_URL
**Full error:**
```
URL must start with file: Got: libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io
```

**Why:** This is the heart of the "Catch-22":
- Our `prisma/schema.prisma` file has `provider = "sqlite"` (required for Prisma v6)
- Prisma's internal engine validates DATABASE_URL against the provider
- `provider = "sqlite"` requires URLs starting with `file:`
- But our Turso URL starts with `libsql://`
- **These are incompatible**

**What we tried:**

#### Attempt 2a: Change provider to `"libsql"` in schema
```prisma
datasource db {
  provider = "libsql"  # Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```
**Result:** ❌ Build error — Prisma v6.19.2 does NOT support `provider = "libsql"`. That's a Prisma v7 feature only.

#### Attempt 2b: Embed auth token in DATABASE_URL
Changed DATABASE_URL to:
```
libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io?authToken=TOKEN_HERE
```
**Result:** ❌ Still got `URL must start with file:` because the validation happens BEFORE the adapter is used.

#### Attempt 2c: Override DATABASE_URL via `process.env`
```js
process.env.DATABASE_URL = 'file:./dummy.db';
const prisma = new PrismaClient({ adapter });
```
**Result:** ❌ On Vercel, `process.env` is **frozen/read-only**. You cannot modify environment variables at runtime on Vercel's serverless platform. This works locally but not in production.

#### Attempt 2d: Use `datasources` constructor override
```js
const prisma = new PrismaClient({
  adapter,
  datasources: { db: { url: 'file:./dummy.db' } }
});
```
**Result:** ❌ Prisma explicitly rejects this:
```
Custom datasource configuration is not compatible with Prisma Driver Adapters.
Please define the database connection string directly in the Driver Adapter configuration.
```
You CANNOT use both `adapter` and `datasources` together.

#### Attempt 2e: Use `datasourceUrl` parameter
```js
const prisma = new PrismaClient({
  adapter,
  datasourceUrl: 'file:./dummy.db'
});
```
**Result:** ❌ Same incompatibility error as Attempt 2d.

---

### ❌ Error 3: `URL_INVALID: The URL 'undefined'` (AGAIN, even after all the above)

**When:** After we thought we fixed it by using `instrumentation.ts`
**Full error:**
```
[LibsqlError]: URL_INVALID: The URL 'undefined' is not in a valid format
  at g.createClient (.next/server/chunks/[root-of-the-server]__2e9ec03e._.js:1:12919)
```

**Why:** This was the final piece of the puzzle. We were passing the WRONG type of argument to `PrismaLibSQL`. See Error 4 below.

---

### ❌ Error 4 (THE REAL ROOT CAUSE): Wrong API usage of PrismaLibSQL

**When:** Even after fixing the DATABASE_URL issue via `instrumentation.ts`
**What we were doing:**
```js
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

// ❌ WRONG — We created a libsql client first, then passed it to the adapter
const libsqlClient = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
const adapter = new PrismaLibSQL(libsqlClient);  // ← PASSING A CLIENT OBJECT
const prisma = new PrismaClient({ adapter });
```

**Why this fails:** After reading the actual source code of `@prisma/adapter-libsql/dist/index-node.mjs`, we discovered:

```js
// What PrismaLibSQL ACTUALLY exports:
export { PrismaLibSQLAdapterFactory as PrismaLibSQL };
```

`PrismaLibSQL` is NOT a direct adapter class. It is a **FACTORY** class. Its constructor expects a **config object** `{ url, authToken }`, NOT a pre-created libsql Client instance.

Internally, the factory's `connect()` method does:
```js
connect() {
  return Promise.resolve(
    new PrismaLibSQLAdapter(this.createClient(this.#config), this.#options)
  );
}

// And createClient is:
createClient(config) {
  return createClient(config);  // ← Calls @libsql/client's createClient
}
```

So when we passed a Client object as config:
1. Factory stored the Client object as `this.#config`
2. `connect()` called `createClient(clientObject)`
3. `@libsql/client`'s `createClient` looked for `clientObject.url` → **undefined**
4. Error: `URL_INVALID: The URL 'undefined'`

**The fix:** Pass the config object directly, let the factory create the client internally:
```js
// ✅ CORRECT — Pass config object, factory handles createClient internally
const adapter = new PrismaLibSQL({ url: TURSO_URL, authToken: TURSO_TOKEN });
const prisma = new PrismaClient({ adapter });
```

---

## 5. THE ROOT CAUSE — FINALLY DISCOVERED

After ~15 iterations of debugging over multiple sessions, the root cause was **two separate issues** that BOTH needed to be fixed:

### Issue A: Prisma's Internal Engine vs. Turso URL

Prisma's internal engine reads `DATABASE_URL` at startup to validate it against the schema's `provider` setting. With `provider = "sqlite"`, it requires a `file:` URL. But on Vercel, `DATABASE_URL` was set to a Turso `libsql://` URL.

**Fix:** Use Next.js `instrumentation.ts` to override `DATABASE_URL` before any modules load.

### Issue B: Wrong API Usage of PrismaLibSQL

The `PrismaLibSQL` export from `@prisma/adapter-libsql` is a **factory class**, not a direct adapter. Its documentation and examples in the wild often show the wrong usage pattern (passing a pre-created client). The correct usage is passing a `{ url, authToken }` config object.

**Fix:** Pass `{ url, authToken }` instead of a pre-created `createClient()` instance.

---

## 6. THE COMPLETE FIX (STEP BY STEP)

### File 1: `src/instrumentation.ts` (NEW FILE — CREATE THIS)

This is a Next.js special file. It runs at server startup **BEFORE any other modules are loaded**, including before Prisma is imported. This is crucial because it allows us to set `DATABASE_URL` before Prisma reads it.

```typescript
// src/instrumentation.ts
// Next.js Instrumentation - runs at server startup BEFORE any modules are loaded
// This sets a dummy DATABASE_URL so Prisma's internal schema validation passes.
// The actual Turso connection is handled by the PrismaLibSQL adapter in db.ts,
// which completely bypasses DATABASE_URL for real database operations.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Override DATABASE_URL with a dummy SQLite path for Prisma's validation.
    // Prisma schema has provider = "sqlite" which requires "file:" URLs,
    // but Vercel's DATABASE_URL points to a Turso libsql:// URL.
    // The adapter handles the real connection, so this is purely for validation.
    process.env.DATABASE_URL = 'file:./dummy.db';
  }
}
```

**Why this works on Vercel when `process.env.DATABASE_URL = ...` didn't work in other places:**
- In Next.js API routes, `process.env` is frozen by Vercel
- But in `instrumentation.ts`, which runs during the server initialization phase (before the freeze applies), we CAN modify `process.env`
- This is the earliest possible hook Next.js provides

### File 2: `src/lib/db.ts` (MODIFY EXISTING FILE)

This file creates and exports the Prisma client. The key changes are:
1. Pass `{ url, authToken }` config to `PrismaLibSQL` (not a pre-created client)
2. Add a safety net `process.env.DATABASE_URL` override in production

```typescript
// src/lib/db.ts
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

// Turso production credentials
const TURSO_URL = 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io';
const TURSO_TOKEN = 'your-turso-auth-token-here';

function createPrismaClient() {
  // Production: connect to Turso via Prisma adapter
  // PrismaLibSQL is a factory that expects a config object { url, authToken },
  // NOT a pre-created libsql client. It handles createClient internally.
  if (process.env.NODE_ENV === 'production') {
    // Safety net: ensure DATABASE_URL is a valid SQLite path for Prisma's
    // internal schema validation. The adapter handles the real Turso connection.
    process.env.DATABASE_URL = 'file:./dummy.db';

    // ✅ CORRECT: Pass config object to the factory
    const adapter = new PrismaLibSQL({ url: TURSO_URL, authToken: TURSO_TOKEN });
    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  }

  // Development: local SQLite
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
```

### File 3: `prisma/schema.prisma` (NO CHANGES NEEDED)

Keep it exactly as-is:
```prisma
datasource db {
  provider = "sqlite"   // ← MUST stay "sqlite" for Prisma v6
  url      = env("DATABASE_URL")
}
```

### Vercel Environment Variables

You still need `DATABASE_URL` set on Vercel (Prisma's build step reads it), but its value doesn't matter because `instrumentation.ts` overrides it. You can set it to anything, e.g., `file:./dummy.db`.

---

## 7. KEY FILES EXPLAINED

### Architecture Overview

```
src/
├── instrumentation.ts          ← FIX #1: Overrides DATABASE_URL at startup
├── lib/
│   └── db.ts                   ← FIX #2: Creates Prisma client with correct adapter usage
├── app/
│   ├── page.tsx                ← Main homepage (displays countries, search, filters)
│   └── api/
│       ├── countries/
│       │   ├── route.ts        ← GET /api/countries (list with search/filter/sort)
│       │   ├── [code]/
│       │   │   └── route.ts    ← GET /api/countries/:code (single country details)
│       │   └── stats/
│       │       └── route.ts    ← GET /api/countries/stats (summary statistics)
│       ├── chat/route.ts       ← AI visa consultant chatbot
│       ├── compare/route.ts   ← Country comparison tool
│       ├── session/route.ts    ← Quiz session management
│       ├── score/route.ts      ← Visa eligibility scoring
│       ├── currency/route.ts   ← Currency converter
│       ├── export/route.ts     ← Export data
│       ├── newsletter/route.ts ← Newsletter subscription
│       └── profile/route.ts    ← User profile management
prisma/
├── schema.prisma               ← Database schema (provider = "sqlite")
public/
├── flags/                      ← Country flag images
```

---

## 8. LESSONS LEARNED

### For Developers:

1. **Always read the actual source code** of npm packages when the documentation is unclear. The `@prisma/adapter-libsql` README shows passing a pre-created client, but the actual code exports a factory.

2. **Prisma v6 vs v7 is important.** Features like `provider = "libsql"` only exist in v7. Don't try to use v7 features with v6.

3. **Vercel's `process.env` is frozen** in API routes and serverless functions. You cannot modify it at runtime. Use `instrumentation.ts` for early overrides.

4. **`instrumentation.ts`** is the earliest hook in Next.js. It runs before any modules are imported. This is the ONLY reliable place to override environment variables on Vercel.

5. **Prisma adapters and `datasources` are incompatible.** You cannot use both. If you use an adapter, Prisma still reads DATABASE_URL internally for validation, but you can't override it via datasources.

6. **Test with debug endpoints early.** We wasted time guessing errors. Adding a temporary endpoint that returns `String(error)` would have revealed the `URL_INVALID: 'undefined'` error much sooner.

### For AI Coding Agents:

1. **When Prisma + Turso + Vercel fails with URL errors**, the solution is almost certainly:
   - Add `src/instrumentation.ts` to override DATABASE_URL to `file:./dummy.db`
   - In `db.ts`, use `new PrismaLibSQL({ url, authToken })` (config object, NOT a pre-created client)

2. **Don't try these — they WILL fail on Vercel:**
   - ❌ Changing `provider` to `"libsql"` in schema (Prisma v6 doesn't support it)
   - ❌ Using `datasources: { db: { url: ... } }` with adapters (incompatible)
   - ❌ Using `datasourceUrl: ...` with adapters (incompatible)
   - ❌ Setting `process.env.DATABASE_URL` inside API routes (Vercel freezes env)
   - ❌ Passing `createClient()` result to `new PrismaLibSQL()` (wrong API)

3. **The correct pattern is:**
   ```typescript
   // src/instrumentation.ts
   export async function register() {
     if (process.env.NEXT_RUNTIME === 'nodejs') {
       process.env.DATABASE_URL = 'file:./dummy.db';
     }
   }

   // src/lib/db.ts
   import { PrismaClient } from '@prisma/client';
   import { PrismaLibSQL } from '@prisma/adapter-libsql';

   const adapter = new PrismaLibSQL({ url: TURSO_URL, authToken: TURSO_TOKEN });
   const prisma = new PrismaClient({ adapter });
   ```

---

## 9. HOW TO DEPLOY THIS PROJECT FROM SCRATCH

### Step 1: Set Up Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Create a new database
turso db create pakvisa-db

# Get your database URL (looks like: libsql://pakvisa-db-xyz.region.turso.io)
turso db show pakvisa-db --url

# Create an auth token
turso db tokens create pakvisa-db

# Push your Prisma schema to Turso
turso db shell pakvisa-db < prisma/schema.sql
```

### Step 2: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/pakvisa-advisor.git
git push -u origin main
```

### Step 3: Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### Step 4: Set Environment Variables on Vercel

Go to your project → Settings → Environment Variables, and add:

| Name | Value | Environments |
|------|-------|-------------|
| `DATABASE_URL` | `file:./dummy.db` | Production, Preview |

> **Note:** The value `file:./dummy.db` is intentionally a dummy path. The real database connection is handled by the adapter code in `db.ts`. This variable only exists to satisfy Prisma's schema validation at startup.

**You do NOT need to set TURSO_URL or TURSO_AUTH_TOKEN as environment variables** because they are embedded in `db.ts`. However, for better security, you could move them to Vercel env vars and access them via `process.env`.

### Step 5: Deploy

Click "Deploy" or push to GitHub. Vercel will auto-build and deploy.

### Step 6: Verify

Visit your site and check:
1. The homepage loads without errors
2. Countries are displayed with flags and data
3. Search and filters work
4. API routes return 200 (not 500)

---

## 10. QUICK REFERENCE FOR AI AGENTS

### 🚨 If you see these errors on Vercel:

| Error | Solution |
|-------|----------|
| `URL 'undefined' is not in a valid format` | Fix `db.ts`: use `new PrismaLibSQL({ url, authToken })` not `new PrismaLibSQL(client)` |
| `URL must start with file:` | Add `src/instrumentation.ts` with `process.env.DATABASE_URL = 'file:./dummy.db'` |
| `Custom datasource configuration is not compatible with Prisma Driver Adapters` | Remove `datasources` option from PrismaClient constructor |
| `provider = "libsql"` build error | Revert to `provider = "sqlite"` in schema (Prisma v6 doesn't support libsql) |
| `process.env is frozen` | Move env override to `instrumentation.ts`, not inside API routes |

### ✅ The correct pattern (copy this):

**`src/instrumentation.ts`:**
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.env.DATABASE_URL = 'file:./dummy.db';
  }
}
```

**`src/lib/db.ts`:**
```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({ url: TURSO_URL, authToken: TURSO_TOKEN });
export const db = new PrismaClient({ adapter });
```

### 📦 Required packages:

```json
{
  "@prisma/adapter-libsql": "latest",
  "@libsql/client": "latest",
  "@prisma/client": "^6.0.0"
}
```

### ⚠️ Common mistakes:

1. **Passing a pre-created client to PrismaLibSQL** — The library exports a FACTORY, not a direct adapter
2. **Trying to use `provider = "libsql"` in Prisma v6** — Only works in v7
3. **Setting env vars inside API routes on Vercel** — Vercel freezes process.env
4. **Using `datasources` with adapters** — They are mutually exclusive

---

## APPENDIX: Git Commit History (Reference)

```
0fa0787 Fix: pass config object to PrismaLibSQL factory instead of pre-created client  ← FINAL FIX
806d7d5 Fix: use instrumentation.ts to override DATABASE_URL for Prisma validation on Vercel
0d69d39 Debug: expose error details in API response temporarily
a3eb4b7 Clean db.ts: adapter for production, local SQLite for dev
6e24de4 Fix: use datasources constructor override (process.env is frozen on Vercel)  ← FAILED
f49ffb9 Fix: use adapter with dummy DATABASE_URL for Prisma schema validation
83343bd Fix: change Prisma provider from sqlite to libsql  ← FAILED (v6 doesn't support)
edefe06 Remove adapter, use Prisma native libsql with embedded token
f0c0c70 Fix: embed auth token in DATABASE_URL so Prisma internal validation passes
52d00f3 Add comprehensive debug: test raw libsql, prisma adapter, and db import
608dbcd Fix: use fallback token when TURSO_AUTH_TOKEN env var missing
be88676 Add debug-db endpoint for Turso connectivity test
```

---

*Document created: August 17, 2026*
*Last verified: Commit 0fa0787 — All API routes returning 200 OK*
*Author: AI Coding Agent (Z.ai Code)*
