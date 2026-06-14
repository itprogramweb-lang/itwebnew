"use client";

import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PUBLIC_LANGUAGE_CHANGE_EVENT,
  PUBLIC_LANGUAGE_STORAGE_KEY,
  requestPublicLanguageChange,
  type PublicLanguage,
} from "@/components/PublicAutoTranslateProvider";

export type { PublicLanguage };

function getInitialLanguage(): PublicLanguage {
  if (typeof window === "undefined") return "th";
  return window.localStorage.getItem(PUBLIC_LANGUAGE_STORAGE_KEY) === "en" ? "en" : "th";
}

export function usePublicLanguage() {
  const [language, setLanguage] = useState<PublicLanguage>("th");

  useEffect(() => {
    setLanguage(getInitialLanguage());

    const onLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<{ language?: PublicLanguage }>).detail?.language;
      if (next) setLanguage(next);
    };

    window.addEventListener(PUBLIC_LANGUAGE_CHANGE_EVENT, onLanguageChange);
    return () => window.removeEventListener(PUBLIC_LANGUAGE_CHANGE_EVENT, onLanguageChange);
  }, []);

  return language;
}

export function getPublicNavLabel({
  href,
  label,
  labelEn,
  language,
}: {
  href?: string | null;
  label: string;
  labelEn?: string | null;
  language: PublicLanguage;
}) {
  if (language !== "en") return label;
  if (labelEn?.trim()) return labelEn.trim();

  const byHref: Record<string, string> = {
    "/": "Home",
    "/apply": "Admissions",
    "/news": "News",
    "/about": "About the Department",
    "/about/staff": "Faculty and Staff",
    "/about/facilities": "Facilities and Laboratories",
    "/about/contact": "Contact",
    "/programs/bachelor": "Undergraduate Program",
    "/programs/master": "Graduate Program",
    "/works/students": "Student Works",
    "/works/students/final-projects": "Thesis",
    "/works/students/course": "Course Works",
    "/works/teachers": "Faculty Works",
    "/students/registration": "Registration",
    "/students/registrar": "Registrar",
    "/students/loan": "Student Loan Fund",
    "/students/welfare": "Student Welfare",
    "/students/complaint": "Complaints and Feedback",
  };

  const byLabel: Record<string, string> = {
    "หน้าแรก": "Home",
    "สมัครเรียน": "Admissions",
    "ข่าวสาร": "News",
    "เกี่ยวกับสาขา": "About",
    "หลักสูตร": "Programs",
    "ผลงาน": "Works",
    "นักศึกษาปัจจุบัน": "Current Students",
    "บุคลากร": "Faculty and Staff",
    "อุปกรณ์การเรียนและห้องปฏิบัติการ": "Facilities and Laboratories",
    "อุปกรณ์และห้องปฏิบัติการ": "Facilities and Laboratories",
    "ติดต่อ": "Contact",
    "ปริญญาตรี": "Undergraduate Program",
    "ปริญญาโท": "Graduate Program",
    "ผลงานนักศึกษา": "Student Works",
    "ปริญญานิพนธ์": "Thesis",
    "ผลงานรายวิชา": "Course Works",
    "ประกวด / แข่งขัน / นำเสนอผลงาน": "Competitions and Presentations",
    "ผลงานอาจารย์": "Faculty Works",
    "ทะเบียน": "Registration",
    "ลงทะเบียนเรียน": "Registration",
    "กยศ.": "Student Loan Fund",
    "สวัสดิการ": "Student Welfare",
    "สวัสดิการนักศึกษา": "Student Welfare",
    "ร้องเรียน/ความคิดเห็น": "Complaints and Feedback",
    "ข้อร้องเรียน": "Complaints and Feedback",
  };

  if (href && byHref[href]) return byHref[href];
  return byLabel[label] ?? label;
}

export default function PublicLanguageToggle({ className }: { className?: string }) {
  const language = usePublicLanguage();

  const selectLanguage = (next: PublicLanguage) => {
    window.localStorage.setItem(PUBLIC_LANGUAGE_STORAGE_KEY, next);
    requestPublicLanguageChange(next);
  };

  return (
    <div
      className={cn(
        "notranslate inline-flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/8 p-1 text-xs font-semibold text-slate-100",
        className
      )}
      translate="no"
      aria-label="เลือกภาษา"
    >
      <Languages className="h-3.5 w-3.5 text-brand-200" aria-hidden="true" />
      {(["th", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => selectLanguage(item)}
          className={cn(
            "min-w-8 rounded-full px-2 py-1 transition-colors",
            language === item
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-200 hover:bg-white/10 hover:text-white"
          )}
          aria-pressed={language === item}
          aria-label={item === "th" ? "แสดงภาษาไทย" : "Translate to English"}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
