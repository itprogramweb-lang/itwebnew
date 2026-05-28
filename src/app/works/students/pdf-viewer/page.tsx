import type { Metadata } from "next";
import StudentWorkPdfViewerPage from "@/frontend/public/works/StudentWorkPdfViewerPage";

type Props = {
  searchParams: {
    file?: string;
    title?: string;
    filename?: string;
  };
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "เปิดดู PDF ผลงานนักศึกษา",
  description: "เปิดดูไฟล์ PDF ผลงานนักศึกษาภายในเว็บไซต์",
};

export default function Page({ searchParams }: Props) {
  return <StudentWorkPdfViewerPage searchParams={searchParams} />;
}
