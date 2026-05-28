import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : null;
  const subject = typeof body.subject === "string" ? body.subject.trim() : null;
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "กรุณากรอกชื่อ" }, { status: 400 });
  }
  if (!message) {
    return NextResponse.json({ error: "กรุณากรอกรายละเอียด" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("contact_messages").insert({
    name,
    email: email || null,
    subject: subject || null,
    message,
    status: "new",
  });

  if (error) {
    return NextResponse.json(
      { error: `ส่งข้อมูลไม่สำเร็จ: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
