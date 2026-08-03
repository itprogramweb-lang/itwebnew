# Final Cutover Plan

## Future Sequence Only

1. Candidate is proven stable
2. Ubuntu internet-session issue is permanently fixed
3. Off-server backup is available
4. Rollback process is tested
5. Maintenance mode is enabled
6. Production writes are frozen
7. Final Production inventory is captured
8. A new final Production dump is created
9. Candidate test data is safely reset
10. Final dump is restored into Candidate
11. Post-restore verification is completed
12. Smoke test runs while writes remain frozen
13. Production URL / environment / webhook switch is performed
14. Writes are enabled on Candidate
15. Monitoring is watched closely
16. Supabase Cloud remains available temporarily for rollback

## Explicit Non-Action

This document is planning only. No cutover action is performed in this repository round.