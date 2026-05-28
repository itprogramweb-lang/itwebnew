import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { isProfileActive, profileToUser } from "@/lib/roles";

export async function getCurrentUser() {
  const supabase = createBrowserSupabaseClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const authUser = sessionData.session?.user;
  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,is_active,status,created_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (!profile || !isProfileActive(profile)) {
    await supabase.auth.signOut();
    return null;
  }

  return profileToUser({
    ...profile,
    email: profile.email ?? authUser.email ?? "",
  });
}
