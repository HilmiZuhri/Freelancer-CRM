import { redirect } from "next/navigation";
import { auth } from "@/auth";

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