"use client";

import Link from "next/link";
import { Suspense } from "react";
import { FolderX } from "lucide-react";
import { useApp } from "@/hooks/useApp";
import { ProductListing } from "./ProductListing";
import { ProductGridSkeleton } from "./ProductCard";
import { EmptyState } from "../shared/ui";

export function CategoryPage({ slug }: { slug: string }) {
  const snap = useApp();
  if (!snap) return <div className="container-page pt-8"><div className="skeleton mb-6 h-9 w-56 rounded-xs" /><ProductGridSkeleton /></div>;
  const category = snap.data.categories.find((c) => c.slug === slug);
  if (!category) {
    return (
      <div className="container-page">
        <EmptyState icon={<FolderX />} title="Category not found" body="This category doesn't exist or has been renamed."
          action={<Link href="/products" className="inline-flex h-10 items-center rounded-sm bg-brand-600 px-4 text-sm font-semibold text-white">Browse all products</Link>} />
        <h1 className="sr-only">Category not found</h1>
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="container-page pt-8"><ProductGridSkeleton /></div>}>
      <ProductListing category={category} />
    </Suspense>
  );
}
