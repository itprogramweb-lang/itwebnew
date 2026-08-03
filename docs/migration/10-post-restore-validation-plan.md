# Post-Restore Validation Plan

## Acceptance Checks

- Auth user count matches expected aggregate
- Profile coverage matches expected aggregate
- `auth.users.id` and `profiles.id` UUID preservation verified
- Existing account/password login works on Candidate
- Old sessions do not need to survive
- Role assignments behave as before
- Permission overrides behave as before
- Super Admin access works
- Website Admin access works
- Staff access works
- Department-head complaint access works
- `manage_news` resolution works
- LINE account mappings survive
- Complaint records and complaint notifications remain structurally valid
- News records and ownership relationships remain valid
- Functions, triggers, RLS, and policies match expected state
- Password reset flow works with Candidate URLs
- External integrations are tested only after isolation is confirmed

## Validation Inputs

- `database/migration-audit/post_restore_verification.sql`
- application smoke tests by human operator
- controlled login tests with approved accounts