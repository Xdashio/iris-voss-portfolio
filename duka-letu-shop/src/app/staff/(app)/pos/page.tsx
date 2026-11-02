import type { Metadata } from "next";
import { PosPage } from "@/components/staff/PosPage";

export const metadata: Metadata = { title: "Point of sale" };
export default function Page() { return <PosPage />; }
