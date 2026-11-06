"use client";

import React from "react";
import { RefreshCw, PackageSearch, AlertCircle } from "lucide-react";

interface BackendStatusAlertProps {
  error?: string;
  onRetry?: () => void;
  message?: string;
}

export default function BackendStatusAlert({
  error,
  onRetry,
  message,
}: BackendStatusAlertProps) {
  return (
    <div className="border border-neutral-200 bg-neutral-50/70 rounded-xl p-8 text-center max-w-md mx-auto my-12 shadow-xs">
      <div className="w-12 h-12 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center mx-auto mb-4">
        {error ? <AlertCircle size={22} /> : <PackageSearch size={22} />}
      </div>

      <h3 className="text-base font-semibold text-neutral-900 tracking-tight">
        {error ? "Unable to load products" : (message || "No Products Found")}
      </h3>

      {error && (
        <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
          {error}
        </p>
      )}

      {onRetry && (
        <div className="mt-5">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-neutral-950 text-white text-xs font-medium uppercase tracking-wider px-5 py-2.5 rounded hover:bg-neutral-800 transition"
          >
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}
    </div>
  );
}

