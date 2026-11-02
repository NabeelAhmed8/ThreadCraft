import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface AuthAlertProps {
  type: "error" | "success";
  message: string | null;
}

/**
 * AuthAlert Component
 * Single Responsibility: Display error and success alert notifications.
 */
export function AuthAlert({ type, message }: AuthAlertProps) {
  if (!message) return null;

  const isError = type === "error";

  return (
    <div
      role="alert"
      className={`p-3.5 border rounded-lg flex items-center gap-2.5 text-xs ${
        isError
          ? "bg-red-50 border-red-200 text-red-700"
          : "bg-green-50 border-green-200 text-green-700"
      }`}
    >
      {isError ? (
        <AlertCircle size={16} className="shrink-0" />
      ) : (
        <CheckCircle2 size={16} className="shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

