import Image from "next/image";
import { Monitor, Network, Cpu, FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/ui/primitives";
import BreadcrumbTrail from "@/components/ui/BreadcrumbTrail";

export const dynamic = "force-dynamic";

const facilities = [
  {
    title: "ห้องปฏิบัติการคอมพิวเตอร์",
    description:
      "ห้องปฏิบัติการสำหรับการเรียนการสอนด้านการเขียนโปรแกรม การพัฒนาเว็บไซต์ ระบบฐานข้อมูล และงานด้านเทคโนโลยีสารสนเทศ",
    image: "/about/facilities/lab-1.jpg",
    icon: Monitor,
    items: [
      "เครื่องคอมพิวเตอร์สำหรับการเรียนภาคปฏิบัติ",
      "ซอฟต์แวร์สนับสนุนการเขียนโปรแกรม",
      "ระบบเครือข่ายสำหรับฝึกปฏิบัติจริง",
    ],
  },
  {
    title: "ห้องปฏิบัติการเครือข่าย",
    description:
      "พื้นที่สำหรับฝึกทักษะด้านระบบเครือข่าย การเชื่อมต่ออุปกรณ์ การดูแลระบบ และการวิเคราะห์ปัญหาด้านโครงสร้างพื้นฐานดิจิทัล",
    image: "/about/facilities/lab-2.jpg",
    icon: Network,
    items: [
      "อุปกรณ์เครือข่ายสำหรับฝึกปฏิบัติ",
      "เครื่องมือจำลองและทดสอบระบบ",
      "สภาพแวดล้อมสำหรับเรียนรู้การดูแลระบบ",
    ],
  },
  {
    title: "อุปกรณ์สนับสนุนการเรียนรู้",
    description:
      "อุปกรณ์และสื่อการเรียนการสอนที่ช่วยส่งเสริมให้นักศึกษาได้เรียนรู้ทั้งภาคทฤษฎีและภาคปฏิบัติอย่างมีประสิทธิภาพ",
    image: "/about/facilities/equipment.jpg",
    icon: Cpu,
    items: [
      "อุปกรณ์ประกอบการเรียนการสอน",
      "เครื่องมือสำหรับฝึกทักษะเฉพาะทาง",
      "สื่อการเรียนรู้ด้านเทคโนโลยี",
    ],
  },
];

export default function FacilitiesPage() {
  return (
    <>
      <PageHeader
        dark
        eyebrow="สิ่งสนับสนุนการเรียนรู้"
        title="อุปกรณ์การเรียนและห้องปฏิบัติการ"
        description="สาขาวิชามีห้องปฏิบัติการและอุปกรณ์ที่สนับสนุนการเรียนการสอน เพื่อให้นักศึกษาได้ฝึกปฏิบัติจริงและพัฒนาทักษะด้านเทคโนโลยีอย่างเป็นระบบ"
        breadcrumb={
          <BreadcrumbTrail
            dark
            backHref="/about"
            backLabel="ย้อนกลับ"
            items={[
              { label: "หน้าแรก", href: "/" },
              { label: "เกี่ยวกับสาขา", href: "/about" },
              { label: "อุปกรณ์การเรียนและห้องปฏิบัติการ" },
            ]}
          />
        }
      />

      <section className="section bg-slate-50">
        <div className="container-wide">
          <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-sm font-semibold text-orange-700 ring-1 ring-orange-100">
                  <FlaskConical className="h-4 w-4" />
                  Learning Facilities
                </div>

                <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  พื้นที่สำหรับการเรียนรู้และฝึกปฏิบัติจริง
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  ห้องปฏิบัติการและอุปกรณ์ของสาขาถูกจัดเตรียมเพื่อสนับสนุนการเรียนรู้
                  การทดลอง การพัฒนาผลงาน และการฝึกทักษะที่จำเป็นต่อสายงานด้านเทคโนโลยี
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {facilities.map((item, index) => {
              const Icon = item.icon;
              const reverse = index % 2 === 1;

              return (
                <article
                  key={item.title}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div
                    className={
                      reverse
                        ? "grid gap-0 lg:grid-cols-[1fr_430px]"
                        : "grid gap-0 lg:grid-cols-[430px_1fr]"
                    }
                  >
                    <div
                      className={
                        reverse
                          ? "relative h-[260px] overflow-hidden bg-slate-100 lg:order-2 lg:h-full lg:min-h-[360px]"
                          : "relative h-[260px] overflow-hidden bg-slate-100 lg:h-full lg:min-h-[360px]"
                      }
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 1024px) 100vw, 430px"
                      />
                    </div>

                    <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-700 ring-1 ring-orange-100">
                        <Icon className="h-6 w-6" />
                      </div>

                      <h2 className="text-2xl font-bold leading-snug text-slate-900">
                        {item.title}
                      </h2>

                      <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                        {item.description}
                      </p>

                      <div className="mt-6 grid gap-3">
                        {item.items.map((text) => (
                          <div
                            key={text}
                            className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600"
                          >
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
