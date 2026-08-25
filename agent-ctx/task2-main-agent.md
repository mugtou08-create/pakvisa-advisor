# Task 2: Integrate Hero Images + Admin Management

## Agent: Main Agent

## Files Changed
1. **`prisma/schema.prisma`** — Added `heroImageEnabled Boolean @default(false)` to Country model
2. **`src/app/[slug]/page.tsx`** — Added hero image banner after breadcrumb, before Hero Section
3. **`src/app/api/admin/hero-images/route.ts`** — NEW: GET/PUT/DELETE admin API route
4. **`src/components/app/admin-dialog.tsx`** — Added 'hero-images' to AdminSection type, nav item, and HeroImagesSection component
5. **`worklog.md`** — Appended task 2 work log

## Key Decisions
- Used standard `<img>` tag (not next/image) for zero-config Vercel compatibility
- Country `code` field contains name-like values (UAE, SaudiArabia, etc.), not ISO codes
- Hardcoded 15 slug-code pairs in the API route (duplicated from page.tsx) to avoid cross-module import issues
- HeroImagesSection is self-contained (own state + fetch) — no changes to main useEffect data fetching
- `heroImageEnabled` checked server-side in the page component (server component)
- Used `fs.existsSync` for file presence check in the API route
- ESLint passes clean
