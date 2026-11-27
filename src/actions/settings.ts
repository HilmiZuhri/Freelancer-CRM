"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  PasswordInput,
  passwordSchema,
  ProfileInput,
  profileSchema,
  themeSchema,
} from "@/validations/settings";

export async function updateProfile(values: ProfileInput) {
  const { userId } = await requireAuth();

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid profile data." };
  }

  const { name, businessName, phone, address } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name,
          businessName: businessName || null,
          phone: phone || null,
          address: address || null,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Profile updated",
          entityType: "USER",
          entityId: userId,
          description: businessName ? `${name} (${businessName})` : name,
        },
      });
    });

    revalidatePath("/", "layout");
    revalidatePath("/settings");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update profile error:", error);
    return { error: "Failed to update profile. Please try again." };
  }
}

export async function updatePassword(values: PasswordInput) {
  const { userId } = await requireAuth();

  const parsed = passwordSchema.safeParse(values);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid password data.",
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user || !user.password) {
      return { error: "Account password cannot be updated." };
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return { error: "Current password is incorrect." };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Password changed",
          entityType: "USER",
          entityId: userId,
          description: "Account password updated",
        },
      });
    });

    revalidatePath("/activity");
    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    return { error: "Failed to update password. Please try again." };
  }
}

export async function updateThemePreference(theme: "light" | "dark") {
  const { userId } = await requireAuth();

  const parsed = themeSchema.safeParse({ theme });
  if (!parsed.success) {
    return { error: "Invalid theme selection." };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { theme: parsed.data.theme },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Update theme error:", error);
    return { error: "Failed to save appearance preference." };
  }
}