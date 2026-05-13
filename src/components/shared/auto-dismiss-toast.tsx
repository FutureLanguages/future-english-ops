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
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => setVisible(false), 3600);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`fixed bottom-24 start-4 z-50 max-w-sm rounded-card border px-4 py-3 text-body font-bold shadow-card tablet:bottom-6 ${
        tone === "success"
          ? "border-success-100 bg-success-100 text-success-700"
          : "border-error-100 bg-error-100 text-error-600"
      }`}
    >
      {message}
    </div>
  );
}
