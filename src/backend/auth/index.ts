/**
 * Backend auth helpers — thin wrappers around src/lib/serverAuth.ts
 * Round 41A: stub only, not wired into routes yet
 * API routes still call serverAuth directly to avoid behavior change
 */

export { getAuthenticatedProfile } from "@/lib/serverAuth";
