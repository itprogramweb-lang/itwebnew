import "server-only";

export type ParsedLineNewsForm = {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  status: "published" | "draft";
  isFeatured: boolean;
  publishedAt: string | null;
  notesForAi: string;
  coverImageIntent: "attached" | "none" | "unspecified";
  warnings: string[];
};

export type LineNewsFormParseResult =
  | {
      ok: true;
      draft: ParsedLineNewsForm;
    }
  | {
      ok: false;
      missingFields: string[];
      warnings: string[];
    };

const fieldLabels = [
  "หัวข้อ",
  "หมวดหมู่",
  "วันที่เผยแพร่",
  "สรุปสั้น",
  "รายละเอียด",
  "รูปปก",
  "สถานะ",
  "ข่าวเด่น",
  "หมายเหตุสำหรับ AI",
] as const;

type FieldLabel = (typeof fieldLabels)[number];

const fieldPattern = new RegExp(`^(${fieldLabels.join("|")}):\\s*(.*)$`);

function emptyFields(): Record<FieldLabel, string> {
  return {
    หัวข้อ: "",
    หมวดหมู่: "",
    วันที่เผยแพร่: "",
    สรุปสั้น: "",
    รายละเอียด: "",
    รูปปก: "",
    สถานะ: "",
    ข่าวเด่น: "",
    "หมายเหตุสำหรับ AI": "",
  };
}

function parseFields(text: string) {
  const fields = emptyFields();
  let activeField: FieldLabel | null = null;

  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    const match = trimmed.match(fieldPattern);

    if (match) {
      activeField = match[1] as FieldLabel;
      fields[activeField] = match[2]?.trim() ?? "";
      continue;
    }

    if (activeField && line.trim().length > 0) {
      fields[activeField] = [fields[activeField], line.trim()]
        .filter(Boolean)
        .join("\n");
    }
  }

  return fields;
}

function mapStatus(value: string, warnings: string[]): "published" | "draft" {
  const normalized = value.trim().toLowerCase();

  if (!normalized || normalized === "เผยแพร่" || normalized === "published") {
    return "published";
  }
  if (normalized === "ฉบับร่าง" || normalized === "draft") {
    return "draft";
  }

  warnings.push(`ไม่รู้จักสถานะ "${value}" จึงใช้ค่าเริ่มต้นเป็นเผยแพร่`);
  return "published";
}

function mapFeatured(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "ใช่" || normalized === "yes" || normalized === "true";
}

function mapCoverIntent(
  value: string
): ParsedLineNewsForm["coverImageIntent"] {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "unspecified";
  if (normalized.includes("ใช้รูปที่แนบ")) return "attached";
  if (normalized.includes("ไม่มีรูป")) return "none";
  return "unspecified";
}

function parsePublishedAt(value: string, warnings: string[]) {
  const raw = value.trim();
  if (!raw || raw === "ตอนนี้") return null;

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

  warnings.push(
    `ไม่สามารถอ่านวันที่เผยแพร่ "${value}" ได้ จึงจะใช้เวลาปัจจุบันภายหลัง`
  );
  return null;
}

export function parseLineNewsForm(text: string): LineNewsFormParseResult {
  const fields = parseFields(text);
  const warnings: string[] = [];
  const title = fields["หัวข้อ"].trim();
  const content = fields["รายละเอียด"].trim();
  const missingFields = [
    !title ? "หัวข้อ" : null,
    !content ? "รายละเอียด" : null,
  ].filter((field): field is string => Boolean(field));

  if (missingFields.length > 0) {
    return {
      ok: false,
      missingFields,
      warnings,
    };
  }

  return {
    ok: true,
    draft: {
      title,
      category: fields["หมวดหมู่"].trim() || "ประกาศ",
      excerpt: fields["สรุปสั้น"].trim(),
      content,
      status: mapStatus(fields["สถานะ"], warnings),
      isFeatured: mapFeatured(fields["ข่าวเด่น"] || "ไม่"),
      publishedAt: parsePublishedAt(fields["วันที่เผยแพร่"], warnings),
      notesForAi: fields["หมายเหตุสำหรับ AI"].trim(),
      coverImageIntent: mapCoverIntent(fields["รูปปก"]),
      warnings,
    },
  };
}

export function looksLikeFullNewsForm(text: string) {
  return /(^|\n)หัวข้อ\s*:/m.test(text) || /(^|\n)รายละเอียด\s*:/m.test(text);
}
