"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const uploadSchema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files?.length, "required")
    .transform((files) => files?.item(0) ?? null),
  coverUrl: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.startsWith("https://"), {
      message: "cover",
    }),
});

type UploadSchema = z.infer<typeof uploadSchema>;

interface DeckUploadFormProps {
  labels: {
    jsonLabel: string;
    jsonHint: string;
    coverLabel: string;
    coverHint: string;
    submit: string;
    successPending: string;
    successPublished: string;
    error: string;
    validation: {
      required: string;
      invalidJson: string;
      schema: string;
    };
  };
}

export function DeckUploadForm({ labels }: DeckUploadFormProps) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<UploadSchema>({
    resolver: zodResolver(uploadSchema),
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<"pending" | "published" | null>(null);

  const onSubmit = async (data: UploadSchema) => {
    const file = data.file;
    if (!file) {
      setErrorMessage(labels.validation.required);
      setStatus("error");
      setSuccessStatus(null);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (data.coverUrl) {
      formData.append("coverUrl", data.coverUrl);
    }

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.message;
        const translated =
          message === "Invalid JSON"
            ? labels.validation.invalidJson
            : message === "Deck JSON failed validation"
            ? labels.validation.schema
            : message === "File missing"
            ? labels.validation.required
            : message === "File too large"
            ? labels.error
            : message === "Deck too large"
            ? labels.error
            : labels.error;
        setErrorMessage(translated);
        setStatus("error");
        setSuccessStatus(null);
        return;
      }

      const payload = await response.json().catch(() => null);
      const returnedStatus =
        payload && typeof payload.status === "string" && payload.status === "published"
          ? "published"
          : "pending";
      setStatus("success");
      setErrorMessage(null);
      setSuccessStatus(returnedStatus);
      reset();
    } catch {
      setStatus("error");
      setErrorMessage(labels.error);
      setSuccessStatus(null);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm"
    >
      <div className="flex flex-col gap-2 text-sm text-foreground/80">
        <label className="font-medium" htmlFor="deck-file">
          {labels.jsonLabel}
        </label>
        <input
          id="deck-file"
          type="file"
          accept="application/json"
          {...register("file")}
          className="rounded-3xl border border-border/60 bg-surface px-4 py-3 text-sm text-foreground shadow-inner"
        />
        <p className="text-xs text-foreground/60">{labels.jsonHint}</p>
        {errors.file ? (
          <p className="text-xs text-rose-600">{labels.validation.required}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2 text-sm text-foreground/80">
        <label className="font-medium" htmlFor="cover-url">
          {labels.coverLabel}
        </label>
        <input
          id="cover-url"
          type="url"
          placeholder="https://example.com/cover.jpg"
          {...register("coverUrl")}
          className="rounded-3xl border border-border/60 bg-surface px-4 py-3 text-sm text-foreground shadow-inner"
        />
        <p className="text-xs text-foreground/60">{labels.coverHint}</p>
        {errors.coverUrl ? (
          <p className="text-xs text-rose-600">{labels.validation.schema}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {labels.submit}
      </Button>
      {status === "success" ? (
        <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">
          {successStatus === "published" ? labels.successPublished : labels.successPending}
        </p>
      ) : null}
      {status === "error" ? (
        <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">
          {errorMessage ?? labels.error}
        </p>
      ) : null}
    </form>
  );
}
