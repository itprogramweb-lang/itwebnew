# External Services Isolation Plan

## Gemini

- Confirmed runtime: server-side Next.js code
- Candidate outbound dependency: Ubuntu -> HTTPS -> Gemini API
- Side-effect risk: quota/cost/logging rather than direct end-user mutation
- Safe Candidate strategy: separate Candidate credential if possible, or disable until a controlled test window
- May be shared: aggregate failure rates, model name choice
- Must not be shared: API keys, raw sensitive prompts if they contain user data

## Brevo

- Confirmed runtime: server-side Next.js code using HTTP API
- Candidate outbound dependency: Ubuntu -> HTTPS -> Brevo API
- Side-effect risk: real email delivery to real recipients
- Safe Candidate strategy: isolated Candidate sender/project or keep disabled
- May be shared: sender name policy, aggregate delivery results
- Must not be shared: API keys, recipient personal data

## Cloudinary

- Confirmed runtime: server-side uploads
- Candidate outbound dependency: Ubuntu -> HTTPS -> Cloudinary
- Side-effect risk: Candidate writes/deletes Production assets or mixes folders
- Safe Candidate strategy: separate cloud/folder/credential or disable writes
- May be shared: folder naming policy, public URL behavior
- Must not be shared: API secrets, admin credentials

## Cloudflare R2

- Confirmed runtime: server-side uploads
- Candidate outbound dependency: Ubuntu -> HTTPS -> R2 S3-compatible endpoint
- Side-effect risk: Candidate writes/deletes Production files
- Safe Candidate strategy: separate bucket/prefix/credential or disable writes
- May be shared: bucket isolation policy, public URL base pattern
- Must not be shared: access keys, secret keys

## Read-Only Asset Rule

Existing public Cloudinary and R2 URLs may remain readable during early Candidate phases, but Candidate write paths must not reuse Production write credentials without explicit isolation.