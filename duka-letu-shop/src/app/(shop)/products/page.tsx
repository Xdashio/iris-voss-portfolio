import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductListing } from "@/components/storefront/ProductListing";
import { ProductGridSkeleton } from "@/components/storefront/ProductCard";

export const metadata: Metadata = { title: "All products" };

export default function Page() {
  return (
    <Suspense fallback={<div className="container-page pt-8"><ProductGridSkeleton /></div>}>
      <ProductListing />
    </Suspense>
  );
}
