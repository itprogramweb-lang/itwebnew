import type { TeacherWork, TeacherWorkType } from "@/types";

// =============================================================
// ข้อมูลผลงานอาจารย์ (จำลอง)
// แก้ข้อมูลจริงตรงนี้
// =============================================================
export const teacherWorksData: TeacherWork[] = [
  {
    id: "tw001",
    title:
      "Deep Learning Approach for Thai License Plate Recognition in Adverse Weather",
    type: "research",
    owner: "ผศ.ดร. ปวีณา สกุลทอง",
    year: "2567",
    detail:
      "งานวิจัยตีพิมพ์ใน IEEE Access เกี่ยวกับการพัฒนาโมเดลรู้จำป้ายทะเบียนรถภาษาไทยในสภาพแสงน้อยและฝนตก",
    link: "#",
  },
  {
    id: "tw002",
    title: "การประยุกต์ใช้ IoT ในเกษตรอัจฉริยะของไทย",
    type: "article",
    owner: "รศ.ดร. ธนวัฒน์ ไชยวงศ์",
    year: "2567",
    detail:
      "บทความวิชาการในวารสารวิจัยและพัฒนา มทร.ธัญบุรี เกี่ยวกับการนำเทคโนโลยี IoT มาใช้ในภาคเกษตรกรรมไทย",
    link: "#",
  },
  {
    id: "tw003",
    title: "รางวัลผลงานวิจัยดีเด่นด้านปัญญาประดิษฐ์ ระดับชาติ",
    type: "award",
    owner: "ดร. มาลี เพชรสกุล",
    year: "2566",
    detail:
      "ได้รับรางวัลจากสำนักงานคณะกรรมการวิจัยแห่งชาติ จากผลงาน Computer Vision สำหรับการแพทย์",
    link: "#",
  },
  {
    id: "tw004",
    title: "โครงการอบรม Cloud Computing ให้ครู สังกัด สพฐ.",
    type: "service",
    owner: "ดร. กฤษณะ พลพิทักษ์",
    year: "2567",
    detail:
      "บริการวิชาการอบรมเชิงปฏิบัติการให้ครูระดับมัธยมศึกษา จำนวน 120 คน ในเขตปริมณฑล",
    link: "#",
  },
  {
    id: "tw005",
    title:
      "A Hybrid Model for Sentiment Analysis on Thai Social Media Comments",
    type: "research",
    owner: "ผศ.ดร. ปวีณา สกุลทอง",
    year: "2566",
    detail:
      "งานวิจัยร่วมกับอาจารย์จากมหาวิทยาลัยเกษตรศาสตร์ ตีพิมพ์ใน Elsevier Journal",
    link: "#",
  },
  {
    id: "tw006",
    title: "บทความ Best Practice การสอน Programming ในยุค AI",
    type: "article",
    owner: "ผศ. สุนิสา จันทร์เพ็ญ",
    year: "2567",
    detail: "บทความแบ่งปันประสบการณ์การสอนวิชา Programming ในยุค GenAI",
    link: "#",
  },
  {
    id: "tw007",
    title: "รางวัลอาจารย์ดีเด่นด้านการสอน ระดับคณะ ประจำปี 2566",
    type: "award",
    owner: "อ. ภัทรา รุ่งโรจน์",
    year: "2566",
    detail:
      "ได้รับการคัดเลือกจากคณะวิทยาศาสตร์และเทคโนโลยี เป็นอาจารย์ดีเด่นด้านการสอน",
    link: "#",
  },
  {
    id: "tw008",
    title: "โครงการพัฒนาเว็บไซต์ให้วิสาหกิจชุมชน 5 แห่ง",
    type: "service",
    owner: "ผศ. สุนิสา จันทร์เพ็ญ",
    year: "2566",
    detail: "นำนักศึกษาออกแบบและพัฒนาเว็บไซต์ให้กับวิสาหกิจชุมชนในจังหวัดปทุมธานี",
    link: "#",
  },
  {
    id: "tw009",
    title:
      "Performance Comparison of Container Orchestration Platforms for Microservices",
    type: "research",
    owner: "ดร. กฤษณะ พลพิทักษ์",
    year: "2567",
    detail:
      "ผลงานวิจัยเปรียบเทียบประสิทธิภาพของ Kubernetes กับ Docker Swarm นำเสนอที่งานประชุมวิชาการนานาชาติ",
    link: "#",
  },
];

export const teacherWorkTypeLabels: Record<TeacherWorkType, string> = {
  research: "งานวิจัย",
  article: "บทความวิชาการ",
  award: "รางวัล",
  service: "บริการวิชาการ",
};
