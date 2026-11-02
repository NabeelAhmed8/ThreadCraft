"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatMessage } from "@/types/chat";

const STORAGE_KEY = "threadcraft_chat_history_v2";

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome-msg",
  role: "assistant",
  content:
    "Hello! Welcome to **ThreadCraft Studio**.\n\nI am your **Personal Stylist & Client Advisor**. How may I assist you today?\n\n* Outfit & capsule wardrobe recommendations\n* Exact size & fit measurements\n* Order tracking & delivery status\n* Store shipping & returns policy",
  timestamp: "Just now",
};

/**
 * useChatBot Hook
 * Single Responsibility: Manages chat messages state, API communication, and session caching.
 */
export function useChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load chat history from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Storage unavailable or disabled
    }
  }, []);

  // Save to localStorage whenever messages update
  const saveMessages = useCallback((updated: ChatMessage[]) => {
    setMessages(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setUnreadCount(0);
      return !prev;
    });
  }, []);

  const clearChat = useCallback(() => {
    saveMessages([INITIAL_MESSAGE]);
  }, [saveMessages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedWithUser = [...messages, userMessage];
    saveMessages(updatedWithUser);
    setLoading(true);

    try {
      // Format history (excluding initial welcome message)
      const apiHistory = updatedWithUser
        .filter((m) => m.id !== "welcome-msg")
        .slice(-8)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: apiHistory.slice(0, -1),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate AI response.");
      }

      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        products: data.products || [],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const finalMessages = [...updatedWithUser, botMessage];
      saveMessages(finalMessages);

      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch (err: unknown) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          err instanceof Error
            ? `I encountered an issue: ${err.message}. Please try again.`
            : "Sorry, I encountered a temporary connection issue. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      saveMessages([...updatedWithUser, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return {
    isOpen,
    openChat,
    closeChat,
    toggleChat,
    messages,
    loading,
    unreadCount,
    sendMessage,
    clearChat,
  };
}

