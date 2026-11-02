"use client";

import React, { useRef, useEffect } from "react";
import { useChatBot } from "@/hooks/useChatBot";
import { ChatFloatingButton } from "@/components/chat/ChatFloatingButton";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessageItem } from "@/components/chat/ChatMessageItem";
import { ChatQuickChips } from "@/components/chat/ChatQuickChips";
import { ChatInput } from "@/components/chat/ChatInput";
import { Sparkles } from "lucide-react";

/**
 * ChatWidget Component
 * Single Responsibility: Root view assembling floating launcher button and chat window.
 */
export function ChatWidget() {
  const {
    isOpen,
    toggleChat,
    closeChat,
    messages,
    loading,
    unreadCount,
    sendMessage,
    clearChat,
  } = useChatBot();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, isOpen]);

  return (
    <>
      {/* Floating launcher trigger button */}
      <ChatFloatingButton
        isOpen={isOpen}
        onClick={toggleChat}
        unreadCount={unreadCount}
      />

      {/* Floating Chat Modal Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[390px] h-[580px] max-h-[85vh] flex flex-col bg-neutral-950/95 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <ChatHeader onClose={closeChat} onClear={clearChat} />

          {/* Scrollable Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                onSelectProduct={closeChat}
              />
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-center gap-2 text-neutral-400 text-xs py-2 px-1">
                <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700/80 flex items-center justify-center text-amber-300">
                  <Sparkles size={11} className="animate-spin" />
                </div>
                <div className="flex gap-1 items-center bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Quick Chips */}
          <ChatQuickChips onSelectChip={sendMessage} disabled={loading} />

          {/* Bottom Message Input Form */}
          <ChatInput onSendMessage={sendMessage} loading={loading} />
        </div>
      )}
    </>
  );
}

export default ChatWidget;

