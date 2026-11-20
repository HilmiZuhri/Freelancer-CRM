"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  LoginInput,
  loginSchema,
  RegisterInput,
  registerSchema,
} from "@/validations/auth";

export async function registerUser(values: RegisterInput) {
  const parsed = registerSchema.safeParse(values);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input data." };
  }

  const { name, email, businessName, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          businessName: businessName || null,
          password: hashedPassword,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: newUser.id,
          action: "Account created",
          entityType: "USER",
          entityId: newUser.id,
          description: `Registered workspace for ${name}`,
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { error: "Something went wrong during registration. Please try again." };
  }
}

export async function loginUser(values: LoginInput) {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { error: "Invalid email or password format." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Authentication failed. Please try again." };
      }
    }
    console.error("Login error:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}