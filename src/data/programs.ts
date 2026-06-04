import type { Program } from "@/types";
import { PROGRAM_DEGREE_NAMES } from "@/lib/programDegreeNames";

// =============================================================
// ข้อมูลหลักสูตร (ข้อมูลจำลอง)
// แก้ข้อมูลจริงตรงนี้
// =============================================================
export const programsData: Program[] = [
  {
    id: "p-bachelor",
    level: "bachelor",
    name: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศ",
    nameEn: PROGRAM_DEGREE_NAMES.bachelor.nameEn,
    degree: "วท.บ. (เทคโนโลยีสารสนเทศ)",
    degreeEn: PROGRAM_DEGREE_NAMES.bachelor.degreeEn,
    duration: "4 ปี",
    credits: 133,
    overview:
      "หลักสูตรที่ออกแบบเพื่อสร้างบัณฑิตที่พร้อมทำงานในอุตสาหกรรมดิจิทัล โดยเน้นการลงมือปฏิบัติจริง การทำโครงงาน และการฝึกงานในองค์กรชั้นนำ ผู้เรียนจะได้ทักษะรอบด้านทั้งการพัฒนาซอฟต์แวร์ การจัดการข้อมูล ระบบเครือข่าย และเทคโนโลยีใหม่ ๆ เช่น AI และ Cloud",
    highlights: [
      "เรียนกับอาจารย์ผู้เชี่ยวชาญและมีประสบการณ์อุตสาหกรรมจริง",
      "ห้องปฏิบัติการครบครัน 8 ห้อง พร้อมอุปกรณ์ทันสมัย",
      "มีโครงงานจริงทุกชั้นปี ไม่ใช่แค่เรียนทฤษฎี",
      "สหกิจศึกษา 4 เดือน ในบริษัทด้านเทคโนโลยีชั้นนำ",
      "เครือข่ายศิษย์เก่าในบริษัท IT ทั่วประเทศ",
      "อัตราการได้งานสูงกว่า 90% ภายใน 6 เดือนหลังจบ",
    ],
    structure: [
      {
        category: "หมวดศึกษาทั่วไป",
        credits: 30,
        description: "ภาษา สังคม มนุษยศาสตร์ วิทยาศาสตร์-คณิตศาสตร์ และพลศึกษา",
      },
      {
        category: "หมวดวิชาเฉพาะ - วิชาแกน",
        credits: 24,
        description: "พื้นฐานคณิตศาสตร์ สถิติ และวิทยาการคอมพิวเตอร์",
      },
      {
        category: "หมวดวิชาเฉพาะ - วิชาเอกบังคับ",
        credits: 51,
        description: "Programming, Database, Network, Software Engineering, AI",
      },
      {
        category: "หมวดวิชาเฉพาะ - วิชาเอกเลือก",
        credits: 15,
        description: "เลือกตามกลุ่มความสนใจ เช่น Web, Mobile, Data, IoT",
      },
      {
        category: "หมวดวิชาเลือกเสรี",
        credits: 6,
        description: "เลือกได้อิสระจากทั้งมหาวิทยาลัย",
      },
      {
        category: "ฝึกงาน / สหกิจศึกษา",
        credits: 7,
        description: "ฝึกงานในบริษัทไม่น้อยกว่า 16 สัปดาห์",
      },
    ],
    sampleCourses: [
      { code: "IT101", name: "การเขียนโปรแกรมเบื้องต้น", credits: 3 },
      { code: "IT201", name: "โครงสร้างข้อมูลและอัลกอริทึม", credits: 3 },
      { code: "IT202", name: "ฐานข้อมูลและการออกแบบ", credits: 3 },
      { code: "IT301", name: "การพัฒนาเว็บแอปพลิเคชัน", credits: 3 },
      { code: "IT302", name: "เครือข่ายคอมพิวเตอร์", credits: 3 },
      { code: "IT303", name: "วิศวกรรมซอฟต์แวร์", credits: 3 },
      { code: "IT401", name: "ปัญญาประดิษฐ์", credits: 3 },
      { code: "IT402", name: "การพัฒนาแอปพลิเคชันมือถือ", credits: 3 },
      { code: "IT403", name: "วิทยาการข้อมูล", credits: 3 },
      { code: "IT490", name: "โครงงานทางเทคโนโลยีสารสนเทศ", credits: 6 },
    ],
    studyPlan: [
      {
        year: 1,
        semester: 1,
        courses: [
          { code: "GE101", name: "ภาษาไทยเพื่อการสื่อสาร", credits: 3 },
          { code: "GE102", name: "ภาษาอังกฤษ 1", credits: 3 },
          { code: "MA101", name: "คณิตศาสตร์ 1", credits: 3 },
          { code: "IT101", name: "การเขียนโปรแกรมเบื้องต้น", credits: 3 },
          { code: "IT102", name: "เทคโนโลยีสารสนเทศเบื้องต้น", credits: 3 },
          { code: "GE103", name: "พลศึกษา", credits: 1 },
        ],
      },
      {
        year: 1,
        semester: 2,
        courses: [
          { code: "GE104", name: "ภาษาอังกฤษ 2", credits: 3 },
          { code: "MA102", name: "คณิตศาสตร์ดีสครีต", credits: 3 },
          { code: "IT103", name: "การเขียนโปรแกรมเชิงวัตถุ", credits: 3 },
          { code: "IT104", name: "ระบบปฏิบัติการ", credits: 3 },
          { code: "GE105", name: "การคิดเชิงวิพากษ์", credits: 3 },
        ],
      },
      {
        year: 2,
        semester: 1,
        courses: [
          { code: "IT201", name: "โครงสร้างข้อมูลและอัลกอริทึม", credits: 3 },
          { code: "IT202", name: "ฐานข้อมูลและการออกแบบ", credits: 3 },
          { code: "IT203", name: "ระบบดิจิทัลและสถาปัตยกรรม", credits: 3 },
          { code: "ST201", name: "สถิติสำหรับนักไอที", credits: 3 },
          { code: "GE201", name: "ภาษาอังกฤษเชิงวิชาการ", credits: 3 },
        ],
      },
      {
        year: 2,
        semester: 2,
        courses: [
          { code: "IT204", name: "ฐานข้อมูลขั้นสูง", credits: 3 },
          { code: "IT205", name: "การวิเคราะห์ระบบ", credits: 3 },
          { code: "IT206", name: "โครงสร้างระบบเครือข่าย", credits: 3 },
          { code: "IT207", name: "การพัฒนาเว็บเบื้องต้น", credits: 3 },
          { code: "GE202", name: "ผู้ประกอบการรุ่นใหม่", credits: 3 },
        ],
      },
      {
        year: 3,
        semester: 1,
        courses: [
          { code: "IT301", name: "การพัฒนาเว็บแอปพลิเคชัน", credits: 3 },
          { code: "IT302", name: "เครือข่ายคอมพิวเตอร์", credits: 3 },
          { code: "IT303", name: "วิศวกรรมซอฟต์แวร์", credits: 3 },
          { code: "IT304", name: "การประมวลผลคลาวด์", credits: 3 },
          { code: "ITE301", name: "วิชาเอกเลือก 1", credits: 3 },
        ],
      },
      {
        year: 3,
        semester: 2,
        courses: [
          { code: "IT305", name: "ความมั่นคงปลอดภัยสารสนเทศ", credits: 3 },
          { code: "IT306", name: "การทดสอบซอฟต์แวร์", credits: 3 },
          { code: "IT307", name: "เตรียมโครงงาน", credits: 1 },
          { code: "ITE302", name: "วิชาเอกเลือก 2", credits: 3 },
          { code: "ITE303", name: "วิชาเอกเลือก 3", credits: 3 },
          { code: "GEN301", name: "เลือกเสรี 1", credits: 3 },
        ],
      },
      {
        year: 4,
        semester: 1,
        courses: [
          { code: "IT490", name: "โครงงานทางเทคโนโลยีสารสนเทศ", credits: 6 },
          { code: "IT401", name: "ปัญญาประดิษฐ์", credits: 3 },
          { code: "ITE401", name: "วิชาเอกเลือก 4", credits: 3 },
          { code: "GEN401", name: "เลือกเสรี 2", credits: 3 },
        ],
      },
      {
        year: 4,
        semester: 2,
        courses: [
          { code: "IT499", name: "สหกิจศึกษา / ฝึกงาน", credits: 7 },
        ],
      },
    ],
    careers: [
      "Software Developer / Engineer",
      "Web / Mobile App Developer",
      "Data Analyst / Data Engineer",
      "System Analyst",
      "Network Engineer",
      "Cloud Engineer",
      "IT Support / IT Consultant",
      "UX/UI Designer",
      "DevOps Engineer",
      "Cybersecurity Specialist",
    ],
    pdfUrl: "#", // mock link
  },
  {
    id: "p-master",
    level: "master",
    name: "วิทยาศาสตรมหาบัณฑิต สาขาวิชาเทคโนโลยีสารสนเทศ",
    nameEn: PROGRAM_DEGREE_NAMES.master.nameEn,
    degree: "วท.ม. (เทคโนโลยีสารสนเทศ)",
    degreeEn: PROGRAM_DEGREE_NAMES.master.degreeEn,
    duration: "2 ปี",
    credits: 39,
    overview:
      "หลักสูตรปริญญาโทที่มุ่งสร้างนักวิจัยและผู้เชี่ยวชาญด้านเทคโนโลยีสารสนเทศ พร้อมต่อยอดสู่อาชีพระดับสูง การเป็นผู้นำทีมเทคโนโลยี หรือการศึกษาต่อในระดับปริญญาเอก เปิดทั้งแผน ก (วิจัย) และแผน ข (วิชาชีพ) เรียนได้ทั้งภาคปกติและภาคพิเศษ (เสาร์-อาทิตย์)",
    highlights: [
      "เรียนได้ทั้งภาคปกติและภาคพิเศษเสาร์-อาทิตย์",
      "อาจารย์ที่ปรึกษาวิจัยมีผลงานตีพิมพ์ระดับนานาชาติ",
      "ทุนผู้ช่วยวิจัย/ผู้ช่วยสอนสำหรับนักศึกษาแผน ก",
      "มีความร่วมมือกับอุตสาหกรรมและงานวิจัยจริง",
    ],
    plans: [
      {
        name: "แผน ก แบบ ก2 (วิจัย)",
        description:
          "เน้นการทำวิทยานิพนธ์ 12 หน่วยกิต เหมาะกับผู้ที่ต้องการต่อยอดงานวิจัยและศึกษาต่อปริญญาเอก",
      },
      {
        name: "แผน ข (วิชาชีพ)",
        description:
          "เน้นการศึกษาค้นคว้าอิสระและรายวิชาเข้มข้น เหมาะกับผู้ทำงานที่ต้องการพัฒนาทักษะเชิงปฏิบัติ",
      },
    ],
    structure: [
      { category: "วิชาบังคับ", credits: 12 },
      { category: "วิชาเลือก (แผน ก ขั้นต่ำ 12 / แผน ข ขั้นต่ำ 18)", credits: 18 },
      { category: "วิทยานิพนธ์ (แผน ก) / การค้นคว้าอิสระ (แผน ข)", credits: 9 },
    ],
    sampleCourses: [
      { code: "ITM501", name: "ระเบียบวิธีวิจัยทางเทคโนโลยีสารสนเทศ", credits: 3 },
      { code: "ITM502", name: "การจัดการโครงการเทคโนโลยีสารสนเทศขั้นสูง", credits: 3 },
      { code: "ITM503", name: "ปัญญาประดิษฐ์ขั้นสูง", credits: 3 },
      { code: "ITM504", name: "วิทยาการข้อมูลขั้นสูง", credits: 3 },
      { code: "ITM505", name: "ระบบกระจายและคลาวด์", credits: 3 },
      { code: "ITM506", name: "การวิเคราะห์ข้อมูลขนาดใหญ่", credits: 3 },
      { code: "ITM507", name: "ความมั่นคงปลอดภัยไซเบอร์ขั้นสูง", credits: 3 },
      { code: "ITM599", name: "วิทยานิพนธ์", credits: 12 },
    ],
    careers: [
      "Senior Software Engineer / Tech Lead",
      "Data Scientist / ML Engineer",
      "IT Manager / CTO",
      "Researcher (Industry / Academia)",
      "อาจารย์ระดับอุดมศึกษา",
      "ที่ปรึกษาเทคโนโลยี",
    ],
    researchAreas: [
      "Artificial Intelligence & Machine Learning",
      "Big Data Analytics & Data Mining",
      "Internet of Things (IoT)",
      "Cybersecurity & Privacy",
      "Software Engineering",
      "Computer Vision & Image Processing",
      "Cloud & Distributed Computing",
      "Human-Computer Interaction",
    ],
    pdfUrl: "#",
  },
];

