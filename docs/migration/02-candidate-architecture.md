# Candidate Architecture

## Target Topology

```text
[CANDIDATE_DOMAIN]
    ->
Ubuntu server
    ->
Next.js Candidate runtime
    ->
Self-hosted Supabase PostgreSQL/Auth/API
```

## External Services That Remain External

- LINE platform
- Gemini API
- Brevo API
- Cloudinary
- Cloudflare R2

## Confirmed Runtime Implications

If Next.js Candidate runs on Ubuntu, outbound calls will originate from the Ubuntu-hosted Next.js runtime for:

- LINE webhook replies and LINE Login token/profile exchange
- Gemini requests
- Brevo HTTP email requests
- Cloudinary uploads
- Cloudflare R2 uploads

## Internet Session Risk

- Candidate development status: `CANDIDATE ACCEPTABLE`
- Final production cutover status: `PRODUCTION NO-GO`

Reason:

- Repository-confirmed integrations require outbound internet access from the server runtime.
- The current institutional login/session expiry on the Ubuntu server is acceptable for disposable Candidate testing.
- It is not acceptable for final Production because webhook handling, login linking, Gemini, email, and uploads would be unreliable after session expiry.

## Boundary Rule

- Candidate must never share active Production-side-effect configuration by accident.
- Candidate must use isolated environment variables, isolated callback URLs, and isolated operator procedures before any live testing with external services.