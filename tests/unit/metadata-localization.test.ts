import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

vi.mock("@/i18n/navigation", () => ({
  Link: () => null,
  usePathname: () => "/",
  useRouter: () => ({
    push: () => undefined,
    replace: () => undefined,
    back: () => undefined,
    forward: () => undefined,
    refresh: () => undefined,
    prefetch: () => Promise.resolve(),
  }),
  redirect: () => undefined,
  permanentRedirect: () => undefined,
}));

describe("localized metadata wrappers", () => {
  it("updates canonical and open graph URLs with the locale segment", async () => {
    const { generateMetadata } = await import("@/app/[locale]/about/page");

    const metadata = await generateMetadata({ params: { locale: "ru" } });

    expect(metadata.alternates?.canonical).toBe("/ru/about");
    expect(metadata.openGraph?.url).toBe("/ru/about");
  });
});
