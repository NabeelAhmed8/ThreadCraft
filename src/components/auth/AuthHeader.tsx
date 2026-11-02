import React from "react";
import Link from "next/link";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
  badge?: string;
}

/**
 * AuthHeader Component
 * Single Responsibility: Display branded title, subtitle, and badge in auth cards.
 */
export function AuthHeader({
  title,
  subtitle,
  badge = "STUDIO • ACCOUNT",
}: AuthHeaderProps) {
  return (
    <div className="text-center">
      <Link href="/" className="inline-block group mb-3">
        <span className="font-serif text-2xl font-bold tracking-tight text-neutral-950 block">
          THREADCRAFT
        </span>
        <span className="text-[10px] tracking-[0.28em] text-neutral-400 uppercase font-mono">
          {badge}
        </span>
      </Link>
      <h1 className="font-serif text-2xl font-semibold text-neutral-900 mt-2">
        {title}
      </h1>
      <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
        {subtitle}
      </p>
    </div>
  );
}

