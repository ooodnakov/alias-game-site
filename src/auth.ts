import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";

const adminLoginsEnv = process.env.DECK_ADMIN_GITHUB_LOGINS;
const adminLogins = adminLoginsEnv
  ? new Set(
      adminLoginsEnv
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0),
    )
  : new Set<string>();

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
      if (profile && typeof (profile as { login?: unknown }).login === "string") {
        token.githubLogin = (profile as { login: string }).login.toLowerCase();
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

export const auth = () => getServerSession(authOptions);

export { handler as GET, handler as POST };
