# frontend/dashboard/theme

ย้ายมาใช้ API Route แล้วใน **Round 42**

- Component: `ThemeDashboard.tsx` — ใช้ `themeApi` จาก `@/frontend/api/theme`
- API Route: `src/app/api/admin/theme/route.ts` — GET/PATCH (site_settings: id, theme, design_tokens เท่านั้น)
- App wrapper: `src/app/dashboard/theme/page.tsx` (thin wrapper)
- ลบ `settingsId` state ออกแล้ว — server จัดการ find-or-create เอง
- ไม่มี `supabaseBrowserClient` ใน component นี้แล้ว
