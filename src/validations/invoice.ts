import { InvoiceStatus } from "@prisma/client";
import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Item description is required.")
    .max(200, "Description is too long."),
  quantity: z
    .number({ message: "Must be a number." })
    .int("Quantity must be a whole number.")
    .min(1, "Min quantity is 1.")
    .max(10000, "Quantity is too large."),
  unitPrice: z
    .number({ message: "Must be a number." })
    .min(0, "Unit price cannot be negative.")
    .max(9999999, "Unit price is too large."),
});

export const invoiceSchema = z
  .object({
    invoiceNumber: z
      .string()
      .trim()
      .min(3, "Invoice number is required.")
      .max(50, "Invoice number is too long."),
    clientId: z.string().min(1, "Please select a client."),
    projectId: z.string().optional().or(z.literal("")),
    status: z.nativeEnum(InvoiceStatus),
    issueDate: z.string().min(1, "Issue date is required."),
    dueDate: z.string().min(1, "Due date is required."),
    taxRate: z
      .number({ message: "Tax rate must be a number." })
      .min(0, "Tax rate cannot be negative.")
      .max(100, "Tax rate cannot exceed 100%."),
    notes: z
      .string()
      .trim()
      .max(1000, "Notes are too long.")
      .optional()
      .or(z.literal("")),
    items: z
      .array(invoiceItemSchema)
      .min(1, "At least one invoice item is required."),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.issueDate), {
    message: "Due date cannot be earlier than issue date.",
    path: ["dueDate"],
  });

export const invoiceStatusSchema = z.object({
  status: z.nativeEnum(InvoiceStatus),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;