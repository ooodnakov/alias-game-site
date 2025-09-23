import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DeckUploadForm } from "@/components/deck-upload-form";
import type { AppLocale } from "@/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: { locale: AppLocale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "meta" });
  const title = t("upload.title");
  const description = t("upload.description");
  const path = `/${params.locale}/decks/upload`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: path,
      images: [`/${params.locale}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/${params.locale}/twitter-image`],
    },
    alternates: {
      canonical: path,
    },
  };
}

export default async function DeckUploadPage() {
  const t = await getTranslations("upload");
  const captchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;

  return (
    <div className="bg-surface-muted/40 py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-foreground/70">{t("intro")}</p>
        </div>
        <DeckUploadForm
          labels={{
            jsonLabel: t("jsonLabel"),
            jsonHint: t("jsonHint"),
            coverLabel: t("coverLabel"),
            coverHint: t("coverHint"),
            submit: t("submit"),
            successPending: t("successPending"),
            successPublished: t("successPublished"),
            error: t("error"),
            validation: {
              required: t("validation.required"),
              invalidJson: t("validation.invalidJson"),
              schema: t("validation.schema"),
            },
            captcha: captchaSiteKey
              ? {
                  label: t("captchaLabel"),
                  hint: t("captchaHint"),
                }
              : undefined,
            serverErrors: {
              captchaRequired: t("serverErrors.captchaRequired"),
              captchaFailed: t("serverErrors.captchaFailed"),
              rateLimit: t("serverErrors.rateLimit"),
            },
          }}
        />
      </div>
    </div>
  );
}
