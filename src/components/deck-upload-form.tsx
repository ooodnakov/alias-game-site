"use client";

import HCaptcha from "@hcaptcha/react-hcaptcha";
import type { default as HCaptchaComponent } from "@hcaptcha/react-hcaptcha";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";

const uploadSchema = z.object({
  file: z.custom<FileList>((value) => {
    if (typeof FileList === "undefined") {
      return true;
    }
    return value instanceof FileList && value.length > 0;
  }, "required"),
  coverUrl: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.startsWith("https://"), {
      message: "cover",
    }),
});

type UploadSchema = z.infer<typeof uploadSchema>;
type UploadSchemaInput = z.input<typeof uploadSchema>;

type HCaptchaInstance = InstanceType<typeof HCaptchaComponent>;

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
    captcha?: {
      label: string;
      hint: string;
    };
    serverErrors: {
      captchaRequired: string;
      captchaFailed: string;
      rateLimit: string;
    };
  };
}

export function DeckUploadForm({ labels }: DeckUploadFormProps) {
  const captchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const isCaptchaEnabled = Boolean(captchaSiteKey);
  const captchaRef = useRef<HCaptchaInstance | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<UploadSchemaInput>({
    resolver: zodResolver(uploadSchema),
  });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successStatus, setSuccessStatus] = useState<"pending" | "published" | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  const resetCaptcha = () => {
    if (captchaRef.current) {
      captchaRef.current.resetCaptcha();
    }
    setCaptchaToken(null);
  };

  const onSubmit = async (data: UploadSchemaInput) => {
    const parsed: UploadSchema = uploadSchema.parse(data);
    const file = parsed.file.item(0);
    if (!file) {
      setErrorMessage(labels.validation.required);
      setStatus("error");
      setSuccessStatus(null);
      return;
    }

    if (isCaptchaEnabled && !captchaToken) {
      const message = labels.serverErrors.captchaRequired;
      setCaptchaError(message);
      setErrorMessage(message);
      setStatus("error");
      setSuccessStatus(null);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    if (parsed.coverUrl) {
      formData.append("coverUrl", parsed.coverUrl);
    }
    if (captchaToken) {
      formData.append("captchaToken", captchaToken);
    }

    setCaptchaError(null);

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.message;
        let translated = labels.error;
        if (message === "Invalid JSON") {
          translated = labels.validation.invalidJson;
        } else if (message === "Deck JSON failed validation") {
          translated = labels.validation.schema;
        } else if (message === "File missing") {
          translated = labels.validation.required;
        } else if (message === "File too large" || message === "Deck too large") {
          translated = labels.error;
        } else if (message === "Captcha required") {
          translated = labels.serverErrors.captchaRequired;
          setCaptchaError(translated);
          resetCaptcha();
        } else if (message === "Captcha verification failed") {
          translated = labels.serverErrors.captchaFailed;
          setCaptchaError(translated);
          resetCaptcha();
        } else if (message === "Rate limit exceeded") {
          translated = labels.serverErrors.rateLimit;
        }
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
      setCaptchaError(null);
      resetCaptcha();
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
      {isCaptchaEnabled ? (
        <div className="flex flex-col gap-2 text-sm text-foreground/80">
          {labels.captcha?.label ? (
            <span className="font-medium">{labels.captcha.label}</span>
          ) : null}
          <div className="rounded-3xl border border-border/60 bg-surface px-4 py-4">
            <HCaptcha
              ref={captchaRef}
              sitekey={captchaSiteKey as string}
              onVerify={(token) => {
                setCaptchaToken(token);
                setCaptchaError(null);
              }}
              onExpire={() => {
                setCaptchaToken(null);
              }}
              onClose={() => {
                setCaptchaToken(null);
              }}
              onError={() => {
                setCaptchaError(labels.serverErrors.captchaFailed);
                setCaptchaToken(null);
                if (captchaRef.current) {
                  captchaRef.current.resetCaptcha();
                }
              }}
            />
          </div>
          {labels.captcha?.hint ? (
            <p className="text-xs text-foreground/60">{labels.captcha.hint}</p>
          ) : null}
          {captchaError ? <p className="text-xs text-rose-600">{captchaError}</p> : null}
        </div>
      ) : null}
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
