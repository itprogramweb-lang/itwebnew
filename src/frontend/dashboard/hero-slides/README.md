# frontend/dashboard/hero-slides

ย้ายมาใช้ API Route แล้วใน **Round 42**

- Component: `HeroSlidesDashboard.tsx` — ใช้ `heroSlidesApi` จาก `@/frontend/api/heroSlides`
- API Route: `src/app/api/admin/hero-slides/route.ts` — GET/POST/PATCH/DELETE
- App wrapper: `src/app/dashboard/hero-slides/page.tsx` (thin wrapper)
- ไม่มี `supabaseBrowserClient` ใน component นี้แล้ว
