import type { Metadata } from "next";

import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { getSafeLocale } from "@/i18n/get-safe-locale";
import { z } from "zod";

export const revalidate = 300;

const SpotlightResourceSchema = z.object({
  label: z.string(),
  href: z.string(),
  external: z.boolean().optional(),
});

const SpotlightEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  title: z.string(),
  summary: z.string(),
  siteHighlights: z.array(z.string()).optional(),
  appHighlights: z.array(z.string()).optional(),
  resources: z.array(SpotlightResourceSchema).optional(),
});

const TutorialItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  steps: z.array(z.string()).optional(),
});

const TutorialsContentSchema = z.object({
  title: z.string().optional(),
  intro: z.string().optional(),
  items: z.array(TutorialItemSchema).optional(),
});

const UpdatesLabelsSchema = z.object({
  site: z.string().optional(),
  app: z.string().optional(),
  resources: z.string().optional(),
});

const SpotlightEntriesSchema = z.array(SpotlightEntrySchema);

type TutorialsContent = z.infer<typeof TutorialsContentSchema>;
type UpdatesLabels = z.infer<typeof UpdatesLabelsSchema>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("updates.title");
  const description = t("updates.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/updates",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image"],
    },
    alternates: {
      canonical: "/updates",
    },
  };
}

export default async function UpdatesPage() {
  const t = await getTranslations("updates");
  const locale = await getSafeLocale();
  const title = t("title");
  const intro = t("intro");
  const labelsResult = UpdatesLabelsSchema.safeParse(t.raw("labels") ?? {});
  if (!labelsResult.success) {
    console.error("Invalid updates labels", labelsResult.error);
  }
  const labels: UpdatesLabels = labelsResult.success ? labelsResult.data : {};
  const entriesResult = SpotlightEntriesSchema.safeParse(t.raw("entries") ?? []);
  if (!entriesResult.success) {
    console.error("Invalid updates entries", entriesResult.error);
  }
  const entries = [...(entriesResult.success ? entriesResult.data : [])];
  const tutorialsResult = TutorialsContentSchema.safeParse(t.raw("tutorials") ?? {});
  if (!tutorialsResult.success) {
    console.error("Invalid updates tutorials", tutorialsResult.error);
  }
  const tutorials: TutorialsContent | undefined = tutorialsResult.success ? tutorialsResult.data : undefined;

  entries.sort((a, b) => {
    const aTime = new Date(a.date).getTime();
    const bTime = new Date(b.date).getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
      return 0;
    }
    if (Number.isNaN(aTime)) {
      return 1;
    }
    if (Number.isNaN(bTime)) {
      return -1;
    }
    return bTime - aTime;
  });

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  return (
    <div className="bg-surface-muted/40 py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 px-6">
        <header className="space-y-3">
          {title ? (
            <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          ) : null}
          {intro ? (
            <p className="text-sm text-foreground/70">{intro}</p>
          ) : null}
        </header>
        <div className="space-y-8">
          {entries.map((entry) => {
            const parsedDate = new Date(entry.date);
            const formattedDate = Number.isNaN(parsedDate.getTime())
              ? entry.date
              : dateFormatter.format(parsedDate);
            return (
              <article
                key={entry.id}
                className="flex flex-col gap-5 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm"
              >
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    {formattedDate}
                  </p>
                  <h2 className="text-2xl font-semibold text-foreground">{entry.title}</h2>
                  <p className="text-sm text-foreground/70">{entry.summary}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {entry.siteHighlights?.length ? (
                    <section className="space-y-2 rounded-2xl border border-border/40 bg-surface-muted/60 p-4">
                      {labels.site ? (
                        <h3 className="text-sm font-semibold text-foreground">{labels.site}</h3>
                      ) : null}
                      <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/70">
                        {entry.siteHighlights.map((item, index) => (
                          <li key={`${entry.id}-site-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {entry.appHighlights?.length ? (
                    <section className="space-y-2 rounded-2xl border border-border/40 bg-surface-muted/60 p-4">
                      {labels.app ? (
                        <h3 className="text-sm font-semibold text-foreground">{labels.app}</h3>
                      ) : null}
                      <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/70">
                        {entry.appHighlights.map((item, index) => (
                          <li key={`${entry.id}-app-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
                {entry.resources?.length ? (
                  <div className="flex flex-wrap items-center gap-3">
                    {labels.resources ? (
                      <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                        {labels.resources}
                      </span>
                    ) : null}
                    {entry.resources.map((resource) => (
                      <Button key={`${entry.id}-${resource.href}`} asChild variant="ghost" size="sm">
                        <a
                          href={resource.href}
                          target={resource.external ? "_blank" : undefined}
                          rel={resource.external ? "noopener noreferrer" : undefined}
                        >
                          {resource.label}
                        </a>
                      </Button>
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        {tutorials?.items?.length ? (
          <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm" id="tutorials">
            <div className="space-y-2">
              {tutorials.title ? (
                <h2 className="text-2xl font-semibold text-foreground">{tutorials.title}</h2>
              ) : null}
              {tutorials.intro ? (
                <p className="text-sm text-foreground/70">{tutorials.intro}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-6">
              {tutorials.items.map((tutorial) => (
                <article
                  key={tutorial.id}
                  id={tutorial.id}
                  className="space-y-4 rounded-2xl border border-border/40 bg-surface-muted/40 p-5"
                >
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold text-foreground">{tutorial.title}</h3>
                    <p className="text-sm text-foreground/70">{tutorial.summary}</p>
                  </div>
                  {tutorial.steps?.length ? (
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-foreground/70">
                      {tutorial.steps.map((step, index) => (
                        <li key={`${tutorial.id}-step-${index}`}>{step}</li>
                      ))}
                    </ol>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
