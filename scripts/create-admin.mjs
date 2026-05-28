import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadDotEnvLocal();

const {
  NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_FULL_NAME,
} = process.env;

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL", NEXT_PUBLIC_SUPABASE_URL);
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
const email = requireEnv("ADMIN_EMAIL", ADMIN_EMAIL).trim().toLowerCase();
const password = requireEnv("ADMIN_PASSWORD", ADMIN_PASSWORD);
const fullName = (ADMIN_FULL_NAME || "Super Admin").trim();

if (password.length < 8) {
  throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  realtime: {
    transport: WebSocket,
  },
});

async function findUserByEmail(targetEmail) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (error) throw error;
  return data.users.find((user) => user.email?.toLowerCase() === targetEmail);
}

let authUser = await findUserByEmail(email);
let userStatus = "created";

if (!authUser) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "super_admin" },
  });
  if (error) throw error;
  authUser = data.user;
} else {
  userStatus = "already exists; auth metadata updated";
  const { data, error } = await supabase.auth.admin.updateUserById(authUser.id, {
    password,
    app_metadata: { role: "super_admin" },
  });
  if (error) throw error;
  authUser = data.user;
}

const { error: profileError } = await supabase.from("profiles").upsert(
  {
    id: authUser.id,
    email,
    full_name: fullName,
    role: "super_admin",
    is_active: true,
    status: "active",
  },
  { onConflict: "id" }
);

if (profileError) {
  if (
    profileError.message.includes("profiles") ||
    profileError.message.includes("role") ||
    profileError.message.includes("is_active")
  ) {
    throw new Error(
      `${profileError.message}\nRun supabase/round23_auth_roles.sql in Supabase SQL Editor, then run npm run create-admin again.`
    );
  }
  throw profileError;
}

console.log(`Super Admin ready: ${email}`);
console.log(`Auth user: ${userStatus}`);
console.log("Profile ensured: super_admin, active");
