# frontend/dashboard/student-works

ย้ายมาใช้ API Route แล้วใน **Round 42**

- Component: `StudentWorksDashboard.tsx` — ใช้ `studentWorksApi` จาก `@/frontend/api/studentWorks`
- API Route: `src/app/api/admin/student-works/route.ts` — GET/POST/PATCH/DELETE
- App wrapper: `src/app/dashboard/student-works/page.tsx` (thin wrapper)
- ไม่มี `supabaseBrowserClient` ใน component นี้แล้ว
