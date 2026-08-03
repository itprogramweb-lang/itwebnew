# Current Production Architecture

## Confirmed From Repository

- Next.js `14.2.5` with App Router.
- Important server-side logic exists in route handlers under `src/app/api/...`.
- Supabase clients exist in four patterns:
  - Browser client: `src/lib/supabase/client.ts`
  - SSR/server client: `src/lib/supabase/server.ts`
  - Middleware auth client: `middleware.ts`
  - Service-role/admin client: `src/lib/supabaseAdmin.ts`
- Middleware protects `/dashboard` routes by checking the authenticated Supabase user.
- Server-side auth and permission resolution rely on `profiles` and service-role access.

## Confirmed Service Integrations

- LINE Messaging / webhook / LINE Login linking are implemented in Next.js server code.
- Gemini is called server-side for LINE-assisted news drafting.
- Brevo HTTP API is called server-side for transactional email.
- Cloudinary uploads are server-side.
- Cloudflare R2 uploads are server-side.

## Confirmed Database Relationship Themes

- `profiles.id` is treated as the same UUID as `auth.users.id`.
- UUID preservation is critical for auth, permissions, LINE linking, complaints, and news relationships.
- Service-role usage is significant, especially for admin routes, permission overrides, LINE linking, and complaint notification resolution.

## Confirmed Non-Usage

- Supabase Storage: not found in repository.
- Supabase Realtime: not found in repository.
- Supabase Edge Functions: not found in repository.
- Scheduled jobs / Vercel Cron: not found in repository.