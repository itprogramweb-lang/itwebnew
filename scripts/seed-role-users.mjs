import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const accounts = [
  {
    role: "super_admin",
    email: "superadmin@it.rmutt.ac.th",
    password: "TempSuperAdmin@2026",
    fullName: "Super Admin",
  },
  {
    role: "website_admin",
    email: "admin@it.rmutt.ac.th",
    password: "TempWebsiteAdmin@2026",
    fullName: "Website Admin",
  },
  {
    role: "teacher",
    email: "teacher@it.rmutt.ac.th",
    password: "TempTeacher@2026",
    fullName: "Teacher Account",
  },
  {
    role: "staff",
    email: "staff@it.rmutt.ac.th",
    password: "TempStaff@2026",
    fullName: "Staff Account",
  },
  {
    role: "student",
    email: "student@it.rmutt.ac.th",
    password: "TempStudent@2026",
    fullName: "Student Account",
  },
];

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

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function explainProfileError(error) {
  if (!error) return;
  const message = error.message || "";
  if (
    message.includes("profiles") ||
    message.includes("role") ||
    message.includes("is_active") ||
    message.includes("status") ||
    message.includes("schema cache")
  ) {
    throw new Error(
      `${message}\nRun supabase/round23_auth_roles.sql in Supabase SQL Editor, then run npm run seed-role-users again.`
    );
  }
  throw error;
}

loadDotEnvLocal();

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

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
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find(
      (user) => user.email?.toLowerCase() === targetEmail.toLowerCase()
    );
    if (found) return found;
    if (data.users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAccount(account) {
  const existing = await findUserByEmail(account.email);
  let authUser = existing;
  let action = "created";

  if (existing) {
    action = "password reset";
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: account.password,
      email_confirm: true,
      app_metadata: { role: account.role },
    });
    if (error) throw error;
    authUser = data.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      app_metadata: { role: account.role },
    });
    if (error) throw error;
    authUser = data.user;
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: authUser.id,
      email: account.email,
      full_name: account.fullName,
      role: account.role,
      is_active: true,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  explainProfileError(profileError);

  return { ...account, action };
}

const results = [];
for (const account of accounts) {
  results.push(await ensureAccount(account));
}

const outputPath = resolve(process.cwd(), ".admin-accounts.local.txt");
const output = [
  "RMUTT IT Admin Test Accounts",
  "Do not commit this file.",
  "Temporary passwords should be changed after first login.",
  "",
  "Role | Email | Temporary Password | Note",
  ...results.map(
    (item) =>
      `${item.role} | ${item.email} | ${item.password} | ${item.action}; profile upserted active`
  ),
  "",
].join("\n");

writeFileSync(outputPath, output, "utf8");

console.log("Role users created/reset successfully.");
console.log("Profiles upserted successfully.");
for (const item of results) {
  console.log(`${item.role}: ${item.email} / ${item.password} (${item.action})`);
}
console.log(".admin-accounts.local.txt created. Do not commit this file.");
