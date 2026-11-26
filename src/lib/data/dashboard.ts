import { prisma } from "@/lib/prisma";
import { calculateProjectProgress } from "@/lib/project-utils";

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

export async function getDashboardData(userId: string) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Build 6-month bucket labels ending on the current month
  const monthBuckets: { key: string; label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short" });
    monthBuckets.push({ key, label, revenue: 0 });
  }

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalClients,
    activeProjectsCount,
    completedProjectsCount,
    unpaidAggregate,
    paidInvoices,
    upcomingTasks,
    recentActivities,
    recentProjectsRaw,
    recentInvoicesRaw,
    recentClientsRaw,
  ] = await Promise.all([
    prisma.client.count({ where: { userId } }),
    prisma.project.count({ where: { userId, status: "IN_PROGRESS" } }),
    prisma.project.count({ where: { userId, status: "COMPLETED" } }),
    prisma.invoice.aggregate({
      where: { userId, status: { in: ["UNPAID", "OVERDUE"] } },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.invoice.findMany({
      where: { userId, status: "PAID" },
      select: { total: true, paidAt: true, issueDate: true },
    }),
    prisma.task.findMany({
      where: {
        userId,
        status: { not: "DONE" },
        dueDate: { not: null },
      },
      orderBy: { dueDate: "asc" },
      take: 4,
      include: {
        project: { select: { id: true, title: true } },
      },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        client: { select: { name: true } },
        tasks: { select: { status: true } },
      },
    }),
    prisma.invoice.findMany({
      where: { userId },
      orderBy: [{ issueDate: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: {
        client: { select: { name: true } },
      },
    }),
    prisma.client.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        _count: { select: { projects: true } },
        invoices: {
          where: { status: { in: ["PAID", "UNPAID", "OVERDUE"] } },
          select: { total: true },
        },
      },
    }),
  ]);

  // Compute total revenue & populate 6-month revenue chart
  let totalRevenue = 0;
  for (const inv of paidInvoices) {
    const amount = Number(inv.total);
    totalRevenue += amount;

    const effectiveDate = inv.paidAt ?? inv.issueDate;
    if (effectiveDate >= sixMonthsAgo) {
      const key = `${effectiveDate.getFullYear()}-${String(
        effectiveDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const bucket = monthBuckets.find((b) => b.key === key);
      if (bucket) {
        bucket.revenue = Number((bucket.revenue + amount).toFixed(2));
      }
    }
  }

  const currentMonthRevenue = monthBuckets[monthBuckets.length - 1]?.revenue ?? 0;
  const previousMonthRevenue = monthBuckets[monthBuckets.length - 2]?.revenue ?? 0;
  let revenueTrendPercent: number | null = null;
  if (previousMonthRevenue > 0) {
    revenueTrendPercent = Math.round(
      ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    );
  }

  const monthlyRevenue: MonthlyRevenuePoint[] = monthBuckets.map(
    ({ label, revenue }) => ({
      month: label,
      revenue,
    })
  );

  const upcomingDeadlines = upcomingTasks.map((task) => {
    const due = task.dueDate!;
    const dueMidnight = new Date(due);
    dueMidnight.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil(
      (dueMidnight.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: task.id,
      title: task.title,
      projectId: task.project.id,
      projectTitle: task.project.title,
      priority: task.priority,
      dueDate: due,
      daysLeft,
    };
  });

  const recentProjects = recentProjectsRaw.map((p) => ({
    id: p.id,
    title: p.title,
    clientName: p.client.name,
    status: p.status,
    progress: calculateProjectProgress(p.status, p.tasks),
  }));

  const recentInvoices = recentInvoicesRaw.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    clientName: inv.client.name,
    total: Number(inv.total),
    status: inv.status,
  }));

  const recentClients = recentClientsRaw.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    projectsCount: c._count.projects,
    totalBilled: c.invoices.reduce((sum, inv) => sum + Number(inv.total), 0),
  }));

  return {
    kpis: {
      totalRevenue,
      currentMonthRevenue,
      revenueTrendPercent,
      unpaidAmount: Number(unpaidAggregate._sum.total ?? 0),
      unpaidCount: unpaidAggregate._count.id,
      activeProjectsCount,
      completedProjectsCount,
      totalClients,
    },
    monthlyRevenue,
    upcomingDeadlines,
    recentActivities,
    recentProjects,
    recentInvoices,
    recentClients,
  };
}