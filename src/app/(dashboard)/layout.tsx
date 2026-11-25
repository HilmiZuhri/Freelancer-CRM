import { requireAuth } from "@/lib/auth-utils";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="lg:pl-64 print:pl-0 flex flex-col min-h-screen">
        <Topbar
          user={{
            name: user.name ?? "Freelancer",
            email: user.email ?? "",
          }}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto print:p-0 print:max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
}