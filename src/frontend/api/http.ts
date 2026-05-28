import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("กรุณาเข้าสู่ระบบใหม่");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getAuthToken(): Promise<string | null> {
  const supabase = createBrowserSupabaseClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
