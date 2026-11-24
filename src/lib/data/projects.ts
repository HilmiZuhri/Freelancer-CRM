import { Prisma, ProjectStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateProjectProgress } from "@/lib/project-utils";

export const PROJECTS_PAGE_SIZE = 6;

export interface ProjectListItem {
  id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  budget: number;
  startDate: Date | null;
  deadline: Date | null;
  clientId: string;
  clientName: string;
  clientCompany: string | null;
  tasksCount: number;
  doneTasksCount: number;
  progress: number;
  createdAt: Date;
}

export interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

interface GetProjectsParams {
  userId: string;
  search?: string;
  status?: string;
  page?: number;
}

export async function getClientOptions(userId: string): Promise<ClientOption[]> {
  return prisma.client.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      company: true,
    },
  });
}

export async function getProjects({
  userId,
  search = "",
  status = "ALL",
  page = 1,
}: GetProjectsParams) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const trimmedSearch = search.trim();

  const where: Prisma.ProjectWhereInput = {
    userId,
  };

  if (trimmedSearch) {
    where.OR = [
      { title: { contains: trimmedSearch, mode: "insensitive" } },
      { client: { name: { contains: trimmedSearch, mode: "insensitive" } } },
      { client: { company: { contains: trimmedSearch, mode: "insensitive" } } },
    ];
  }

  if (
    status !== "ALL" &&
    Object.values(ProjectStatus).includes(status as ProjectStatus)
  ) {
    where.status = status as ProjectStatus;
  }

  const [totalCount, rawProjects] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * PROJECTS_PAGE_SIZE,
      take: PROJECTS_PAGE_SIZE,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        tasks: {
          select: { status: true },
        },
      },
    }),
  ]);

  const projects: ProjectListItem[] = rawProjects.map((project) => {
    const tasksCount = project.tasks.length;
    const doneTasksCount = project.tasks.filter(
      (t) => t.status === "DONE"
    ).length;
    const progress = calculateProjectProgress(project.status, project.tasks);

    return {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      budget: Number(project.budget),
      startDate: project.startDate,
      deadline: project.deadline,
      clientId: project.client.id,
      clientName: project.client.name,
      clientCompany: project.client.company,
      tasksCount,
      doneTasksCount,
      progress,
      createdAt: project.createdAt,
    };
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PROJECTS_PAGE_SIZE));

  return {
    projects,
    totalCount,
    totalPages,
    currentPage: safePage,
  };
}

export async function getProjectById(id: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id, userId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
      },
      tasks: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      },
      invoices: {
        orderBy: { issueDate: "desc" },
      },
    },
  });

  if (!project) return null;

  const tasksCount = project.tasks.length;
  const doneTasksCount = project.tasks.filter((t) => t.status === "DONE").length;
  const progress =
    tasksCount > 0
      ? Math.round((doneTasksCount / tasksCount) * 100)
      : project.status === "COMPLETED"
      ? 100
      : 0;

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    status: project.status,
    budget: Number(project.budget),
    startDate: project.startDate,
    deadline: project.deadline,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    client: project.client,
    tasksCount,
    doneTasksCount,
    progress,
    tasks: project.tasks,
    invoices: project.invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      total: Number(inv.total),
    })),
  };
}