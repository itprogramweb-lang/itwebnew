import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { requireEffectivePermission } from "@/lib/serverAuth";

const PROGRAM_COLUMNS =
  "id,level,title,degree_name,duration,credits,description,image_url,image_alt,image_crop_settings,curriculum_url,details,is_active,created_at,updated_at";

type ProgramPayload = {
  id?: string;
  level?: string;
  title?: string;
  degree_name?: string | null;
  duration?: string | null;
  credits?: number | string | null;
  description?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  image_crop_settings?: Record<string, unknown> | null;
  curriculum_url?: string | null;
  details?: Record<string, unknown> | null;
  is_active?: boolean;
};

async function requireProgramManager(request: NextRequest) {
  return requireEffectivePermission(request, "manage_programs");
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseCredits(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function toPayload(body: ProgramPayload) {
  const level = cleanText(body.level);
  const title = cleanText(body.title);
  return {
    level,
    title,
    degree_name: cleanText(body.degree_name),
    duration: cleanText(body.duration),
    credits: parseCredits(body.credits),
    description: cleanText(body.description),
    image_url: cleanText(body.image_url),
    image_alt: cleanText(body.image_alt),
    image_crop_settings:
      body.image_crop_settings && typeof body.image_crop_settings === "object"
        ? body.image_crop_settings
        : {},
    curriculum_url: cleanText(body.curriculum_url),
    details: body.details && typeof body.details === "object" ? body.details : {},
    is_active: body.is_active !== false,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireProgramManager(request);
  if (auth.error) return auth.error;

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("programs")
    .select(PROGRAM_COLUMNS)
    .order("level", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูลหลักสูตรได้" }, { status: 500 });
  }

  return NextResponse.json({ programs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const auth = await requireProgramManager(request);
  if (auth.error) return auth.error;

  const payload = toPayload((await request.json()) as ProgramPayload);
  if (!payload.level || !["bachelor", "master"].includes(payload.level)) {
    return NextResponse.json({ error: "ระดับหลักสูตรไม่ถูกต้อง" }, { status: 400 });
  }
  if (!payload.title) {
    return NextResponse.json({ error: "กรุณากรอกชื่อหลักสูตร" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("programs")
    .insert(payload)
    .select(PROGRAM_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: "ไม่สามารถเพิ่มหลักสูตรได้" }, { status: 500 });
  }

  return NextResponse.json({ program: data }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireProgramManager(request);
  if (auth.error) return auth.error;

  const body = (await request.json()) as ProgramPayload;
  const id = cleanText(body.id);
  if (!id) return NextResponse.json({ error: "ไม่พบรหัสหลักสูตร" }, { status: 400 });

  const payload = toPayload(body);
  if (!payload.level || !["bachelor", "master"].includes(payload.level)) {
    return NextResponse.json({ error: "ระดับหลักสูตรไม่ถูกต้อง" }, { status: 400 });
  }
  if (!payload.title) {
    return NextResponse.json({ error: "กรุณากรอกชื่อหลักสูตร" }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("programs")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(PROGRAM_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: "ไม่สามารถบันทึกหลักสูตรได้" }, { status: 500 });
  }

  return NextResponse.json({ program: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireProgramManager(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = cleanText(searchParams.get("id"));

  if (!id) {
    return NextResponse.json(
      { error: "ไม่พบรหัสหลักสูตร" },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();

  const { error } = await admin
    .from("programs")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "ไม่สามารถลบหลักสูตรได้" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    id,
  });
}
