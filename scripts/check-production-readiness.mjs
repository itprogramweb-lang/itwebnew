// @ts-check
import { readFileSync } from "fs";
import { resolve } from "path";

// load .env.local
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const lines = readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const [key, ...vals] = line.split("=");
      if (key && !key.startsWith("#")) {
        const val = vals.join("=").trim();
        process.env[key.trim()] = val;
      }
    }
  } catch {
    /* no .env.local */
  }
}

loadEnv();

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

console.log("=== Production Readiness Check ===\n");

let allGood = true;

console.log("ENV Variables:");
for (const key of REQUIRED_ENV) {
  const val = process.env[key];
  if (val) {
    const preview = key.startsWith("NEXT_PUBLIC_")
      ? val.slice(0, 30) + "..."
      : "***hidden***";
    console.log(`  OK ${key}: ${preview}`);
  } else {
    console.log(`  MISSING ${key}`);
    allGood = false;
  }
}

console.log("");
if (allGood) {
  console.log("All required env vars are present");
} else {
  console.log("Some env vars are missing — fix before deploying");
}

// Try to check Supabase connectivity (read-only, no realtime)
if (
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.log("\nChecking Supabase connectivity...");
  try {
    const { createClient } = await import("@supabase/supabase-js");
    // Use ws package for Node.js 20 WebSocket compatibility
    const ws = (await import("ws")).default;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        realtime: { transport: ws },
      }
    );
    const { data, error } = await supabase
      .from("profiles")
      .select("id,role,is_active")
      .eq("role", "super_admin")
      .limit(5);
    if (error) {
      console.log(`  Supabase query failed: ${error.message}`);
    } else {
      console.log(
        `  Supabase connected — ${data?.length ?? 0} super_admin(s) found`
      );
      if (!data?.length)
        console.log("  No super_admin found — run create-admin script");
    }
  } catch (e) {
    console.log(`  Supabase check failed: ${e.message}`);
  }
}

console.log("\n=== Done ===");
