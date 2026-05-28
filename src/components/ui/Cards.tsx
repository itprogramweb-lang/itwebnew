"use client";
import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  Calendar,
  Tag,
  Users,
  GraduationCap,
  BookOpen,
  User,
} from "lucide-react";
import type { Staff, StudentWork, TeacherWork, NewsItem, Program } from "@/types";
import { formatDate } from "@/lib/utils";
import { workCategoryLabels } from "@/data/studentWorks";
import { teacherWorkTypeLabels } from "@/data/teacherWorks";

const initials = (name: string) =>
  name
    .replace(/^(ผศ\.|รศ\.|ดร\.|อ\.|นาย|นาง|นางสาว|ผศ\.ดร\.|รศ\.ดร\.)+\s*/g, "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

export function StaffCard({ staff }: { staff: Staff }) {
  return (
    <div className="group rounded-[var(--site-card-radius)] border border-slate-200 bg-white p-5 card-hover">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand-gradient grid place-items-center text-white font-semibold text-lg shadow-sm shrink-0">
          {initials(staff.name) || <User className="w-7 h-7" />}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{staff.name}</div>
          <div className="text-sm text-brand-600">{staff.position}</div>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="flex flex-wrap gap-1.5">
          {staff.expertise.slice(0, 3).map((e) => (
            <span
              key={e}
              className="inline-block px-2 py-0.5 text-xs rounded-full bg-brand-50 text-brand-700"
            >
              {e}
            </span>
          ))}
        </div>
        <div className="text-xs text-slate-500 line-clamp-2">
          {staff.education[0]}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate">{staff.email}</span>
        </div>
        {staff.room && (
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{staff.room}</span>
          </div>
        )}
        {staff.phone && (
          <div className="flex items-center gap-2 text-xs">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            <span>{staff.phone}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function WorkCard({ work }: { work: StudentWork }) {
  return (
    <article className="group overflow-hidden rounded-[var(--site-card-radius)] border border-slate-200 bg-white card-hover">
      <div className="relative h-44 bg-brand-gradient overflow-hidden">
        <div className="absolute inset-0 bg-brand-mesh opacity-50" />
        <div className="absolute inset-0 grid place-items-center text-white/95">
          <BookOpen className="w-12 h-12" strokeWidth={1.5} />
        </div>
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-brand-700">
          {workCategoryLabels[work.category]}
        </span>
        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/30 backdrop-blur text-xs font-medium text-white">
          {work.year}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-slate-900 leading-snug line-clamp-2">
          {work.title}
        </h3>
        <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
          {work.description}
        </p>
        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{work.owners.join(", ")}</span>
          </div>
          <div className="flex items-start gap-2">
            <GraduationCap className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>ที่ปรึกษา: {work.advisor}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {work.technologies.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
              {t}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function TeacherWorkCard({ work }: { work: TeacherWork }) {
  return (
    <article className="rounded-[var(--site-card-radius)] border border-slate-200 bg-white p-5 card-hover">
      <div className="flex items-start justify-between gap-3">
        <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium">
          {teacherWorkTypeLabels[work.type]}
        </span>
        <span className="text-xs text-slate-500">{work.year}</span>
      </div>
      <h3 className="font-semibold text-slate-900 mt-3 leading-snug">
        {work.title}
      </h3>
      <p className="text-sm text-slate-600 mt-2 leading-relaxed line-clamp-3">
        {work.detail}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-500">{work.owner}</div>
        {work.link && (
          <Link
            href={work.link}
            className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
          >
            อ่านเพิ่ม <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    </article>
  );
}

export function NewsCard({ item, compact = false }: { item: NewsItem; compact?: boolean }) {
  return (
    <Link
      href="/news"
      className="group block overflow-hidden rounded-[var(--site-card-radius)] border border-slate-200 bg-white card-hover"
    >
      {!compact && (
        <div className="relative h-40 bg-brand-gradient-soft overflow-hidden">
          <div className="absolute inset-0 bg-brand-mesh opacity-60" />
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-brand-700">
              <Tag className="w-3 h-3" />
              {item.category}
            </span>
          </div>
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(item.date)}
          {compact && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-brand-600">{item.category}</span>
            </>
          )}
        </div>
        <h3 className="font-semibold text-slate-900 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
          {item.title}
        </h3>
        <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
          {item.excerpt}
        </p>
        <div className="mt-3 text-sm text-brand-600 inline-flex items-center gap-1 font-medium">
          อ่านต่อ
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export function ProgramCard({ program }: { program: Program }) {
  const href = program.level === "bachelor" ? "/programs/bachelor" : "/programs/master";
  return (
    <article className="group relative overflow-hidden rounded-[var(--site-card-radius)] border border-slate-200 bg-white card-hover">
      <div className="relative h-32 bg-brand-gradient overflow-hidden">
        <div className="absolute inset-0 bg-brand-mesh opacity-40" />
        <div className="absolute inset-0 flex items-end p-5">
          <div className="text-white">
            <div className="text-xs font-medium opacity-90">
              {program.level === "bachelor" ? "ปริญญาตรี" : "ปริญญาโท"}
            </div>
            <div className="mt-1 text-2xl font-semibold">{program.degree}</div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <h3 className="font-semibold text-lg text-slate-900 leading-snug">
          {program.name}
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-500">ระยะเวลา</div>
            <div className="font-medium text-slate-800">{program.duration}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">หน่วยกิต</div>
            <div className="font-medium text-slate-800">{program.credits} หน่วยกิต</div>
          </div>
        </div>
        <p className="text-sm text-slate-600 mt-4 line-clamp-3 leading-relaxed">
          {program.overview}
        </p>
        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          ดูรายละเอียดหลักสูตร
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </article>
  );
}
