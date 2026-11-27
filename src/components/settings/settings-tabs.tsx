"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, Moon, Palette, Sun, User } from "lucide-react";
import { toast } from "sonner";
import {
  PasswordInput,
  passwordSchema,
  ProfileInput,
  profileSchema,
} from "@/validations/settings";
import {
  updatePassword,
  updateProfile,
  updateThemePreference,
} from "@/actions/settings";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SettingsTabsProps {
  user: {
    name: string;
    email: string;
    businessName: string;
    phone: string;
    address: string;
    theme: "light" | "dark";
  };
}

export function SettingsTabs({ user }: SettingsTabsProps) {
  const router = useRouter();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(
    user.theme
  );

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      businessName: user.businessName,
      phone: user.phone,
      address: user.address,
    },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onProfileSubmit(data: ProfileInput) {
    setSavingProfile(true);
    try {
      const result = await updateProfile(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Profile and business details updated.");
      router.refresh();
    } finally {
      setSavingProfile(false);
    }
  }

  async function onPasswordSubmit(data: PasswordInput) {
    setSavingPassword(true);
    try {
      const result = await updatePassword(data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Password updated successfully.");
      passwordForm.reset();
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleThemeChange(nextTheme: "light" | "dark") {
    setCurrentTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    setSavingTheme(true);
    try {
      const result = await updateThemePreference(nextTheme);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Appearance switched to ${nextTheme === "dark" ? "Dark" : "Light"} mode.`
      );
      router.refresh();
    } finally {
      setSavingTheme(false);
    }
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList>
        <TabsTrigger value="profile" className="gap-1.5">
          <User className="h-4 w-4" />
          Profile & Business
        </TabsTrigger>
        <TabsTrigger value="appearance" className="gap-1.5">
          <Palette className="h-4 w-4" />
          Appearance
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-1.5">
          <KeyRound className="h-4 w-4" />
          Security
        </TabsTrigger>
      </TabsList>

      {/* Profile & Business Tab */}
      <TabsContent value="profile">
        <Card className="max-w-2xl shadow-xs">
          <CardHeader>
            <CardTitle>Profile & Business Information</CardTitle>
            <CardDescription>
              This information appears on your account header and printed PDF
              invoices.
            </CardDescription>
          </CardHeader>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-name">Full Name</Label>
                  <Input
                    id="settings-name"
                    disabled={savingProfile}
                    {...profileForm.register("name")}
                  />
                  {profileForm.formState.errors.name && (
                    <p className="text-xs text-destructive">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-email">Account Email</Label>
                  <Input
                    id="settings-email"
                    value={user.email}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="settings-business">
                    Business / Studio Name
                  </Label>
                  <Input
                    id="settings-business"
                    placeholder="Morgan Digital Studio"
                    disabled={savingProfile}
                    {...profileForm.register("businessName")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-phone">Business Phone</Label>
                  <Input
                    id="settings-phone"
                    placeholder="+1 (415) 555-0182"
                    disabled={savingProfile}
                    {...profileForm.register("phone")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-address">Business Address</Label>
                <Textarea
                  id="settings-address"
                  placeholder="Street, City, Postal Code, Country"
                  rows={3}
                  disabled={savingProfile}
                  {...profileForm.register("address")}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      {/* Appearance Tab */}
      <TabsContent value="appearance">
        <Card className="max-w-2xl shadow-xs">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize the workspace theme. Your preference is saved to your
              account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                disabled={savingTheme}
                onClick={() => handleThemeChange("light")}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  currentTheme === "light"
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Sun className="h-4 w-4 text-amber-500" />
                  Light Workspace
                </div>
                <p className="text-xs text-muted-foreground">
                  Crisp light content area paired with the signature dark SaaS
                  sidebar.
                </p>
              </button>

              <button
                type="button"
                disabled={savingTheme}
                onClick={() => handleThemeChange("dark")}
                className={cn(
                  "flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  currentTheme === "dark"
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  Dark Mode
                </div>
                <p className="text-xs text-muted-foreground">
                  Low-glare dark interface designed for comfortable evening
                  sessions.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security / Password Tab */}
      <TabsContent value="security">
        <Card className="max-w-2xl shadow-xs">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Use a strong password with at least 8 characters to keep your
              account secure.
            </CardDescription>
          </CardHeader>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  disabled={savingPassword}
                  {...passwordForm.register("currentPassword")}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    disabled={savingPassword}
                    {...passwordForm.register("newPassword")}
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    disabled={savingPassword}
                    {...passwordForm.register("confirmPassword")}
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-destructive">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-border pt-4">
              <Button type="submit" disabled={savingPassword}>
                {savingPassword && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Password
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}