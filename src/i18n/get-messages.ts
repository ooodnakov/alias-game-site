import { notFound } from "next/navigation";

import type { AppLocale } from "./config";

export async function getMessages(
  locale: AppLocale,
): Promise<Record<string, unknown>> {
  try {
    const messages = (await import(`../messages/${locale}.json`)).default;
    return messages;
  } catch {
    notFound();
  }
}