export const getProgram = (id: string) =>
  programsData.find((p) => p.id === id);

export const careerPaths = [
  {
    title: "Software Developer",
    description: "พัฒนาเว็บ/แอปพลิเคชันให้องค์กรชั้นนำ",
    icon: "Code2",
  },
  {
    title: "Data Analyst",
    description: "วิเคราะห์ข้อมูลธุรกิจสร้าง insight",
    icon: "BarChart3",
  },
  {
    title: "Network Engineer",
    description: "ออกแบบและดูแลระบบเครือข่ายองค์กร",
    icon: "Network",
  },
  {
    title: "UX/UI Designer",
    description: "ออกแบบประสบการณ์ผู้ใช้ที่ตอบโจทย์",
    icon: "Palette",
  },
  {
    title: "IT Support",
    description: "ดูแลและสนับสนุนระบบ IT ทั้งองค์กร",
    icon: "Headphones",
  },
  {
    title: "Project Coordinator",
    description: "บริหารโครงการเทคโนโลยีให้สำเร็จตามแผน",
    icon: "Kanban",
  },
  {
    title: "Cloud Engineer",
    description: "ออกแบบโครงสร้างพื้นฐานบน Cloud",
    icon: "Cloud",
  },
  {
    title: "Cybersecurity Specialist",
    description: "ปกป้องระบบและข้อมูลขององค์กร",
    icon: "ShieldCheck",
  },
];
