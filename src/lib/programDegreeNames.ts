export const PROGRAM_DEGREE_NAMES = {
  bachelor: {
    nameEn: "Bachelor of Science (Information Technology and Digital Communication)",
    degreeEn: "B.Sc. (Information Technology and Digital Communication)",
  },
  master: {
    nameEn: "Master of Science (Data and Information Science)",
    degreeEn: "M.Sc. (Data and Information Science)",
  },
} as const;

const programEnglishNameReplacements: [string, string][] = [
  [
    "Bachelor of Science in Information Technology",
    PROGRAM_DEGREE_NAMES.bachelor.nameEn,
  ],
  ["B.Sc. Information Technology", PROGRAM_DEGREE_NAMES.bachelor.degreeEn],
  [
    "Bachelor of Science (Information Technology)",
    PROGRAM_DEGREE_NAMES.bachelor.nameEn,
  ],
  ["B.Sc. (Information Technology)", PROGRAM_DEGREE_NAMES.bachelor.degreeEn],
  [
    "Master of Science in Information Technology",
    PROGRAM_DEGREE_NAMES.master.nameEn,
  ],
  ["M.Sc. Information Technology", PROGRAM_DEGREE_NAMES.master.degreeEn],
  [
    "Master of Science (Information Technology)",
    PROGRAM_DEGREE_NAMES.master.nameEn,
  ],
  ["M.Sc. (Information Technology)", PROGRAM_DEGREE_NAMES.master.degreeEn],
];

export function normalizeProgramEnglishNames(value: string): string;
export function normalizeProgramEnglishNames(value: string | null): string | null;
export function normalizeProgramEnglishNames(value: null | undefined): null | undefined;
export function normalizeProgramEnglishNames(value: string | null | undefined) {
  if (!value) return value;

  const replaced = programEnglishNameReplacements.reduce(
    (current, [from, to]) => current.replaceAll(from, to),
    value
  );

  return replaced
    .replace(
      /Bachelor of Science(?: Program)?(?:\s+in|\s*\()\s*Information Technology and Digital Communication\)?/g,
      PROGRAM_DEGREE_NAMES.bachelor.nameEn
    )
    .replace(
      /Master of Science(?: Program)?(?:\s+in|\s*\()\s*Data and\s+Information Science\)?/g,
      PROGRAM_DEGREE_NAMES.master.nameEn
    );
}
