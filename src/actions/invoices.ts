"use server";

import { revalidatePath } from "next/cache";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import {
  InvoiceInput,
  invoiceSchema,
  invoiceStatusSchema,
} from "@/validations/invoice";

function parseDateInput(dateString: string): Date {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function calculateTotals(
  items: { description: string; quantity: number; unitPrice: number }[],
  taxRate: number
) {
  const computedItems = items.map((item) => {
    const amount = Number((item.quantity * item.unitPrice).toFixed(2));
    return {
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice.toFixed(2)),
      amount,
    };
  });

  const subtotal = Number(
    computedItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2)
  );
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));

  return { computedItems, subtotal, total };
}

export async function createInvoice(values: InvoiceInput) {
  const { userId } = await requireAuth();

  const parsed = invoiceSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invoice data." };
  }

  const {
    invoiceNumber,
    clientId,
    projectId,
    status,
    issueDate,
    dueDate,
    taxRate,
    notes,
    items,
  } = parsed.data;

  const cleanProjectId = projectId && projectId !== "NONE" ? projectId : null;

  try {
    // Verify client ownership
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
      select: { id: true, name: true },
    });

    if (!client) {
      return { error: "Selected client was not found or is unauthorized." };
    }

    // Verify project ownership & matching client if project is selected
    if (cleanProjectId) {
      const project = await prisma.project.findFirst({
        where: { id: cleanProjectId, userId, clientId: client.id },
        select: { id: true },
      });
      if (!project) {
        return {
          error: "Selected project does not belong to this client.",
        };
      }
    }

    // Recalculate totals securely on the server
    const { computedItems, subtotal, total } = calculateTotals(items, taxRate);

    const created = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          userId,
          clientId: client.id,
          projectId: cleanProjectId,
          invoiceNumber,
          status,
          issueDate: parseDateInput(issueDate),
          dueDate: parseDateInput(dueDate),
          paidAt: status === "PAID" ? new Date() : null,
          subtotal,
          taxRate,
          total,
          notes: notes || null,
          items: {
            create: computedItems,
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action:
            status === "PAID" ? "Invoice marked as paid" : "Invoice created",
          entityType: "INVOICE",
          entityId: invoice.id,
          description: `${invoiceNumber} • ${client.name} ($${total.toFixed(2)})`,
        },
      });

      return invoice;
    });

    revalidatePath("/invoices");
    revalidatePath(`/clients/${clientId}`);
    if (cleanProjectId) revalidatePath(`/projects/${cleanProjectId}`);
    revalidatePath("/dashboard");
    revalidatePath("/activity");

    return { success: true, data: { id: created.id } };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: `Invoice number "${invoiceNumber}" already exists. Please use a unique number.`,
      };
    }
    console.error("Create invoice error:", error);
    return { error: "Failed to create invoice. Please try again." };
  }
}

export async function updateInvoice(invoiceId: string, values: InvoiceInput) {
  const { userId } = await requireAuth();

  const parsed = invoiceSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invoice data." };
  }

  const {
    invoiceNumber,
    clientId,
    projectId,
    status,
    issueDate,
    dueDate,
    taxRate,
    notes,
    items,
  } = parsed.data;

  const cleanProjectId = projectId && projectId !== "NONE" ? projectId : null;

  try {
    const [existingInvoice, client] = await Promise.all([
      prisma.invoice.findFirst({
        where: { id: invoiceId, userId },
        select: {
          id: true,
          status: true,
          paidAt: true,
          clientId: true,
          projectId: true,
        },
      }),
      prisma.client.findFirst({
        where: { id: clientId, userId },
        select: { id: true, name: true },
      }),
    ]);

    if (!existingInvoice) {
      return { error: "Invoice not found or unauthorized." };
    }

    if (!client) {
      return { error: "Selected client was not found or is unauthorized." };
    }

    if (cleanProjectId) {
      const project = await prisma.project.findFirst({
        where: { id: cleanProjectId, userId, clientId: client.id },
        select: { id: true },
      });
      if (!project) {
        return {
          error: "Selected project does not belong to this client.",
        };
      }
    }

    const { computedItems, subtotal, total } = calculateTotals(items, taxRate);

    let nextPaidAt = existingInvoice.paidAt;
    if (status === "PAID" && existingInvoice.status !== "PAID") {
      nextPaidAt = new Date();
    } else if (status !== "PAID") {
      nextPaidAt = null;
    }

    const becamePaid =
      existingInvoice.status !== "PAID" && status === "PAID";

    await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          clientId: client.id,
          projectId: cleanProjectId,
          invoiceNumber,
          status,
          issueDate: parseDateInput(issueDate),
          dueDate: parseDateInput(dueDate),
          paidAt: nextPaidAt,
          subtotal,
          taxRate,
          total,
          notes: notes || null,
          items: {
            create: computedItems,
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: becamePaid ? "Invoice marked as paid" : "Invoice updated",
          entityType: "INVOICE",
          entityId: invoiceId,
          description: `${invoiceNumber} • ${client.name} ($${total.toFixed(2)})`,
        },
      });
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath(`/clients/${existingInvoice.clientId}`);
    revalidatePath(`/clients/${clientId}`);
    if (existingInvoice.projectId) {
      revalidatePath(`/projects/${existingInvoice.projectId}`);
    }
    if (cleanProjectId) {
      revalidatePath(`/projects/${cleanProjectId}`);
    }
    revalidatePath("/dashboard");
    revalidatePath("/activity");

    return { success: true };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        error: `Invoice number "${invoiceNumber}" already exists.`,
      };
    }
    console.error("Update invoice error:", error);
    return { error: "Failed to update invoice. Please try again." };
  }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus
) {
  const { userId } = await requireAuth();

  const parsed = invoiceStatusSchema.safeParse({ status });
  if (!parsed.success) {
    return { error: "Invalid invoice status." };
  }

  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    if (!existing) {
      return { error: "Invoice not found or unauthorized." };
    }

    if (existing.status === parsed.data.status) {
      return { success: true };
    }

    const becamePaid = parsed.data.status === "PAID";

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: parsed.data.status,
          paidAt: becamePaid ? new Date() : null,
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: becamePaid
            ? "Invoice marked as paid"
            : "Invoice status updated",
          entityType: "INVOICE",
          entityId: invoiceId,
          description: `${existing.invoiceNumber} • ${existing.client.name}`,
        },
      });
    });

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath(`/clients/${existing.clientId}`);
    if (existing.projectId) {
      revalidatePath(`/projects/${existing.projectId}`);
    }
    revalidatePath("/dashboard");
    revalidatePath("/activity");

    return { success: true };
  } catch (error) {
    console.error("Update invoice status error:", error);
    return { error: "Failed to update invoice status." };
  }
}

export async function deleteInvoice(invoiceId: string) {
  const { userId } = await requireAuth();

  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
      select: {
        id: true,
        invoiceNumber: true,
        clientId: true,
        projectId: true,
      },
    });

    if (!existing) {
      return { error: "Invoice not found or unauthorized." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.invoice.delete({
        where: { id: invoiceId },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: "Invoice deleted",
          entityType: "INVOICE",
          entityId: invoiceId,
          description: existing.invoiceNumber,
        },
      });
    });

    revalidatePath("/invoices");
    revalidatePath(`/clients/${existing.clientId}`);
    if (existing.projectId) {
      revalidatePath(`/projects/${existing.projectId}`);
    }
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Delete invoice error:", error);
    return { error: "Failed to delete invoice. Please try again." };
  }
}