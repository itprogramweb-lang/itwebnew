# Candidate Server Plan

## Planned Manual Platform

- Ubuntu `24.04 LTS`
- Docker
- Docker Compose
- Self-hosted Supabase stack
- Next.js application runtime
- Reverse proxy
- HTTPS termination
- Firewall
- Persistent data directories
- Backup jobs
- Logs and health checks
- Automatic restart behavior

## Network Principles

- Public application/API access should prefer HTTPS `443`.
- PostgreSQL `5432` must not be exposed publicly.
- Admin-only management access should be separated from public application ingress.

## Storage / Persistence Plan

- Separate persistent volumes for database data, Supabase state, and application uploads/cache where needed.
- Backup destination must include off-server storage.
- Candidate test data can be reset, but backup/restore procedure still needs to be proven.

## Deferred Items

Actual install commands, compose layouts, and exact version pinning are deferred until:

- Production inventory is captured
- PostgreSQL/Supabase compatibility is confirmed
- Extension and auth compatibility are known