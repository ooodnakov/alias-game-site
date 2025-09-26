"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const RESET_DELAY_MS = 2500;

export async function copyJsonToClipboard(jsonUrl: string): Promise<boolean> {
  try {
    const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
    const writeText = clipboard?.writeText;

    if (typeof writeText !== "function") {
      throw new Error("Clipboard API unavailable");
    }

    await writeText(jsonUrl);
    return true;
  } catch {
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
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualCopyRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (copyState === "error" && manualCopyRef.current) {
      manualCopyRef.current.focus();
      manualCopyRef.current.select();
    }
  }, [copyState]);

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={async () => {
          const didCopy = await copyJsonToClipboard(jsonUrl);

          if (didCopy) {
            setCopyState("success");

            if (resetTimeoutRef.current) {
              clearTimeout(resetTimeoutRef.current);
            }

            resetTimeoutRef.current = setTimeout(() => {
              setCopyState("idle");
              resetTimeoutRef.current = null;
            }, RESET_DELAY_MS);
          } else {
            if (resetTimeoutRef.current) {
              clearTimeout(resetTimeoutRef.current);
              resetTimeoutRef.current = null;
            }

            setCopyState("error");
          }
        }}
      >
        {copyState === "success" ? successLabel : label}
      </Button>

      <div aria-live="polite" className="sr-only">
        {copyState === "success"
          ? "JSON URL copied to clipboard"
          : copyState === "error"
            ? "Copy failed. Use the manual copy field."
            : undefined}
      </div>

      {copyState === "error" ? (
        <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
          <p className="font-medium text-foreground">Copy manually</p>
          <p className="mt-1 text-muted-foreground">
            Clipboard access was blocked. Select and copy the JSON URL below.
          </p>
          <textarea
            ref={manualCopyRef}
            readOnly
            value={jsonUrl}
            className="mt-2 h-24 w-full resize-none rounded border border-border bg-background p-2 font-mono text-xs"
            aria-label="JSON URL to copy manually"
          />
        </div>
      ) : null}
    </div>
  );
}
