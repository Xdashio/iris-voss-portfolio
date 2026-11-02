import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderPage } from "@/components/storefront/OrderPage";

export const metadata: Metadata = { title: "Your order" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Suspense><OrderPage id={id} /></Suspense>;
}
