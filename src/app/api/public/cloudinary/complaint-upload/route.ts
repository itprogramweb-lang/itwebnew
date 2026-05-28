import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 3 * 1024 * 1024; // 3MB (stricter for public)

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "ไม่สามารถอ่าน form data ได้" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "รองรับเฉพาะ JPG, PNG, WebP" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "ขนาดไฟล์ต้องไม่เกิน 3MB" },
      { status: 400 }
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // folder fixed to "complaints" — not accepted from client
    const result = await uploadToCloudinary(buffer, { folder: "complaints" });
    return NextResponse.json({
      secure_url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json(
      { error: `อัปโหลดไม่สำเร็จ: ${message}` },
      { status: 500 }
    );
  }
}
