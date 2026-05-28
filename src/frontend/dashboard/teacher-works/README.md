# frontend/dashboard/teacher-works

ย้ายมาใช้ API Route แล้วใน **Round 42**

- Component: `TeacherWorksDashboard.tsx` — ใช้ `teacherWorksApi` จาก `@/frontend/api/teacherWorks`
- API Route: `src/app/api/admin/teacher-works/route.ts` — GET/POST/PATCH/DELETE (ordered by is_featured DESC)
- App wrapper: `src/app/dashboard/teacher-works/page.tsx` (thin wrapper)
- ไม่มี `supabaseBrowserClient` ใน component นี้แล้ว
