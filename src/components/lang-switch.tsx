"use client";

import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";

import { buttonVariants } from "@/components/ui/button";
import { LOCALE_LABELS, locales, type AppLocale } from "@/i18n/config";
import { cn } from "@/lib/cn";

export function LangSwitch() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Select.Root
      value={locale}
      onValueChange={(value) => {
        if (value !== locale) {
          router.replace(pathname, { locale: value as AppLocale });
          router.refresh();
        }
      }}
    >
      <Select.Trigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "min-w-24 justify-between",
        )}
        aria-label="Language selector"
      >
        <Select.Value placeholder={LOCALE_LABELS[locale]} />
        <Select.Icon className="ml-2">
          <ChevronDown className="size-4" aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="z-50 overflow-hidden rounded-md border border-foreground/10 bg-surface shadow-lg"
          position="popper"
        >
          <Select.Viewport className="p-1">
            {locales.map((value) => (
              <Select.Item
                key={value}
                value={value}
                className={cn(
                  "flex cursor-pointer select-none items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-foreground outline-none data-[highlighted]:bg-primary/10 data-[state=checked]:font-semibold",
                )}
              >
                <Select.ItemText>{LOCALE_LABELS[value]}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check className="size-4" aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
