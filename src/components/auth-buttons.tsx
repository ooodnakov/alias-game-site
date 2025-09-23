"use client";

import { signIn, signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

type SignInButtonProps = {
  label: string;
  callbackUrl?: string;
};

type SignOutButtonProps = {
  label: string;
  callbackUrl?: string;
};

export function GitHubSignInButton({ label, callbackUrl }: SignInButtonProps) {
  return (
    <Button type="button" onClick={() => signIn("github", { callbackUrl })}>
      {label}
    </Button>
  );
}

export function SignOutButton({ label, callbackUrl }: SignOutButtonProps) {
  return (
    <Button type="button" variant="ghost" onClick={() => signOut({ callbackUrl })}>
      {label}
    </Button>
  );
}
