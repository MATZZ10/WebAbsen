import NextAuth from "next-auth";
import "next-auth/jwt";
import Google from "next-auth/providers/google";
import { getUserByEmail, upsertUserFromOAuth } from "@/lib/db";

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      await upsertUserFromOAuth({ email: user.email, name: user.name, image: user.image });
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) token.email = user.email;
      if (user?.name) token.name = user.name;
      if (user?.image) token.picture = user.image;
      if (token.email) {
        const dbUser = (await getUserByEmail(token.email as string)) ?? (await upsertUserFromOAuth({
          email: token.email as string,
          name: token.name ?? null,
          image: token.picture ?? null
        }));
        token.role = dbUser.role;
        token.userId = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as "teacher" | "student";
      }
      return session;
    }
  }
});

declare module "next-auth" {
  interface Session {
    user: { id: string; name?: string | null; email?: string | null; image?: string | null; role: "teacher" | "student" };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "teacher" | "student";
    userId?: string;
  }
}

declare module "next/server" {
  interface NextRequest {
    auth: import("next-auth").Session | null;
  }
}
