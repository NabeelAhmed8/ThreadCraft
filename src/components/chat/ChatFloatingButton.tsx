"use client";

import React from "react";
import { Sparkles, MessageSquare } from "lucide-react";

interface ChatFloatingButtonProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}

/**
 * ChatFloatingButton Component
 * Single Responsibility: Fixed floating action button to toggle chat drawer with modern glassmorphism.
 */
export function ChatFloatingButton({
  isOpen,
  onClick,
  unreadCount = 0,
}: ChatFloatingButtonProps) {
  if (isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 group">
      {/* Tooltip hint on hover */}
      <div className="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-neutral-950 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap border border-neutral-800">
          Chat with Stylist
        </div>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-neutral-950 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-neutral-700/60 ring-4 ring-neutral-900/10 focus:outline-none"
        aria-label="Open Studio Concierge Chat"
      >
        <Sparkles size={22} className="text-amber-300 animate-pulse" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}

