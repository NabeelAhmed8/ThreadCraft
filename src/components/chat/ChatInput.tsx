"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  loading: boolean;
}

/**
 * ChatInput Component
 * Single Responsibility: Presentational message input field and send triggers.
 */
export function ChatInput({ onSendMessage, loading }: ChatInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    onSendMessage(trimmed);
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2 rounded-b-2xl"
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about outfits, size guide, orders..."
        disabled={loading}
        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        className="p-2.5 bg-white text-black hover:bg-neutral-200 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
        title="Send Message"
        aria-label="Send Message"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
      </button>
    </form>
  );
}

