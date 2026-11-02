import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPage } from "@/components/staff/LoginPage";

export const metadata: Metadata = { title: "Staff sign in" };
export default function Page() { return <Suspense><LoginPage /></Suspense>; }
