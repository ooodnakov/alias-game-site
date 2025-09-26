"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const RESET_DELAY_MS = 2500;

export async function copyJsonToClipboard(jsonUrl: string): Promise<boolean> {
  try {
    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      throw new Error("Clipboard API unavailable");
    }

    await navigator.clipboard.writeText(jsonUrl);
    return true;
  } catch (error) {
    if (typeof window !== "undefined" && typeof window.prompt === "function") {
      // eslint-disable-next-line no-alert -- Provide a manual copy fallback when clipboard access is unavailable.
      window.prompt("Copy the JSON URL below:", jsonUrl);
    }

    return false;
  }
}

export function CopyJsonButton({
  jsonUrl,
  label,
  successLabel,
}: {
  jsonUrl: string;
  label: string;
  successLabel: string;
}) {
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        const didCopy = await copyJsonToClipboard(jsonUrl);

        setCopyState(didCopy ? "success" : "error");

        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }

        resetTimeoutRef.current = setTimeout(() => {
          setCopyState("idle");
          resetTimeoutRef.current = undefined;
        }, RESET_DELAY_MS);
      }}
    >
      {copyState === "success"
        ? successLabel
        : copyState === "error"
          ? "Copy failed. Copy manually."
          : label}
    </Button>
  );
}
