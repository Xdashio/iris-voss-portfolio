import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackPage } from "@/components/storefront/TrackPage";

export const metadata: Metadata = { title: "Track an order" };
export default function Page() { return <Suspense><TrackPage /></Suspense>; }
