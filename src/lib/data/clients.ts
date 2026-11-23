import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const CLIENTS_PAGE_SIZE = 6;

export type ClientFilterOption = "all" | "with_projects" | "no_projects";

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  address: string | null;
  notes: string | null;
  projectsCount: number;
  totalBilled: number;
  createdAt: Date;
}

interface GetClientsParams {
  userId: string;
  search?: string;
  filter?: string;
  page?: number;
}

export async function getClients({
  userId,
  search = "",
  filter = "all",
  page = 1,
}: GetClientsParams) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const trimmedSearch = search.trim();

  const where: Prisma.ClientWhereInput = {
    userId,
  };

  if (trimmedSearch) {
    where.OR = [
      { name: { contains: trimmedSearch, mode: "insensitive" } },
      { email: { contains: trimmedSearch, mode: "insensitive" } },
      { company: { contains: trimmedSearch, mode: "insensitive" } },
      { phone: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }

  if (filter === "with_projects") {
    where.projects = { some: {} };
  } else if (filter === "no_projects") {
    where.projects = { none: {} };
  }

  const [totalCount, rawClients] = await Promise.all([
    prisma.client.count({ where }),
    prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * CLIENTS_PAGE_SIZE,
      take: CLIENTS_PAGE_SIZE,
      include: {
        _count: {
          select: { projects: true },
        },
        invoices: {
          where: { status: { in: ["PAID", "UNPAID", "OVERDUE"] } },
          select: { total: true },
        },
      },
    }),
  ]);

  const clients: ClientListItem[] = rawClients.map((client) => ({
    id: client.id,
    name: client.name,
    email: client.email,
    phone: client.phone,
    company: client.company,
    address: client.address,
    notes: client.notes,
    projectsCount: client._count.projects,
    totalBilled: client.invoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0
    ),
    createdAt: client.createdAt,
  }));

  const totalPages = Math.max(1, Math.ceil(totalCount / CLIENTS_PAGE_SIZE));

  return {
    clients,
    totalCount,
    totalPages,
    currentPage: safePage,
  };
}

export async function getClientById(id: string, userId: string) {
  const client = await prisma.client.findFirst({
    where: { id, userId },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { tasks: true },
          },
          tasks: {
            select: { status: true },
          },
        },
      },
      invoices: {
        orderBy: { issueDate: "desc" },
      },
    },
  });

  if (!client) return null;

  return {
    ...client,
    projects: client.projects.map((p) => {
      const totalTasks = p.tasks.length;
      const doneTasks = p.tasks.filter((t) => t.status === "DONE").length;
      const progress =
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

      return {
        id: p.id,
        title: p.title,
        status: p.status,
        budget: Number(p.budget),
        startDate: p.startDate,
        deadline: p.deadline,
        tasksCount: p._count.tasks,
        progress,
      };
    }),
    invoices: client.invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      total: Number(inv.total),
    })),
  };
}