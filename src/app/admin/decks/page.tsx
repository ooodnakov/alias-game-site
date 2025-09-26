import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { GitHubSignInButton, SignOutButton } from "@/components/auth-buttons";
import { AdminDeckModeration } from "@/components/admin-deck-moderation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("admin.title");
  const description = t("admin.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/admin/decks",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image"],
    },
    alternates: {
      canonical: "/admin/decks",
    },
  };
}

export default async function AdminDecksPage() {
  const [t, decksT] = await Promise.all([getTranslations("admin"), getTranslations("decks")]);
  const session = await auth();
  const isAdmin = Boolean(session?.user?.isAdmin);
  const callbackUrl = "/admin/decks";

  const heading = (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
      <p className="text-sm text-foreground/70">{t("intro")}</p>
    </div>
  );

  if (!session) {
    return (
      <div className="bg-surface-muted/40 py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6">
          {heading}
          <div className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <div className="space-y-2 text-sm text-foreground/80">
              <h2 className="text-xl font-semibold text-foreground">{t("signIn.title")}</h2>
              <p>{t("signIn.description")}</p>
            </div>
            <GitHubSignInButton label={t("signIn.cta")} callbackUrl={callbackUrl} />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    const displayName =
      session.user?.name ?? session.user?.githubLogin ?? session.user?.email ?? t("unauthorized.unknownUser");

    return (
      <div className="bg-surface-muted/40 py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6">
          {heading}
          <div className="flex flex-col gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
            <div className="space-y-2 text-sm">
              <h2 className="text-xl font-semibold">{t("unauthorized.title")}</h2>
              <p>{t("unauthorized.description", { user: displayName })}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <SignOutButton label={t("signOut")} callbackUrl="/" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-muted/40 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6">
        {heading}
        <AdminDeckModeration
          labels={{
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
