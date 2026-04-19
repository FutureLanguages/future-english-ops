"use client";

import { useEffect, useState } from "react";

export function AutoDismissToast({
  message,
  tone = "success",
}: {
  message: string;
  tone?: "success" | "error";
}) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
    const timeout = window.setTimeout(() => setVisible(false), 3600);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-24 left-4 z-50 max-w-sm rounded-2xl px-4 py-3 text-sm font-semibold shadow-soft md:bottom-6 ${
        tone === "success" ? "bg-[#e9f7ee] text-[#1b7a43]" : "bg-[#ffe8e8] text-[#a03232]"
      }`}
    >
      {message}
    </div>
  );
}
