import type { Metadata } from "next";
import { DashboardPage } from "@/components/staff/DashboardPage";

export const metadata: Metadata = { title: "Dashboard" };
export default function Page() { return <DashboardPage />; }
