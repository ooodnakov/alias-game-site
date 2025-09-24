"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";

import { Link } from "@/i18n/navigation";

import { LangSwitch } from "@/components/lang-switch";
import { SiteNavLink } from "@/components/site-nav-link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type MobileNavLink = {
  href: string;
  label: string;
};

interface MobileNavProps {
  links: MobileNavLink[];
  downloadHref: string;
  downloadLabel: string;
  menuLabel: string;
  closeLabel: string;
  triggerClassName?: string;
}

export function MobileNav({
  links,
  downloadHref,
  downloadLabel,
  menuLabel,
  closeLabel,
  triggerClassName,
}: MobileNavProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("md:hidden", triggerClassName)}
        >
          <Menu className="size-5" aria-hidden="true" />
          <span className="sr-only">{menuLabel}</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xs flex-col bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-foreground/10 px-6 py-4">
            <Dialog.Title className="text-base font-semibold">
              {menuLabel}
            </Dialog.Title>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon">
                <X className="size-5" aria-hidden="true" />
                <span className="sr-only">{closeLabel}</span>
              </Button>
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <nav className="flex flex-col gap-2">
              {links.map((link) => (
                <Dialog.Close asChild key={link.href}>
                  <SiteNavLink
                    href={link.href}
                    className="justify-start rounded-md px-4 py-2 text-base font-medium"
                  >
                    {link.label}
                  </SiteNavLink>
                </Dialog.Close>
              ))}
            </nav>
            <div className="mt-6 border-t border-foreground/10 pt-4">
              <LangSwitch />
            </div>
          </div>
          <div className="border-t border-foreground/10 px-6 py-4">
            <Dialog.Close asChild>
              <Button asChild className="w-full">
                <Link href={downloadHref} target="_blank" rel="noopener noreferrer">
                  {downloadLabel}
                </Link>
              </Button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
