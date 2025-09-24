import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";

import { adminLogins } from "./lib/moderation";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, profile }) {
      if (profile && "login" in profile && typeof profile.login === "string") {
        token.githubLogin = profile.login.toLowerCase();
      }

      if (typeof token.githubLogin === "string") {
        token.isAdmin = adminLogins.has(token.githubLogin);
      } else {
        token.isAdmin = false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.githubLogin = typeof token.githubLogin === "string" ? token.githubLogin : undefined;
        session.user.isAdmin = Boolean(token.isAdmin);
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

const OUTSIDE_REQUEST_SCOPE_ERROR_CODE = "E251";

function isOutsideRequestScopeError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const { __NEXT_ERROR_CODE } = error as { __NEXT_ERROR_CODE?: unknown };

  if (typeof __NEXT_ERROR_CODE === "string") {
    return __NEXT_ERROR_CODE === OUTSIDE_REQUEST_SCOPE_ERROR_CODE;
  }

  if (error instanceof Error && error.message.includes("outside a request scope")) {
    // Fallback for older Next.js builds that only expose the invariant message.
    // The message originates from https://nextjs.org/docs/messages/next-dynamic-api-wrong-context.
    return true;
  }

  return false;
}

export const auth = async () => {
  try {
    return await getServerSession(authOptions);
  } catch (error) {
    if (isOutsideRequestScopeError(error)) {
      return null;
    }

    throw error;
  }
};

export { handler as GET, handler as POST };
