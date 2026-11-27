import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsPage() {
  const { userId } = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      businessName: true,
      phone: true,
      address: true,
      theme: true,
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal profile, studio details, appearance, and account
          security.
        </p>
      </div>

      <SettingsTabs
        user={{
          name: user.name ?? "",
          email: user.email,
          businessName: user.businessName ?? "",
          phone: user.phone ?? "",
          address: user.address ?? "",
          theme: user.theme === "dark" ? "dark" : "light",
        }}
      />
    </div>
  );
}