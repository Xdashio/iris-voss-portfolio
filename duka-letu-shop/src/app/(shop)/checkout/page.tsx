import type { Metadata } from "next";
import { CheckoutPage } from "@/components/storefront/CheckoutPage";

export const metadata: Metadata = { title: "Checkout" };
export default function Page() { return <CheckoutPage />; }
