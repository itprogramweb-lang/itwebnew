import { NextRequest, NextResponse } from "next/server";
import { deleteLineConnection } from "@/lib/line/connection";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

export async function DELETE(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteLineConnection(profile.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("LINE disconnect failed", {
      userId: profile.id,
      reason: error instanceof Error ? error.message : "unknown_error",
    });
    return NextResponse.json(
      { error: "Unable to disconnect LINE account." },
      { status: 500 }
    );
  }
}
