import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type { LineProfile } from "@/lib/line/oauth";

export type LineConnectionRow = {
  id: string;
  user_id: string;
  line_display_name: string | null;
  line_picture_url: string | null;
  notify_enabled: boolean;
  linked_at: string;
  updated_at: string;
  revoked_at: string | null;
};

export type LineConnectionStatus = {
  connected: boolean;
  displayName: string | null;
  pictureUrl: string | null;
  notifyEnabled: boolean;
  linkedAt: string | null;
  revokedAt: string | null;
};

export async function upsertLineConnection(userId: string, profile: LineProfile) {
  const admin = createSupabaseAdminClient();

  const { data: existingByLineUser, error: existingError } = await admin
    .from("user_line_connections")
    .select("user_id")
    .eq("line_user_id", profile.userId)
    .maybeSingle<{ user_id: string }>();

  if (existingError) {
    throw new Error("line_connection_lookup_failed");
  }

  if (existingByLineUser && existingByLineUser.user_id !== userId) {
    throw new Error("line_user_already_linked");
  }

  const now = new Date().toISOString();
  const { error } = await admin.from("user_line_connections").upsert(
    {
      user_id: userId,
      line_user_id: profile.userId,
      line_display_name: profile.displayName ?? null,
      line_picture_url: profile.pictureUrl ?? null,
      notify_enabled: true,
      linked_at: now,
      revoked_at: null,
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw new Error("line_connection_upsert_failed");
  }
}

export async function getLineConnectionStatus(
  userId: string
): Promise<LineConnectionStatus> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("user_line_connections")
    .select(
      "id,user_id,line_display_name,line_picture_url,notify_enabled,linked_at,updated_at,revoked_at"
    )
    .eq("user_id", userId)
    .maybeSingle<LineConnectionRow>();

  if (error || !data) {
    return {
      connected: false,
      displayName: null,
      pictureUrl: null,
      notifyEnabled: false,
      linkedAt: null,
      revokedAt: null,
    };
  }

  return {
    connected: data.revoked_at === null,
    displayName: data.line_display_name,
    pictureUrl: data.line_picture_url,
    notifyEnabled: data.notify_enabled,
    linkedAt: data.linked_at,
    revokedAt: data.revoked_at,
  };
}

export async function deleteLineConnection(userId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("user_line_connections")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error("line_connection_delete_failed");
  }
}
