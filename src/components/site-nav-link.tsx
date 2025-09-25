"use client";

import { cva } from "class-variance-authority";
import { forwardRef, type ReactNode } from "react";

import { Link, usePathname } from "@/i18n/navigation";
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
    const normalizePath = (value: string) => {
      if (!value) {
        return "/";
      }

      const ensured = value.startsWith("/") ? value : `/${value}`;
      if (ensured === "/") {
        return ensured;
      }

      return ensured.replace(/\/$/, "");
    };

    const normalizedPath = normalizePath(pathname);
    const target = normalizePath(href);
    const isActive =
      normalizedPath === target ||
      (target !== "/" && normalizedPath.startsWith(`${target}/`));

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
