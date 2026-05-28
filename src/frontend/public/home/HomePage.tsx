import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  FolderSearch,
  Users,
  FlaskConical,
  Network,
  Cloud,
  ShieldCheck,
  Code2,
  BarChart3,
  Palette,
  Headphones,
  Kanban,
  Newspaper,
  BriefcaseBusiness,
  Phone,
  Clock,
} from "lucide-react";
import { careerPaths } from "@/data/programs";
import HeroSlider from "@/components/HeroSlider";
import { SectionTitle } from "@/components/ui/primitives";
import CroppedImage from "@/components/ui/CroppedImage";
import ScrollReveal from "@/components/ui/ScrollReveal";
import {
  getHeroSlides,
  getNews,
  getPrograms,
  getSiteSettings,
  getStudentWorks,
  getStaffMembers,
} from "@/lib/supabase/queries";

const iconMap = {
  Code2,
  BarChart3,
  Network,
  Palette,
  Headphones,
  Kanban,
  Cloud,
  ShieldCheck,
};

type StaffLike = Record<string, unknown>;

const STAFF_ROLE_LABELS: Record<string, string> = {
  executive: "หัวหน้าสาขา",
  teacher: "อาจารย์ประจำ",
  officer: "เจ้าหน้าที่ธุรการประจำสาขาวิชา",
  lab_officer: "เจ้าหน้าที่ประจำห้องปฏิบัติการ",
};

