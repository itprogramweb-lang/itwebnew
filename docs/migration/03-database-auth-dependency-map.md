# Database / Auth Dependency Map

## Confirmed Core Identity Relationship

- `auth.users.id` <-> `public.profiles.id`
  - Repository evidence: auth/profile resolution code and admin/user routes
  - Migration requirement: UUID preservation required
  - Risk if broken: logins succeed but profile/role/permission mapping breaks

## Confirmed UUID-Linked Tables

- `staff_members.user_id`
  - Assumption: staff member may resolve directly to a user/profile
  - UUID preservation: required where populated
- `user_permission_overrides.user_id`
  - Assumption: per-user permission allow/deny overlay
  - UUID preservation: required
- `user_permission_audit_logs`
  - Confirmed by code as an audit sink for permission override changes
  - UUID preservation: likely required for actor/target references used by operators and audits
- `user_line_connections.user_id`
  - Assumption: one application user linked to one LINE account state row
  - UUID preservation: required
- `line_oauth_states.user_id`
  - Assumption: pending LINE OAuth state belongs to one application user
  - UUID preservation: required
- `line_news_drafts.user_id`
  - Assumption: draft ownership belongs to one application user
  - UUID preservation: required
- `line_news_drafts.published_news_id`
  - Assumption: published draft points to one `news.id`
  - UUID preservation: required for referential continuity
- `line_ai_usage_logs.user_id`
  - Assumption: AI usage limit and audit are per user
  - UUID preservation: required

## Confirmed Complaint/User Resolution Paths

- Complaint notification flow resolves department-head recipients through `staff_members.user_id`, or by matching `staff_members.email` to `profiles.email` if `user_id` is absent.
- Complaint LINE notifications resolve `user_line_connections.user_id`.
- Super Admin complaint notifications resolve active `profiles` with role `super_admin`.

UUID preservation impact:

- Required for staff-linked complaint routing
- Required for LINE notification routing
- Required for permission-aware complaint access

## Confirmed News/User Resolution Paths

- LINE news publishing uses `line_news_drafts.user_id`, `line_news_drafts.line_user_id`, and `line_news_drafts.published_news_id`.
- News create/update flows depend on current permission resolution and existing user context.

## Unknown / Must Verify

- `learning_facilities`
  - Repository code references the table.
  - Repository migration/schema definition was not confirmed in ROUND 1.
  - Status: `UNKNOWN SCHEMA — MUST VERIFY PRODUCTION`

## Operational Rule

Where any confirmed user-linked UUID is reused across auth, profile, permissions, staff, LINE, complaints, or news flows, UUID preservation is mandatory for migration safety.