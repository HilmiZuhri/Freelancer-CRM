import { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const INVOICES_PAGE_SIZE = 6;

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidAt: Date | null;
  subtotal: number;
  taxRate: number;
  total: number;
  notes: string | null;
  clientId: string;
  clientName: string;
  clientCompany: string | null;
  projectId: string | null;
  projectTitle: string | null;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
}

export interface InvoiceClientOption {
  id: string;
  name: string;
  company: string | null;
}

export interface InvoiceProjectOption {
  id: string;
  title: string;
  clientId: string;
}

export async function getNextInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const existingInvoices = await prisma.invoice.findMany({
    where: {
      userId,
      invoiceNumber: { startsWith: prefix },
    },
    select: { invoiceNumber: true },
  });

  let maxNum = 0;
  for (const inv of existingInvoices) {
    const suffix = inv.invoiceNumber.slice(prefix.length);
    const parsed = parseInt(suffix, 10);
    if (!Number.isNaN(parsed) && parsed > maxNum) {
      maxNum = parsed;
    }
  }

  return `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
}

export async function getInvoiceFormOptions(userId: string): Promise<{
  clients: InvoiceClientOption[];
  projects: InvoiceProjectOption[];
}> {
  const [clients, projects] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, clientId: true },
    }),
  ]);

  return { clients, projects };
}

interface GetInvoicesParams {
  userId: string;
  search?: string;
  status?: string;
  page?: number;
}

export async function getInvoices({
  userId,
  search = "",
  status = "ALL",
  page = 1,
}: GetInvoicesParams) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const trimmedSearch = search.trim();

  const where: Prisma.InvoiceWhereInput = {
    userId,
  };

  if (trimmedSearch) {
    where.OR = [
      { invoiceNumber: { contains: trimmedSearch, mode: "insensitive" } },
      { client: { name: { contains: trimmedSearch, mode: "insensitive" } } },
      { client: { company: { contains: trimmedSearch, mode: "insensitive" } } },
      { project: { title: { contains: trimmedSearch, mode: "insensitive" } } },
    ];
  }

  if (
    status !== "ALL" &&
    Object.values(InvoiceStatus).includes(status as InvoiceStatus)
  ) {
    where.status = status as InvoiceStatus;
  }

  const [totalCount, rawInvoices] = await Promise.all([
    prisma.invoice.count({ where }),
    prisma.invoice.findMany({
      where,
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      skip: (safePage - 1) * INVOICES_PAGE_SIZE,
      take: INVOICES_PAGE_SIZE,
      include: {
        client: {
          select: { id: true, name: true, company: true },
        },
        project: {
          select: { id: true, title: true },
        },
        items: true,
      },
    }),
  ]);

  const invoices: InvoiceListItem[] = rawInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    status: inv.status,
    issueDate: inv.issueDate,
    dueDate: inv.dueDate,
    paidAt: inv.paidAt,
    subtotal: Number(inv.subtotal),
    taxRate: Number(inv.taxRate),
    total: Number(inv.total),
    notes: inv.notes,
    clientId: inv.client.id,
    clientName: inv.client.name,
    clientCompany: inv.client.company,
    projectId: inv.project?.id ?? null,
    projectTitle: inv.project?.title ?? null,
    items: inv.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / INVOICES_PAGE_SIZE));

  return {
    invoices,
    totalCount,
    totalPages,
    currentPage: safePage,
  };
}

export async function getInvoiceById(id: string, userId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id, userId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          businessName: true,
          phone: true,
          address: true,
        },
      },
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          company: true,
          address: true,
        },
      },
      project: {
        select: {
          id: true,
          title: true,
        },
      },
      items: true,
    },
  });

  if (!invoice) return null;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    paidAt: invoice.paidAt,
    subtotal: Number(invoice.subtotal),
    taxRate: Number(invoice.taxRate),
    total: Number(invoice.total),
    notes: invoice.notes,
    createdAt: invoice.createdAt,
    user: invoice.user,
    client: invoice.client,
    project: invoice.project,
    items: invoice.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
  };
}