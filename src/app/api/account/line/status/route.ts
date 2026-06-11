import { NextRequest, NextResponse } from "next/server";
import { getComplaintAccessForProfile } from "@/lib/complaintAccess";
import { getLineConnectionStatus } from "@/lib/line/connection";
import { getAuthenticatedProfile } from "@/lib/serverAuth";

export async function GET(request: NextRequest) {
  const profile = await getAuthenticatedProfile(request);

  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getLineConnectionStatus(profile.id);
  const complaintAccess = await getComplaintAccessForProfile(profile);

  return NextResponse.json({
    line: status,
    eligibility: {
      isDepartmentHead: complaintAccess.isDepartmentHead,
    },
  });
}
