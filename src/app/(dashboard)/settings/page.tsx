import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile, appearance, and account security.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
            <Settings className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">Account Settings (Phase 11)</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            Profile editing, password updates, and workspace preferences will be implemented after authentication is ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}