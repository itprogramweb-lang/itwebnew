export const STUDENT_WORK_TYPE_COURSE = "course";
export const STUDENT_WORK_TYPE_FINAL_PROJECT = "final_project";
export const STUDENT_WORK_TYPE_COMPETITION = "competition";

export const STUDENT_WORK_TYPE_LABELS = {
  [STUDENT_WORK_TYPE_COURSE]: "ผลงานรายวิชา",
  [STUDENT_WORK_TYPE_FINAL_PROJECT]: "ปริญญานิพนธ์ (Thesis)",
  [STUDENT_WORK_TYPE_COMPETITION]: "ประกวด / แข่งขัน / นำเสนอผลงาน",
} as const;

export type StudentWorkType = keyof typeof STUDENT_WORK_TYPE_LABELS;

export const STUDENT_WORK_TYPE_OPTIONS: { value: StudentWorkType; label: string }[] = [
  { value: STUDENT_WORK_TYPE_COURSE, label: STUDENT_WORK_TYPE_LABELS.course },
  {
    value: STUDENT_WORK_TYPE_FINAL_PROJECT,
    label: STUDENT_WORK_TYPE_LABELS.final_project,
  },
  {
    value: STUDENT_WORK_TYPE_COMPETITION,
    label: STUDENT_WORK_TYPE_LABELS.competition,
  },
];

export function isStudentWorkType(value: unknown): value is StudentWorkType {
  return (
    value === STUDENT_WORK_TYPE_COURSE ||
    value === STUDENT_WORK_TYPE_FINAL_PROJECT ||
    value === STUDENT_WORK_TYPE_COMPETITION
  );
}

export function normalizeStudentWorkType(value: unknown): StudentWorkType {
  return isStudentWorkType(value) ? value : STUDENT_WORK_TYPE_FINAL_PROJECT;
}

export function getStudentWorkTypeLabel(value: unknown) {
  return STUDENT_WORK_TYPE_LABELS[normalizeStudentWorkType(value)];
}

export function isCourseStudentWork(value: unknown) {
  return value === STUDENT_WORK_TYPE_COURSE;
}

export function isFinalProjectStudentWork(value: unknown) {
  return value === STUDENT_WORK_TYPE_FINAL_PROJECT || value === null || value === undefined;
}

