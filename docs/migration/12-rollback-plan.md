# Rollback Plan

## Rollback Before New Production Writes On Candidate

This is the simpler rollback case.

- If cutover fails before users create new data on Candidate, traffic can be pointed back to the old Production system more safely.
- Candidate can be discarded or rebuilt from a fresh dump.

## Rollback After New Production Writes On Candidate

This is the harder rollback case.

- Once Candidate accepts new authoritative writes, Supabase Cloud is no longer a live replica.
- Rolling back would require an explicit data reconciliation strategy.
- A simple domain switch back to the old system may lose new data or create split-brain risk.

## Operational Meaning

Rollback becomes materially more difficult after Candidate accepts new Production writes. That is why validation, freeze discipline, and smoke testing before enabling writes are mandatory.