# First Copy Migration Plan

## Rule

First copy is not cutover.

## Sequence

```text
Production Supabase Cloud
    ->
Read-only inventory
    ->
Human-operated backup/dump
    ->
Secure storage outside Git
    ->
Restore into Candidate
    ->
Verification
    ->
Candidate testing
```

## Requirements

- Production remains authoritative.
- Candidate receives a snapshot copy only.
- Candidate test data is disposable.
- No Production domain/webhook switch occurs in this phase.

## Placeholder Command Style

Use placeholders only in future operator commands, for example:

- `[PRODUCTION_DB_URL]`
- `[CANDIDATE_DB_URL]`
- `[CANDIDATE_HOST]`
- `[CANDIDATE_DOMAIN]`
- `[SUPABASE_PROJECT_REF]`

No real credentials or secrets belong in repository documentation.