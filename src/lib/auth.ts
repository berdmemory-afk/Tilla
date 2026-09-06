import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { NextAuthConfig } from "next-auth";
import { resolveCompanyContext } from "@/lib/company-context";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await compare(password, user.passwordHash);
        if (!valid) return null;

        const ctx = await resolveCompanyContext(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          companyId: ctx?.companyId,
          companyName: ctx?.companyName,
          role: ctx?.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as {
          id: string;
          companyId?: string;
          companyName?: string;
          role?: string;
        };
        token.sub = u.id;
        token.companyId = u.companyId;
        token.companyName = u.companyName;
        token.role = u.role;
      }
      // Refresh company context on update() or every session read path via trigger
      if ((trigger === "update" || !token.companyId) && token.sub) {
        const ctx = await resolveCompanyContext(token.sub as string);
        if (ctx) {
          token.companyId = ctx.companyId;
          token.companyName = ctx.companyName;
          token.role = ctx.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        // Always re-resolve so company switch / FY role stay fresh without re-login
        if (token.sub) {
          const ctx = await resolveCompanyContext(token.sub as string);
          if (ctx) {
            session.user.companyId = ctx.companyId;
            session.user.companyName = ctx.companyName;
            session.user.role = ctx.role;
          } else {
            session.user.companyId = token.companyId as string | undefined;
            session.user.companyName = token.companyName as string | undefined;
            session.user.role = token.role as string | undefined;
          }
        }
      }
      return session;
    },
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
