"use client";
import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars.");
  return { url, key };
}

export function createBrowserSupabaseClient() {
  const { url, key } = getEnv();
  return createBrowserClient(url, key);
}

export function getBrowserSupabaseClient() {
  if (!_client) {
    const { url, key } = getEnv();
    _client = createBrowserClient(url, key);
  }
  return _client;
}

// backward compat export
export const supabaseBrowserClient = new Proxy(
  {} as ReturnType<typeof createBrowserClient>,
  {
    get(_target, prop) {
      return getBrowserSupabaseClient()[
        prop as keyof ReturnType<typeof createBrowserClient>
      ];
    },
  }
);
