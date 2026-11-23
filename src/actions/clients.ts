"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { ClientInput, clientSchema } from "@/validations/client";

export async function createClient(values: ClientInput) {
  const { userId } = await requireAuth();

  const parsed = clientSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid client data." };
  }

  const { name, email, phone, company, address, notes } = parsed.data;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          userId,
          name,
          email: email.toLowerCase(),
          phone: phone || null,
          company: company || null,
          address: address || null,
          notes: notes || null,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Client added",
          entityType: "CLIENT",
          entityId: client.id,
          description: company ? `${name} (${company})` : name,
        },
      });

      return client;
    });

    revalidatePath("/clients");
    revalidatePath("/dashboard");
    revalidatePath("/activity");

    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error("Create client error:", error);
    return { error: "Failed to create client. Please try again." };
  }
}

export async function updateClient(clientId: string, values: ClientInput) {
  const { userId } = await requireAuth();

  const parsed = clientSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid client data." };
  }

  const { name, email, phone, company, address, notes } = parsed.data;

  try {
    // Authorization check: ensure the client belongs to the authenticated user
    const existing = await prisma.client.findFirst({
      where: { id: clientId, userId },
      select: { id: true },
    });

    if (!existing) {
      return { error: "Client not found or unauthorized." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.client.update({
        where: { id: clientId },
        data: {
          name,
          email: email.toLowerCase(),
          phone: phone || null,
          company: company || null,
          address: address || null,
          notes: notes || null,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Client updated",
          entityType: "CLIENT",
          entityId: clientId,
          description: company ? `${name} (${company})` : name,
        },
      });
    });

    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Update client error:", error);
    return { error: "Failed to update client. Please try again." };
  }
}

export async function deleteClient(clientId: string) {
  const { userId } = await requireAuth();

  try {
    const existing = await prisma.client.findFirst({
      where: { id: clientId, userId },
      select: { id: true, name: true },
    });

    if (!existing) {
      return { error: "Client not found or unauthorized." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.client.delete({
        where: { id: clientId },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Client deleted",
          entityType: "CLIENT",
          entityId: clientId,
          description: existing.name,
        },
      });
    });

    revalidatePath("/clients");
    revalidatePath("/projects");
    revalidatePath("/invoices");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete client error:", error);
    return { error: "Failed to delete client. Please try again." };
  }
}