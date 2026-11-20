import type { NextAuthConfig } from "next-auth";

const protectedRoutes = [
  "/dashboard",
  "/clients",
  "/projects",
  "/tasks",
  "/invoices",
  "/activity",
  "/settings",
];

const authRoutes = ["/login", "/register"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const isProtected = protectedRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      );
      const isAuthRoute = authRoutes.some((route) => pathname === route);

      if (isAuthRoute) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (isProtected && !isLoggedIn) {
        return false; // Redirects unauthenticated users to pages.signIn (/login)
      }

      return true;
    },
  },
  providers: [], // Providers are configured in src/auth.ts
} satisfies NextAuthConfig;