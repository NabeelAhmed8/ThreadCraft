"use client";

import React from "react";
import { Sparkles, User } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { ChatProductCard } from "@/components/chat/ChatProductCard";

interface ChatMessageItemProps {
  message: ChatMessage;
  onSelectProduct?: () => void;
}

/**
 * Format markdown bold text (**text**) and line breaks cleanly
 */
function FormattedText({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-xs leading-relaxed">
      {lines.map((line, idx) => {
        if (!line.trim()) return <div key={idx} className="h-1" />;

        // Format bullet points
        const isBullet = line.trim().startsWith("* ") || line.trim().startsWith("- ");
        const cleaned = isBullet ? line.trim().substring(2) : line;

        // Parse **bold** parts
        const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);

        const rendered = parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-semibold text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        });

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-neutral-500 font-bold">&bull;</span>
              <span>{rendered}</span>
            </div>
          );
        }

        return <p key={idx}>{rendered}</p>;
      })}
    </div>
  );
}

/**
 * ChatMessageItem Component
 * Single Responsibility: Renders a user or assistant message with appropriate styling and attachments.
 */
export function ChatMessageItem({ message, onSelectProduct }: ChatMessageItemProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-neutral-900 border border-neutral-700/80 flex items-center justify-center shrink-0 mt-0.5 text-amber-300">
          <Sparkles size={12} />
        </div>
      )}

      <div className={`max-w-[85%] space-y-2`}>
        <div
          className={`px-3.5 py-2.5 rounded-2xl ${
            isUser
              ? "bg-white text-neutral-900 rounded-tr-xs ml-auto"
              : "bg-neutral-900/90 text-neutral-200 border border-neutral-800 rounded-tl-xs shadow-xs"
          }`}
        >
          <FormattedText content={message.content} />

          <div
            className={`text-[9px] mt-1 font-mono ${
              isUser ? "text-neutral-500 text-right" : "text-neutral-500"
            }`}
          >
            {message.timestamp}
          </div>
        </div>

        {/* Attached Interactive Product Cards */}
        {message.products && message.products.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block px-1">
              Recommended Garments:
            </span>
            <div className="grid gap-1.5">
              {message.products.map((product) => (
                <ChatProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 flex items-center justify-center shrink-0 mt-0.5">
          <User size={12} />
        </div>
      )}
    </div>
  );
}

