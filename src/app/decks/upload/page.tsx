import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DeckUploadForm } from "@/components/deck-upload-form";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const StarterKitLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
  external: z.boolean().optional(),
  download: z.boolean().optional(),
});

const StarterKitResourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  links: z.array(StarterKitLinkSchema).optional(),
});

const StarterKitTutorialSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  href: z.string(),
});

const StarterKitTutorialSectionSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  linkLabel: z.string().optional(),
  items: z.array(StarterKitTutorialSchema).optional(),
});

const StarterKitContentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  resources: z.array(StarterKitResourceSchema).optional(),
  tutorials: StarterKitTutorialSectionSchema.optional(),
});

type StarterKitContent = z.infer<typeof StarterKitContentSchema>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("upload.title");
  const description = t("upload.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/decks/upload",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image"],
    },
    alternates: {
      canonical: "/decks/upload",
    },
  };
}

export default async function DeckUploadPage() {
  const t = await getTranslations("upload");
  const captchaSiteKey = process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY;
  const starterKitResult = StarterKitContentSchema.safeParse(t.raw("starterKit") ?? {});
  if (!starterKitResult.success) {
    console.error("Invalid starter kit content", starterKitResult.error);
  }
  const starterKit: StarterKitContent = starterKitResult.success ? starterKitResult.data : {};
  const starterKitResources = starterKit.resources ?? [];
  const tutorialSection = starterKit.tutorials;
  const tutorialItems = tutorialSection?.items ?? [];

  return (
    <div className="bg-surface-muted/40 py-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6">
        <div className="space-y-3">
          <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-foreground/70">{t("intro")}</p>
        </div>
        {starterKitResources.length || tutorialItems.length ? (
          <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <div className="space-y-2">
              {starterKit.title ? (
                <h2 className="text-2xl font-semibold text-foreground">{starterKit.title}</h2>
              ) : null}
              {starterKit.description ? (
                <p className="text-sm text-foreground/70">{starterKit.description}</p>
              ) : null}
            </div>
            {starterKitResources.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {starterKitResources.map((resource) => (
                  <article
                    key={resource.id}
                    className="flex h-full flex-col gap-4 rounded-2xl border border-border/40 bg-surface-muted/60 p-5"
                  >
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-foreground">{resource.title}</h3>
                      <p className="text-sm text-foreground/70">{resource.description}</p>
                    </div>
                    {resource.links?.length ? (
                      <div className="mt-auto flex flex-wrap gap-3">
                        {resource.links.map((link) => (
                          <Button key={`${resource.id}-${link.href}`} asChild variant="secondary" size="sm">
                            <a
                              href={link.href}
                              target={link.external ? "_blank" : undefined}
                              rel={link.external ? "noopener noreferrer" : undefined}
                              download={link.download ? "" : undefined}
                            >
                              {link.label}
                            </a>
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
            {tutorialItems.length ? (
              <div className="space-y-4 rounded-2xl border border-border/40 bg-surface-muted/40 p-5">
                <div className="space-y-1">
                  {tutorialSection?.title ? (
                    <h3 className="text-base font-semibold text-foreground">{tutorialSection.title}</h3>
                  ) : null}
                  {tutorialSection?.description ? (
                    <p className="text-sm text-foreground/70">{tutorialSection.description}</p>
                  ) : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {tutorialItems.map((tutorial) => (
                    <article
                      key={tutorial.id}
                      className="flex h-full flex-col gap-3 rounded-xl border border-border/40 bg-surface p-4"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{tutorial.title}</h4>
                        <p className="mt-1 text-xs text-foreground/70">{tutorial.summary}</p>
                      </div>
                      <Button asChild variant="ghost" size="sm" className="mt-auto self-start">
                        <a href={tutorial.href}>{tutorialSection?.linkLabel ?? tutorial.title}</a>
                      </Button>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
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
              tooLarge: t("validation.tooLarge"),
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
            preview: {
              heading: t("preview.heading"),
              titleLabel: t("preview.titleLabel"),
              wordsLabel: t("preview.wordsLabel"),
              invalid: t("preview.invalid"),
            },
          }}
        />
      </div>
    </div>
  );
}
