import type { Metadata } from "next";
import { TeamPage } from "@/components/staff/TeamPage";

export const metadata: Metadata = { title: "Staff" };
export default function Page() { return <TeamPage />; }
