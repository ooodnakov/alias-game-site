import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

const exampleDeck = {
  format: "alioss-deck@1",
  title: "Party Classics",
  author: "Alioss Team",
  language: "en",
  allowNSFW: false,
  metadata: {
    version: "1.0.0",
    categories: ["Party", "General"],
    wordClasses: ["NOUN", "VERB"],
    coverImage: "https://cdn.example.com/decks/party-classics.jpg",
  },
  words: [
    { text: "Balloon", difficulty: 1, category: "Party", wordClass: "NOUN" },
    { text: "Confetti", difficulty: 2, category: "Party", wordClass: "NOUN" },
    { text: "Dance", difficulty: 1, category: "Party", wordClass: "VERB" },
    { text: "Playlist", difficulty: 2, category: "General", wordClass: "NOUN" },
    { text: "Celebrate", difficulty: 1, category: "Party", wordClass: "VERB" },
  ],
};

const exampleJson = JSON.stringify(exampleDeck, null, 2);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("docsDeckFormat.title");
  const description = t("docsDeckFormat.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/docs/deck-format",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image"],
    },
    alternates: {
      canonical: "/docs/deck-format",
    },
  };
}

export default async function DeckFormatDocPage() {
  const t = await getTranslations("docs.deckFormat");
  const sectionKeys = ["overview", "schemas", "mariadb", "payload"] as const;
  const sections = sectionKeys.map((key) => {
    const section = t.raw(`sections.${key}`) as {
      heading: string;
      body: string[];
    };

    return { key, ...section };
  });
  const checklist = t.raw("sections.validation.items") as string[];
  const rows = t.raw("table.rows") as Record<
    string,
    { mariadb: string; mobile: string; notes: string }
  >;
  const resources = t.raw("resources.items") as Array<{
    text: string;
    url: string;
  }>;

  return (
    <div className="bg-surface-muted/40 py-16">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
          <p className="text-sm text-foreground/70">{t("intro")}</p>
          <p className="text-xs uppercase tracking-wide text-foreground/50">
            {t("lastUpdated")}
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.key}
              className="space-y-3 rounded-3xl border border-border/60 bg-surface p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-foreground">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-sm text-foreground/70">
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </section>

        <section className="space-y-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">
            {t("table.heading")}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-foreground/60">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("table.columns.mariadb")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.columns.mobile")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.columns.notes")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 bg-surface">
                {Object.entries(rows).map(([key, value]) => (
                  <tr key={key} className="align-top">
                    <td className="px-4 py-3 font-mono text-xs text-foreground/80">
                      {value.mariadb}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground/80">
                      {value.mobile}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground/70">
                      {value.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-[2fr,1fr]">
          <article className="space-y-4 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">
              {t("exampleTitle")}
            </h2>
            <p className="text-sm text-foreground/70">
              {t("exampleDescription")}
            </p>
            <pre className="overflow-auto rounded-2xl border border-border/40 bg-muted/30 p-4 text-xs leading-relaxed text-foreground/80">
              <code>{exampleJson}</code>
            </pre>
          </article>
          <aside className="space-y-3 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">
              {t("sections.validation.heading")}
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-foreground/70">
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="space-y-3 rounded-3xl border border-border/60 bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {t("resources.heading")}
          </h2>
          <ul className="space-y-2 text-sm text-foreground/70">
            {resources.map((item) => (
              <li key={item.text}>
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary"
                >
                  {item.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
