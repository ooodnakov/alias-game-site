import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminDeckModeration } from "@/components/admin-deck-moderation";
import type { AppLocale } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { locale: AppLocale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: "meta" });
  const title = t("admin.title");
  const description = t("admin.description");
  const path = `/${params.locale}/admin/decks`;

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

export default async function AdminDecksPage() {
  const t = await getTranslations("admin");
  const decksT = await getTranslations("decks");

  return (
    <div className="bg-surface-muted/40 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-foreground/70">{t("intro")}</p>
        </div>
        <AdminDeckModeration
          labels={{
            tokenLabel: t("token.label"),
            tokenPlaceholder: t("token.placeholder"),
            saveToken: t("token.save"),
            clearToken: t("token.clear"),
            refresh: t("refresh"),
            loading: t("loading"),
            loadError: t("loadError"),
            actionError: t("actionError"),
            rejectionPrompt: t("rejectionPrompt"),
            rejectionRequired: t("rejectionRequired"),
            approve: t("approve"),
            reject: t("reject"),
            empty: t("empty"),
            status: {
              published: t("status.published"),
              pending: t("status.pending"),
              rejected: t("status.rejected"),
            },
            deck: {
              language: decksT("metadata.language"),
              wordCount: decksT("metadata.wordCount"),
              categories: decksT("metadata.categories"),
              tags: decksT("metadata.tags"),
              nsfw: decksT("nsfw"),
            },
          }}
        />
      </div>
    </div>
  );
}
