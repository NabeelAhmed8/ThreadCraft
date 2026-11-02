"use client";

import React from "react";
import { Sparkles, Trash2, X } from "lucide-react";

interface ChatHeaderProps {
  onClose: () => void;
  onClear: () => void;
}

/**
 * ChatHeader Component
 * Single Responsibility: Header controls & online concierge status for the chat window.
 */
export function ChatHeader({ onClose, onClear }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-neutral-950 border-b border-neutral-800 text-white rounded-t-2xl">
      <div className="flex items-center gap-2.5">
        <div className="relative w-8 h-8 rounded-full bg-neutral-900 border border-neutral-700/80 flex items-center justify-center text-white">
          <Sparkles size={15} className="text-amber-300" />
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold tracking-wider uppercase font-mono">
              ThreadCraft Concierge
            </h4>
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
          <p className="text-[10px] text-neutral-400 font-sans">
            Personal Stylist & Client Advisor
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onClear}
          className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800/80 transition"
          title="Clear Conversation"
          aria-label="Clear Conversation"
        >
          <Trash2 size={14} />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/80 transition"
          title="Close Chat"
          aria-label="Close Chat"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
