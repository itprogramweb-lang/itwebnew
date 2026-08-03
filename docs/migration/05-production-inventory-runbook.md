# Production Inventory Runbook

## Purpose

This runbook tells a human operator how to gather read-only Production facts safely without giving Codex database access.

## Preferred SQL Editor Workflow

Run one file at a time in Supabase SQL Editor.

Recommended order:

1. `database/migration-audit/inventory-parts/01-version-database.sql`
2. `database/migration-audit/inventory-parts/02-schemas-extensions.sql`
3. `database/migration-audit/inventory-parts/03-public-tables.sql`
4. `database/migration-audit/inventory-parts/04-auth-tables.sql`
5. `database/migration-audit/inventory-parts/05-table-counts.sql`
6. `database/migration-audit/inventory-parts/06-table-sizes.sql`
7. `database/migration-audit/inventory-parts/07-rls-status.sql`
8. `database/migration-audit/inventory-parts/08-rls-policies.sql`
9. `database/migration-audit/inventory-parts/09-functions.sql`
10. `database/migration-audit/inventory-parts/10-triggers.sql`
11. `database/migration-audit/inventory-parts/11-foreign-keys.sql`
12. `database/migration-audit/inventory-parts/12-indexes.sql`
13. `database/migration-audit/inventory-parts/13-auth-counts.sql`
14. `database/migration-audit/inventory-parts/14-learning-facilities.sql`
15. `database/migration-audit/inventory-parts/15-auth-schema-version.sql`
16. `database/migration-audit/production_integrity_check.sql`

## Files To Use

Preferred for Supabase SQL Editor:

- `database/migration-audit/inventory-parts/*.sql`
- `database/migration-audit/production_integrity_check.sql`

Still available if a multi-result script is acceptable:

- `database/migration-audit/production_inventory.sql`

## Operator Procedure

1. Open one SQL file.
2. Run it in a read-only Production session.
3. Copy or export that single result set.
4. Label the captured result with the file name.
5. Repeat with the next file.
6. Review the output before sharing it.
7. Redact any accidental personal or secret data before sharing anything outside the operator boundary.

## Safe Output That May Be Shared

- PostgreSQL version
- database size totals
- schema names
- extension names
- table names
- table row counts
- table sizes
- RLS enabled/disabled state
- policy names
- function names
- trigger names
- foreign key metadata
- aggregate integrity counts
- auth schema migration versions
- auth column names and data types

## Output That Must Be Redacted Or Never Shared

- individual emails
- UUID values
- `encrypted_password`
- auth identity provider tokens
- access tokens
- refresh tokens
- recovery tokens
- provider tokens
- API keys
- connection passwords
- personal complaint contents
- complaint attachments

## Hard Rule

If a query result includes user-level rows instead of aggregate counts, stop and do not share it. Review the SQL file and rerun only after confirming the result is structural or aggregate-only.