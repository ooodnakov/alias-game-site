import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("about.title");
  const description = t("about.description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: "/about",
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image"],
    },
    alternates: {
      canonical: "/about",
    },
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <div className="bg-surface-muted/40 py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6">
        <h1 className="text-3xl font-semibold text-foreground">{t("title")}</h1>
        <p className="text-sm text-foreground/70">{t("intro")}</p>
        <ul className="list-disc space-y-2 pl-6 text-sm text-foreground/70">
          {t.raw("values")?.map((value: string) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
        <p className="text-sm text-foreground/70">
          {t("contact")} {" "}
          <Link
            href="https://github.com/ooodnakov/alias-game/issues"
            target="_blank"
            rel="noreferrer"
            className="text-primary"
          >
            GitHub
          </Link>
        </p>
      </div>
    </div>
  );
}