function getStaffText(staff: StaffLike | undefined, keys: string[]) {
  if (!staff) return "";

  for (const key of keys) {
    const value = staff[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

function getStaffRoleLabel(staff: StaffLike | undefined) {
  if (!staff) return "";

  const roleType = typeof staff.role_type === "string" ? staff.role_type : "";

  return STAFF_ROLE_LABELS[roleType] || roleType;
}

export default async function HomePage() {
  const [
    heroSlides,
    siteSettings,
    programs,
    studentWorks,
    news,
    staffMembers,
  ] = await Promise.all([
    getHeroSlides(),
    getSiteSettings(),
    getPrograms(),
    getStudentWorks(),
    getNews(),
    getStaffMembers().catch(() => []),
  ]);

  const featuredWorks = studentWorks.filter((w) => w.is_featured).slice(0, 6);
  const latestNews = news.slice(0, 3);
  const sortedPrograms = [...programs].sort((a, b) => {
    const order: Record<string, number> = {
      bachelor: 1,
      master: 2,
    };

    return (order[a.level] ?? 99) - (order[b.level] ?? 99);
  });

  const departmentHead = (staffMembers as StaffLike[]).find((staff) => {
    const roleType =
      typeof staff.role_type === "string" ? staff.role_type.trim() : "";

    return (
      roleType === "executive" ||
      roleType === "หัวหน้าสาขา" ||
      roleType === "หัวหน้าสาขาวิชา"
    );
  });

  const departmentHeadName =
    getStaffText(departmentHead, [
      "name",
      "full_name",
      "display_name",
      "thai_name",
      "staff_name",
    ]) || "หัวหน้าสาขาวิชา";

  const departmentHeadPosition =
    getStaffRoleLabel(departmentHead) || "หัวหน้าสาขา";

  const departmentHeadPhone = getStaffText(departmentHead, [
    "phone",
    "tel",
    "telephone",
    "mobile",
    "contact_phone",
  ]);

  const departmentHeadImage = getStaffText(departmentHead, [
    "image_url",
    "photo_url",
    "avatar_url",
    "profile_image_url",
  ]);

  const departmentHeadImageAlt =
    getStaffText(departmentHead, ["image_alt", "photo_alt"]) ||
    departmentHeadName;

  const departmentHeadCrop =
    departmentHead && typeof departmentHead.image_crop_settings === "object"
      ? departmentHead.image_crop_settings
      : undefined;

const features = [
  {
    icon: FlaskConical,
    title: "พื้นที่ทดลองและลงมือทำ",
    description:
      "ฝึกปฏิบัติผ่านสภาพแวดล้อมที่รองรับซอฟต์แวร์ เครือข่าย ข้อมูล และระบบดิจิทัล",
    href: "/about/facilities",
  },
    {
      icon: Code2,
      title: "โปรเจกต์จริงทุกชั้นเรียน",
  description:
    "เรียนรู้ผ่านโจทย์จริง สร้างผลงานสะสม และต่อยอดเป็น Portfolio สำหรับสมัครงาน",
 href:"/works/students",
},
    {
      icon: Network,
      title: "เครือข่ายสายเทคโนโลยี",
      description:
        "เชื่อมต่อกับชุมชนการเรียนรู้ บุคลากร และโอกาสทางวิชาชีพในสายดิจิทัล",
    },
    {
      icon: ShieldCheck,
      title: "วางพื้นฐานอย่างเป็นระบบ",
      description:
        "พัฒนาทักษะคิด วิเคราะห์ ออกแบบ และรับผิดชอบงานเทคโนโลยีอย่างมืออาชีพ",
    },
  ];

  return (
    <div className="bg-slate-950 text-slate-100">
      <HeroSlider slides={heroSlides} siteSettings={siteSettings} />

      {/* ========== FEATURES ========== */}
      <section className="section bg-slate-950">
        <div className="container-wide">
          <SectionTitle
            eyebrow="ทำไมต้องเลือกเรา"
            title="เรียน IT ผ่านโจทย์จริงและเครื่องมือร่วมสมัย"
            description="เราออกแบบประสบการณ์การเรียนให้เชื่อมโยงทักษะด้านเทคโนโลยีกับการทำงานจริงในองค์กรยุคดิจิทัล"
            align="center"
            dark
          />

          <ScrollReveal delay={80}>
            <div className="grid gap-8 lg:grid-cols-[0.95fr_2fr]">
              {departmentHead && (
                <article className="order-2 flex min-h-0 flex-col justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 sm:p-7 lg:order-1 lg:min-h-[560px]">
                  <div className="mx-auto mb-6 h-64 w-full max-w-[250px] overflow-hidden rounded-3xl bg-slate-950 sm:h-72 lg:h-[300px]">
                    <CroppedImage
                      src={departmentHeadImage}
                      fallbackSrc="/placeholders/staff-placeholder.svg"
                      alt={departmentHeadImageAlt}
                      crop={departmentHeadCrop}
                      className="h-full w-full scale-110 rounded-none object-cover"
                    />
                  </div>

                  <div className="text-center">
                    <div className="mx-auto mb-5 inline-flex rounded-full bg-orange-500/20 px-4 py-1.5 text-sm font-semibold text-orange-200 ring-1 ring-orange-400/30">
                      {departmentHeadPosition}
                    </div>

                    <h3 className="mx-auto max-w-[320px] text-2xl font-bold leading-snug text-white">
                      {departmentHeadName}
                    </h3>

                    {departmentHeadPhone && (
                      <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-300">
                        <Phone className="h-4 w-4 text-orange-300" />
                        <span>{departmentHeadPhone}</span>
                      </div>
                    )}
                  </div>
                </article>
              )}

              <div
                className={
                  departmentHead
                    ? "order-1 grid gap-6 sm:grid-cols-2 lg:order-2"
                    : "order-1 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                }
              >
{features.map((feature) => {
  const Icon = feature.icon;

  const cardContent = (
    <>
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/30">
        <Icon className="h-7 w-7" />
      </div>

      <h3 className="text-xl font-bold text-white">
        {feature.title}
      </h3>

      <p className="mt-4 text-sm leading-7 text-slate-300">
        {feature.description}
      </p>

      {feature.href && (
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-300">
          ดูรายละเอียด
          <ArrowRight className="h-4 w-4" />
        </div>
      )}
    </>
  );

  const cardClassName =
    "rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/30 hover:bg-white/[0.07]";

  if (feature.href) {
    return (
      <Link
        key={feature.title}
        href={feature.href}
        className={`${cardClassName} group block cursor-pointer`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <article key={feature.title} className={cardClassName}>
      {cardContent}
    </article>
  );
})}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>


      {/* ========== PROGRAMS ========== */}
      <section className="section bg-slate-100 border-y border-slate-200">
        <div className="container-wide">
          <SectionTitle
            title="หลักสูตรที่เปิดสอน"
            description="เปิดสอนทั้งระดับปริญญาตรีและปริญญาโท พร้อมแผนการเรียนที่ตอบโจทย์ทั้งสายงานและสายวิจัย"
          />

          <ScrollReveal delay={80}>
            {sortedPrograms.length === 0 ? (
              <div className="text-center py-14 px-6 bg-white rounded-2xl border border-dashed border-slate-200">
                <FolderSearch className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">ยังไม่มีข้อมูลในขณะนี้</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {sortedPrograms.map((program) => (
                  <article
                    key={program.id}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white card-hover"
                  >
                    <CroppedImage
                      src={program.image_url}
                      fallbackSrc="/placeholders/program-placeholder.svg"
                      alt={program.image_alt || program.title}
                      crop={program.image_crop_settings}
                      className="h-64 w-full rounded-none bg-slate-100 object-cover md:h-72 lg:h-80"
                    />

                    <div className="p-6">
                      <div className="flex justify-end">
                        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-5 py-2 text-lg font-bold text-orange-700 ring-2 ring-orange-300">
                          <span className="h-2 w-2 rounded-full bg-orange-400" />
                          {program.level === "bachelor" ? "ปริญญาตรี" : "ปริญญาโท"}
                        </div>
                      </div>

                      <h3 className="mt-1 font-semibold text-lg text-slate-900">
                        {program.title}
                      </h3>
                      {/* Meta info */}
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
                            <Clock className="w-3 h-3" />
                            ระยะเวลา
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
                            {program.duration || "–"}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 px-3.5 py-2.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
                            <BookOpen className="w-3 h-3" />
                            หน่วยกิต
                          </div>
                          <div className="text-sm font-semibold text-slate-800">
                            {program.credits ? `${program.credits} หน่วยกิต` : "–"}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-4 line-clamp-3 leading-relaxed">
                        {program.description}
                      </p>

                      <Link
                        href={
                          program.level === "master"
                            ? "/programs/master"
                            : "/programs/bachelor"
                        }
                        className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                      >
                        ดูรายละเอียดหลักสูตร <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========== CAREERS ========== */}
      <section className="section bg-slate-950">
        <div className="container-wide">
          <SectionTitle
            eyebrow="เส้นทางอาชีพ"
            title="จบไปทำงานอะไรได้บ้าง"
            description="เส้นทางอาชีพในสายเทคโนโลยีมีหลายบทบาท ตั้งแต่งานพัฒนาระบบจนถึงงานวิเคราะห์และออกแบบบริการดิจิทัล"
            align="center"
            dark
          />

          <ScrollReveal delay={80}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {careerPaths.map((c) => {
                const Icon = iconMap[c.icon as keyof typeof iconMap] || Code2;

                return (
                  <div
                    key={c.title}
                    className="group bg-slate-900 rounded-2xl border border-slate-800 p-5 card-hover"
                  >
                    <div className="w-11 h-11 rounded-xl bg-brand-50 grid place-items-center text-brand-600 group-hover:bg-brand-gradient group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="mt-4 font-semibold text-white">
                      {c.title}
                    </div>

                    <div className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {c.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========== STUDENT WORKS ========== */}
      <section className="section bg-slate-100">
        <div className="container-wide">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <SectionTitle
              title="โปรเจกต์จริงจากนักศึกษา"
              description="ผลงานที่นักศึกษาของเราสร้างสรรค์ขึ้นในระหว่างการเรียน"
              className="mb-0"
            />

            <Link
              href="/works/students"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              ดูผลงานทั้งหมด
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <ScrollReveal delay={80}>
            {featuredWorks.length === 0 ? (
              <div className="text-center py-14 px-6 bg-white rounded-2xl border border-dashed border-slate-200">
                <FolderSearch className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">ยังไม่มีข้อมูลในขณะนี้</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {featuredWorks.map((work) => {
                  const workHref = work.slug
                    ? `/works/students/${work.slug}`
                    : work.external_url && work.external_url !== "#"
                      ? work.external_url
                      : null;

                  const isExternal = !work.slug && !!workHref;

                  const card = (
                    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white card-hover">
                      <div className="overflow-hidden">
                        <CroppedImage
                          src={work.image_url}
                          fallbackSrc="/placeholders/student-work-placeholder.svg"
                          alt={work.image_alt || work.title}
                          crop={work.image_crop_settings}
                          className="h-52 w-full rounded-none bg-slate-100 transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-5">
                        <span className="w-fit rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                          {work.category || "Student Work"}
                        </span>

                        <h3 className="mt-3 line-clamp-2 font-semibold leading-snug text-slate-900 transition-colors group-hover:text-brand-600">
                          {work.title}
                        </h3>

                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                          {work.description}
                        </p>

                        <div className="mt-auto pt-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <BookOpen className="h-3.5 w-3.5" />
                            {work.academic_year || "-"}
                          </div>

                          {workHref && (
                            <div className="mt-3 flex items-center gap-1 text-xs font-medium text-brand-600 group-hover:text-brand-700">
                              ดูรายละเอียด
                              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );

                  return workHref ? (
                    <Link
                      key={work.id}
                      href={workHref}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="flex h-full flex-col"
                    >
                      {card}
                    </Link>
                  ) : (
                    <div key={work.id} className="flex h-full flex-col">
                      {card}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========== NEWS ========== */}
      <section className="section bg-slate-100 border-t border-slate-200">
        <div className="container-wide">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionTitle
              eyebrow="ข่าวสารและประกาศ"
              title="อัปเดตล่าสุดจากสาขา"
              description="ติดตามข่าวประกาศ กิจกรรม ทุนการศึกษา และความเคลื่อนไหวของสาขาวิชา"
              className="mb-0"
            />

            <Link
              href="/news"
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              ดูข่าวทั้งหมด
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <ScrollReveal delay={80}>
            {latestNews.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                <Newspaper className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">
                  ยังไม่มีข่าวสารในขณะนี้
                </p>
              </div>
            ) : (
<div className="grid gap-8 lg:grid-cols-3">
  {/* Featured card */}
  {latestNews[0] && (
    <Link
      href={latestNews[0].slug ? `/news/${latestNews[0].slug}` : "/news"}
      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl lg:col-span-2"
    >
      <article className="flex h-full flex-col">
        {/* รูปความสูงตายตัว ไม่ใช้ aspect-ratio */}
        <div className="relative h-64 overflow-hidden bg-slate-100 lg:h-72">
          <CroppedImage
            src={latestNews[0].image_url}
            fallbackSrc="/placeholders/news-placeholder.svg"
            alt={latestNews[0].image_alt || latestNews[0].title}
            crop={latestNews[0].image_crop_settings}
            className="h-full w-full rounded-none object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            ข่าวล่าสุด
          </div>
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            {latestNews[0].category && (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 font-medium text-brand-700">
                {latestNews[0].category}
              </span>
            )}
            {latestNews[0].published_at && (
              <span>
                {new Date(latestNews[0].published_at).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>

          <h3 className="text-xl font-semibold leading-snug text-slate-900 transition group-hover:text-brand-700">
            {latestNews[0].title}
          </h3>

          {latestNews[0].excerpt && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
              {latestNews[0].excerpt}
            </p>
          )}

          <div className="mt-auto pt-5">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
              อ่านรายละเอียด
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )}

  {/* การ์ดเล็ก — ใช้ h-full + flex เพื่อให้สูงเท่ากัน */}
  <div className="flex flex-col gap-6">
    {latestNews.slice(1, 3).map((item) => (
      <Link
        key={item.id}
        href={item.slug ? `/news/${item.slug}` : "/news"}
        className="group flex flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      >
        <article className="flex w-full flex-col">
          <div className="relative h-44 overflow-hidden bg-slate-100">
            <CroppedImage
              src={item.image_url}
              fallbackSrc="/placeholders/news-placeholder.svg"
              alt={item.image_alt || item.title}
              crop={item.image_crop_settings}
              className="h-full w-full rounded-none object-cover transition duration-500 group-hover:scale-105"
            />
          </div>

          <div className="flex flex-1 flex-col p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {item.category && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                  {item.category}
                </span>
              )}
              {item.published_at && (
                <span>
                  {new Date(item.published_at).toLocaleDateString("th-TH", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>

            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 transition group-hover:text-brand-700">
              {item.title}
            </h3>

            {item.excerpt && (
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {item.excerpt}
              </p>
            )}
          </div>
        </article>
      </Link>
    ))}
  </div>
</div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="section bg-slate-950">
        <div className="container-wide">
          <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-8 text-white md:p-10 lg:p-12">
            <div className="absolute inset-0 bg-brand-mesh opacity-30" />
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-amber-200/20 blur-2xl" />

            <div className="relative grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/15 backdrop-blur border border-white/20 text-xs font-semibold">
                  เปิดรับสมัครแล้ววันนี้
                </div>

                <h2 className="mt-5 text-3xl lg:text-4xl font-semibold leading-snug">
                  พร้อมเริ่มต้น <br className="hidden sm:block" />
                  เส้นทางสาย IT ของคุณแล้วหรือยัง?
                </h2>

                <p className="mt-4 text-base lg:text-lg text-white/90 leading-relaxed">
                  สมัครเรียนวันนี้ พบกับโอกาส ทุนการศึกษา และเส้นทางอาชีพมากมาย
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/apply"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 font-semibold text-brand-700 transition-colors hover:bg-brand-50 sm:w-auto"
                  >
                    สมัครเรียนตอนนี้
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/about/contact"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/15 px-6 font-medium text-white backdrop-blur transition-colors hover:bg-white/25 sm:w-auto"
                  >
                    ติดต่อสอบถาม
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/25 bg-white/10 p-5 shadow-xl backdrop-blur-sm">
                <div className="flex items-center gap-3 rounded-xl bg-white/15 border border-white/20 p-4">
                  <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="text-sm font-semibold">
                      หลักสูตรสาย IT ครบวงจร
                    </div>
                    <div className="text-xs text-white/80 mt-0.5 leading-relaxed">
                      ปริญญาตรีและโท ออกแบบตามมาตรฐานวิชาชีพ
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white/15 border border-white/20 p-4">
                  <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center shrink-0">
                    <Code2 className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="text-sm font-semibold">
                      ฝึกทำผลงานจริงทุกชั้นปี
                    </div>
                    <div className="text-xs text-white/80 mt-0.5 leading-relaxed">
                      สร้าง Portfolio ด้วยโปรเจกต์จริงตลอดหลักสูตร
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-white/15 border border-white/20 p-4">
                  <div className="w-9 h-9 rounded-xl bg-white/25 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="text-sm font-semibold">
                      ติดต่อสอบถามได้ทุกช่องทาง
                    </div>
                    <div className="text-xs text-white/80 mt-0.5 leading-relaxed">
                      ทีมอาจารย์พร้อมให้คำปรึกษาตลอดเวลา
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
