# Secret Handling

## Rules

- Never commit `.env` files.
- Never commit database dumps or backup artifacts.
- Never send Production keys to Codex.
- Never put a Supabase service-role key in browser/client code.
- Backup files may contain sensitive authentication information.

## Existing Security Finding From ROUND 1

- A repository script contained hard-coded password values.
- Those values are not repeated in this round.
- That script is not modified in this round.

## Required Human Review

- If the hard-coded passwords still map to valid accounts, rotate them.
- If they are obsolete test credentials, remove them later through a separate controlled cleanup change.
- Any Git-history cleanup decision must be handled separately from this migration toolkit round.