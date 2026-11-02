"use client";

import React from "react";
import { Sparkles, Ruler, Package, RotateCcw, Truck } from "lucide-react";

interface QuickChip {
  id: string;
  label: string;
  query: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const QUICK_CHIPS: QuickChip[] = [
  {
    id: "outfit",
    label: "Outfit Ideas",
    query: "Can you recommend a stylish minimalist outfit for a casual weekend?",
    icon: Sparkles,
  },
  {
    id: "size",
    label: "Size Guide",
    query: "How do your sizes fit? What size should I get if I wear Medium?",
    icon: Ruler,
  },
  {
    id: "tracking",
    label: "Track Order",
    query: "How can I track my recent wardrobe order?",
    icon: Package,
  },
  {
    id: "returns",
    label: "Return Policy",
    query: "What is ThreadCraft's return and exchange policy?",
    icon: RotateCcw,
  },
  {
    id: "shipping",
    label: "Shipping & COD",
    query: "Do you offer Cash on Delivery and free shipping?",
    icon: Truck,
  },
];

interface ChatQuickChipsProps {
  onSelectChip: (query: string) => void;
  disabled?: boolean;
}

/**
 * ChatQuickChips Component
 * Single Responsibility: Display clickable prompt suggestion pills.
 */
export function ChatQuickChips({ onSelectChip, disabled }: ChatQuickChipsProps) {
  return (
    <div className="p-3 border-t border-neutral-800/80 bg-neutral-950/60 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 w-max">
        {QUICK_CHIPS.map((chip) => {
          const Icon = chip.icon;
          return (
            <button
              key={chip.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectChip(chip.query)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] text-neutral-300 hover:text-white transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon size={12} className="text-neutral-400" />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

