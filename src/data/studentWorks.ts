import type { StudentWork, WorkCategory } from "@/types";

// =============================================================
// ข้อมูลผลงานนักศึกษา (จำลอง)
// แก้ข้อมูลจริงตรงนี้
// =============================================================
export const studentWorksData: StudentWork[] = [
  {
    id: "sw001",
    title: "ระบบจองห้องประชุมอัจฉริยะ",
    description:
      "เว็บแอปพลิเคชันจองห้องประชุมแบบ real-time พร้อมระบบยืนยันผ่าน LINE Notify และ Dashboard สำหรับผู้ดูแล",
    year: "2567",
    owners: ["นายภาคิน สุขสว่าง", "นางสาวพัชรา ไชยศรี"],
    advisor: "ผศ. สุนิสา จันทร์เพ็ญ",
    category: "web",
    technologies: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS"],
  },
  {
    id: "sw002",
    title: "แอปแนะนำเมนูอาหารตามสารอาหาร",
    description:
      "แอปมือถือใช้ Machine Learning แนะนำเมนูที่เหมาะสมกับเป้าหมายสุขภาพและประวัติการกินของผู้ใช้",
    year: "2567",
    owners: ["นายชัยวัฒน์ ดีงาม"],
    advisor: "อ. นพพร แสงเงิน",
    category: "mobile",
    technologies: ["Flutter", "Firebase", "TensorFlow Lite"],
  },
  {
    id: "sw003",
    title: "ระบบตรวจจับใบหน้านักศึกษาเข้าเรียน",
    description:
      "ใช้ Computer Vision วิเคราะห์ภาพจากกล้องในห้องเรียนเพื่อบันทึกการเข้าเรียนแบบอัตโนมัติ",
    year: "2566",
    owners: ["นางสาวมณีรัตน์ จันทรา", "นายธีรพงษ์ แสนสุข"],
    advisor: "ดร. มาลี เพชรสกุล",
    category: "ai",
    technologies: ["Python", "OpenCV", "FastAPI", "React"],
  },
  {
    id: "sw004",
    title: "บอร์ดเซ็นเซอร์ตรวจวัดคุณภาพอากาศ",
    description:
      "อุปกรณ์ IoT ตรวจวัด PM2.5 อุณหภูมิ ความชื้น พร้อม Dashboard แสดงผลและแจ้งเตือนผ่าน Mobile",
    year: "2566",
    owners: ["นายอนุรักษ์ สิงห์ทอง", "นายภาคภูมิ พัฒนา"],
    advisor: "รศ.ดร. ธนวัฒน์ ไชยวงศ์",
    category: "iot",
    technologies: ["ESP32", "MQTT", "Node-RED", "InfluxDB"],
  },
  {
    id: "sw005",
    title: "ระบบ E-Commerce สำหรับวิสาหกิจชุมชน",
    description:
      "ร้านค้าออนไลน์ครบวงจรสำหรับผู้ประกอบการรายย่อย รองรับการชำระเงิน QR-PromptPay และระบบขนส่ง",
    year: "2567",
    owners: ["นางสาวกาญจนา ใจกล้า", "นายสุริยา ฟ้าใส"],
    advisor: "ผศ. สุนิสา จันทร์เพ็ญ",
    category: "web",
    technologies: ["Next.js", "Stripe", "Supabase"],
  },
  {
    id: "sw006",
    title: "แอปจัดการเวลานักศึกษา",
    description:
      "แอปวางแผนการเรียนและบริหารเวลาส่วนตัวพร้อม Reminder อัจฉริยะปรับตามพฤติกรรม",
    year: "2566",
    owners: ["นายอนุชา รุ่งเรือง"],
    advisor: "อ. นพพร แสงเงิน",
    category: "mobile",
    technologies: ["React Native", "Expo", "Firebase"],
  },
  {
    id: "sw007",
    title: "ระบบวิเคราะห์ความรู้สึกจากรีวิวภาษาไทย",
    description:
      "โมเดล NLP วิเคราะห์รีวิวร้านอาหารและสินค้าภาษาไทยให้คะแนนความพึงพอใจอัตโนมัติ",
    year: "2567",
    owners: ["นางสาววรัญญา เพ็ญสวัสดิ์"],
    advisor: "ผศ.ดร. ปวีณา สกุลทอง",
    category: "ai",
    technologies: ["Python", "PyThaiNLP", "Transformers"],
  },
  {
    id: "sw008",
    title: "Smart Farm ระบบปลูกผักไฮโดรโปนิกส์",
    description:
      "ระบบควบคุมโรงเรือนอัตโนมัติ ปรับ pH, EC และไฟปลูกตามเวลา ติดตามผลผ่านเว็บ",
    year: "2566",
    owners: ["นายกฤษฎา สวยงาม", "นายธนภัทร พิลึก"],
    advisor: "ดร. กฤษณะ พลพิทักษ์",
    category: "iot",
    technologies: ["Raspberry Pi", "Python", "MQTT", "Vue.js"],
  },
  {
    id: "sw009",
    title: "เว็บไซต์แสดงผลงานศิลปะดิจิทัล",
    description:
      "Online portfolio สำหรับศิลปินดิจิทัล พร้อมระบบ comment, like และ social share",
    year: "2567",
    owners: ["นางสาวนภัส งามดี", "นายปิยะ วิจิตร"],
    advisor: "อ. ภัทรา รุ่งโรจน์",
    category: "design",
    technologies: ["Figma", "Next.js", "Framer Motion"],
  },
  {
    id: "sw010",
    title: "ระบบทำนายผลการเรียนนักศึกษา",
    description:
      "ใช้ Machine Learning ทำนายโอกาสสำเร็จการศึกษาของนักศึกษา IT จากข้อมูลผลการเรียน",
    year: "2566",
    owners: ["นายชนาธิป ก้องเกียรติ"],
    advisor: "อ. ภัทรา รุ่งโรจน์",
    category: "ai",
    technologies: ["Python", "scikit-learn", "Streamlit"],
  },
];

export const workCategoryLabels: Record<WorkCategory, string> = {
  web: "เว็บแอป",
  mobile: "โมบายแอป",
  ai: "AI/Data",
  iot: "IoT",
  design: "Design",
  other: "อื่น ๆ",
};
