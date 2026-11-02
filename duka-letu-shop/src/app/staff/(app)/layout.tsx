import type { Metadata } from "next";
import { StaffShell } from "@/components/staff/StaffShell";

export const metadata: Metadata = { title: { default: "Staff", template: "%s · Staff · Duka Letu" } };
export default function Layout({ children }: { children: React.ReactNode }) { return <StaffShell>{children}</StaffShell>; }
