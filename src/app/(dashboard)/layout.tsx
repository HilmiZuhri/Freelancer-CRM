import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await requireAuth();

  const [dbUser, clientsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
    prisma.client.count({
      where: { userId },
    }),
  ]);

  if (!dbUser) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar clientsCount={clientsCount} />

      <div className="lg:pl-64 print:pl-0 flex flex-col min-h-screen">
        <Topbar
          user={{
            name: dbUser.name ?? "Freelancer",
            email: dbUser.email,
          }}
          clientsCount={clientsCount}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}