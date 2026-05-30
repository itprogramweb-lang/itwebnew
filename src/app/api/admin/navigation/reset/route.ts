import { NextRequest, NextResponse } from "next/server";
import {
  buildNavigationTree,
  isNavigationLocation,
  resetCoreNavigationItems,
} from "@/backend/services/navigation";
import { hasPermission } from "@/lib/permissions";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

async function requireNavigationManager(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!hasPermission(profile.role, "manage_pages")) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { profile };
}

export async function POST(request: NextRequest) {
  const auth = await requireNavigationManager(request);
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const rawLocation = body.location;
  const location = rawLocation === "all" || rawLocation === undefined || rawLocation === null
    ? undefined
    : rawLocation;

  if (location !== undefined && !isNavigationLocation(location)) {
    return NextResponse.json({ error: "ตำแหน่งเมนูไม่ถูกต้อง" }, { status: 400 });
  }

  try {
    const result = await resetCoreNavigationItems(location);
    return NextResponse.json({
      ok: true,
      reset_count: result.resetCount,
      navigation: result.navigation,
      tree: buildNavigationTree(result.navigation),
    });
  } catch (error) {
    console.error("Admin navigation reset failed:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "รีเซตเมนูหลักไม่สำเร็จ" }, { status: 500 });
  }
}
