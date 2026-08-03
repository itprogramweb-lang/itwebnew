# Environment Separation Matrix

| Variable Name | Production Purpose | Candidate Purpose | Must Differ? | Side-Effect Risk | Operator Action |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/SSR/middleware/admin Supabase endpoint | Candidate self-hosted Supabase endpoint | YES | Candidate may point at Production auth/data | Set to Candidate URL only |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/SSR/middleware anon access | Candidate anon access | YES | Candidate browser/session traffic may hit Production | Generate Candidate key only |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin access | Candidate admin access | YES | Full write/admin access to wrong database | Never reuse Production key |
| `NEXT_PUBLIC_SITE_URL` | Public absolute URL generation | Candidate public URL generation | YES | Wrong callbacks, links, reset URLs | Set to Candidate domain |
| `SITE_URL` | Server-side canonical URL fallback | Candidate canonical URL fallback | YES | Wrong email/link targets | Set to Candidate domain |
| `APP_URL` | Alternate canonical URL fallback | Candidate canonical URL fallback | YES | Wrong redirects and callbacks | Set to Candidate domain |
| `LINE_LOGIN_CHANNEL_ID` | LINE Login app identity | Candidate LINE Login identity | YES or keep disabled | Candidate may bind to Production LINE login | Prefer separate Candidate LINE channel |
| `LINE_LOGIN_CHANNEL_SECRET` | LINE Login secret | Candidate LINE Login secret | YES or keep disabled | Candidate may exchange Production LINE OAuth codes | Prefer separate Candidate secret |
| `LINE_LOGIN_CALLBACK_URL` | Production LINE callback target | Candidate callback target | YES | OAuth returns to wrong system | Point to Candidate domain only |
| `LINE_MESSAGING_CHANNEL_SECRET` | Verify LINE webhook signatures | Candidate webhook verification | YES or keep disabled | Candidate may accept Production webhook if switched | Keep Production webhook untouched |
| `LINE_MESSAGING_CHANNEL_ACCESS_TOKEN` | Reply/push on Production LINE OA | Candidate LINE outbound token | YES or keep disabled | Candidate may send real LINE messages | Use isolated Candidate OA or disable |
| `NEXT_PUBLIC_LINE_ADD_FRIEND_URL` | User-facing add-friend URL | Candidate test add-friend URL | YES | Users may join wrong OA | Use Candidate OA URL only |
| `GEMINI_API_KEY` | Server-side Gemini access | Candidate Gemini access | SHOULD DIFFER | Shared quota/logging and harder blast-radius control | Use isolated Candidate credential if possible |
| `GEMINI_MODEL_TEXT` | Production model choice | Candidate model choice | SHOULD DIFFER | Candidate may consume wrong quota/profile | Review separately |
| `AI_NEWS_ENABLED` | Enable AI drafting flow | Candidate AI enable/disable | MAY DIFFER | Candidate may trigger outbound AI unexpectedly | Disable until test window if needed |
| `AI_NEWS_DAILY_LIMIT_PER_USER` | Per-user AI throttling | Candidate test throttling | MAY DIFFER | Test behavior divergence if mis-set | Document intentional difference |
| `BREVO_API_KEY` | Transactional email API access | Candidate email API access | YES or keep disabled | Candidate may send real Production emails | Use isolated sender/project or disable |
| `BREVO_SENDER_EMAIL` | Production sender identity | Candidate sender identity | YES | Candidate email may appear production-authentic | Use non-production sender |
| `BREVO_SENDER_NAME` | Production sender display name | Candidate sender display name | SHOULD DIFFER | Confusing operator/user signals | Mark Candidate clearly |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Asset read/upload namespace | Candidate asset namespace or read-only reference | SHOULD DIFFER for writes | Candidate may write into Production asset namespace | Separate cloud/folder or disable writes |
| `CLOUDINARY_API_KEY` | Server-side upload credential | Candidate upload credential | YES or isolated write path | Candidate may write/delete Production assets | Never reuse unrestricted Production write key |
| `CLOUDINARY_API_SECRET` | Server-side upload signing secret | Candidate upload secret | YES or isolated write path | Candidate may write/delete Production assets | Isolate before testing uploads |
| `CLOUDINARY_FOLDER` | Upload target folder | Candidate upload folder | YES | Candidate may contaminate Production folders | Use Candidate-only path |
| `R2_BUCKET_NAME` | Production object bucket | Candidate bucket | YES or keep write disabled | Candidate may write Production objects | Use separate bucket/prefix |
| `R2_ENDPOINT` | Production R2 endpoint | Candidate endpoint | YES if isolated | Candidate may target Production storage | Point to isolated Candidate bucket/account |
| `R2_ACCESS_KEY_ID` | Production R2 write credential | Candidate R2 credential | YES | Candidate may write/delete Production files | Use isolated credential |
| `R2_SECRET_ACCESS_KEY` | Production R2 secret | Candidate R2 secret | YES | Candidate may write/delete Production files | Use isolated credential |
| `NEXT_PUBLIC_STUDENT_WORKS_STORAGE_BASE_URL` | Public file URL base | Candidate read URL base | MAY DIFFER | Candidate may display Production files intentionally | Keep read-only behavior explicit |

## Critical Rule

Candidate must not reuse Production configuration for any environment variable that can:

- write to a database
- send LINE messages
- receive Production LINE callbacks
- send email
- upload/delete Cloudinary assets
- upload/delete R2 objects

If safe isolated credentials are not available, the related Candidate feature should remain disabled until a human approves a controlled test plan.