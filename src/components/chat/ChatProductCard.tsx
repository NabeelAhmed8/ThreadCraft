"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ChatProduct } from "@/types/chat";

interface ChatProductCardProps {
  product: ChatProduct;
  onSelect?: () => void;
}

/**
 * ChatProductCard Component
 * Single Responsibility: Display an interactive product card inside chat messages.
 */
export function ChatProductCard({ product, onSelect }: ChatProductCardProps) {
  return (
    <div className="flex items-center gap-3 p-2 bg-neutral-900/50 hover:bg-neutral-800/80 border border-neutral-700/60 rounded-xl transition duration-150 group">
      <div className="relative w-12 h-14 bg-neutral-800 rounded-lg overflow-hidden shrink-0">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="48px"
          className="object-cover group-hover:scale-105 transition-transform"
        />
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono block">
          {product.category}
        </span>
        <h5 className="text-xs font-medium text-white truncate">
          {product.name}
        </h5>
        <span className="text-xs font-mono font-semibold text-neutral-200">
          ${product.price}
        </span>
      </div>

      <Link
        href={`/product/${product.id}`}
        onClick={onSelect}
        className="p-1.5 bg-white text-black hover:bg-neutral-200 rounded-lg shrink-0 transition"
        title="View Garment"
        aria-label={`View ${product.name}`}
      >
        <ArrowUpRight size={14} />
      </Link>
    </div>
  );
}

