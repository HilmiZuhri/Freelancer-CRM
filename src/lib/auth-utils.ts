import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Ensures the current request has an authenticated user session.
 * Redirects to /login if called inside a page/layout without a valid session.
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return {
    userId: session.user.id,
    user: session.user,
  };
}

export async function getUserTheme(): Promise<"light" | "dark"> {
  try {
    const session = await auth();
    if (!session?.user?.id) return "light";

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true },
    });

    return user?.theme === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}