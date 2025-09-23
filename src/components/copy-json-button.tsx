"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyJsonButton({
  jsonUrl,
  label,
  successLabel,
}: {
  jsonUrl: string;
  label: string;
  successLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(jsonUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }}
    >
      {copied ? successLabel : label}
    </Button>
  );
}
