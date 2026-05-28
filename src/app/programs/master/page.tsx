import type { Metadata } from "next";
import MasterProgramPage from "@/frontend/public/programs/MasterProgramPage";

export const metadata: Metadata = {
  title: "หลักสูตรปริญญาโท",
  description: "หลักสูตรปริญญาโท สาขาเทคโนโลยีสารสนเทศ มทร.ธัญบุรี",
};
export const dynamic = "force-dynamic";
export default MasterProgramPage;
