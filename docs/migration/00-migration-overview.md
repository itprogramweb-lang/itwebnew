# Migration Overview

## Scope

- Production System #1 stays live and unchanged.
- Candidate System #2 is built separately on the department Ubuntu server.
- The first database transfer is a copy for testing, not a cutover.
- Candidate test data is disposable.
- Candidate is not a real-time replica of Production.
- Final cutover will use a new final Production dump created after writes are frozen.
- The current Supabase Cloud system remains available temporarily for rollback.
- Cloudinary and Cloudflare R2 storage migration are later phases, not part of the first database/auth migration.

## High-Level Phase Diagram

```text
Phase 0: Production unchanged

Real users
    ->
it.rmutt.ac.th
    ->
Current deployment
    ->
Supabase Cloud

Phase 1: Candidate build

Temporary candidate domain
    ->
Ubuntu server
    ->
Next.js Candidate
    ->
Self-hosted Supabase

Phase 2: First copy for testing

Production inventory
    ->
Human-operated dump/backup
    ->
Secure storage outside Git
    ->
Restore into Candidate
    ->
Verification
    ->
Candidate testing

Phase 3: Final cutover later

Freeze Production writes
    ->
Fresh final dump
    ->
Reset Candidate test data
    ->
Restore final dump
    ->
Verify
    ->
Switch domains/env/webhooks
    ->
Enable writes on Candidate
```

## Non-Goals

- No direct migration is performed in this repository round.
- No Production system is contacted.
- No Production secrets are stored in Git.
- No storage bucket/object migration is performed.