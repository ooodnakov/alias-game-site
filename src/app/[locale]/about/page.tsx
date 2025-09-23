import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = t("about.title");
  const description = t("about.description");
  const path = `/${locale}/about`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: path,
      images: [`/${locale}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/${locale}/twitter-image`],
    },
    alternates: {
      canonical: path,
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
            href="https://github.com/aodnakov/alias-game/issues"
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
