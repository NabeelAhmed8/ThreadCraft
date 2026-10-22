import React from "react";

export function ProductSkeleton() {
  return (
    <div className="group animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full aspect-3/4 bg-neutral-200 rounded-md overflow-hidden relative" />
      {/* Content Skeleton */}
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-neutral-200 rounded w-1/3" />
        <div className="h-4 bg-neutral-200 rounded w-3/4" />
        <div className="h-4 bg-neutral-200 rounded w-1/4 mt-2" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
}
