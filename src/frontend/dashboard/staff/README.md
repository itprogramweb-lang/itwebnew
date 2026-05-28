# frontend/dashboard/staff

ย้ายมาใช้ API Route แล้วใน **Round 42**

- Component: `StaffDashboard.tsx` — ใช้ `staffApi` จาก `@/frontend/api/staff`
- API Route: `src/app/api/admin/staff/route.ts` — GET/POST/PATCH/DELETE
- App wrapper: `src/app/dashboard/staff/page.tsx` (thin wrapper)
- ไม่มี `supabaseBrowserClient` ใน component นี้แล้ว
