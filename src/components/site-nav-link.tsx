"use client";

import { cva } from "class-variance-authority";
import { forwardRef, type ReactNode } from "react";

import { useLocale } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import { locales } from "@/i18n/config";
import { cn } from "@/lib/cn";

const navLinkStyles = cva(
  "rounded-full px-3 py-2 text-sm font-medium transition hover:bg-foreground/5",
  {
    variants: {
      active: {
        true: "bg-primary/15 text-primary-foreground",
        false: "text-foreground/80",
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);

export type SiteNavLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
};

export const SiteNavLink = forwardRef<HTMLAnchorElement, SiteNavLinkProps>(
  ({ href, children, className, onClick }, ref) => {
    const pathname = usePathname();
    const locale = useLocale();

    let normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    if (normalizedPath === `/${locale}`) {
      normalizedPath = "/";
    } else {
      for (const candidate of locales) {
        if (normalizedPath.startsWith(`/${candidate}/`)) {
          normalizedPath = normalizedPath.replace(`/${candidate}`, "");
          break;
        }
      }
    }

    const target = href === "/" ? "/" : href.replace(/\/$/, "");
    const isActive =
      normalizedPath === target || normalizedPath.startsWith(`${target}/`);

    return (
      <Link
        ref={ref}
        href={href}
        onClick={onClick}
        className={cn(navLinkStyles({ active: isActive }), className)}
      >
        {children}
      </Link>
    );
  });

SiteNavLink.displayName = "SiteNavLink";
