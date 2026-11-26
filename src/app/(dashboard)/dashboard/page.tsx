import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  FileWarning,
  FolderKanban,
  Users,
} from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getDashboardData } from "@/lib/data/dashboard";
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
} from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InvoiceStatusBadge,
  PriorityBadge,
  ProjectStatusBadge,
} from "@/components/shared/status-badge";
import { RevenueChart } from "@/components/dashboard/revenue-chart";

export default async function DashboardPage() {
  const { userId, user } = await requireAuth();
  const {
    kpis,
    monthlyRevenue,
    upcomingDeadlines,
    recentActivities,
    recentProjects,
    recentInvoices,
    recentClients,
  } = await getDashboardData(userId);

  const firstName = user.name?.split(" ")[0] ?? "there";

  const kpiCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(kpis.totalRevenue),
      description: `${formatCurrency(kpis.currentMonthRevenue)} earned this month`,
      icon: DollarSign,
      iconBg: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Unpaid Invoices",
      value: formatCurrency(kpis.unpaidAmount),
      description: `${kpis.unpaidCount} ${
        kpis.unpaidCount === 1 ? "invoice" : "invoices"
      } awaiting payment`,
      icon: FileWarning,
      iconBg: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Active Projects",
      value: kpis.activeProjectsCount.toString(),
      description: "Currently in progress",
      icon: FolderKanban,
      iconBg: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Completed Projects",
      value: kpis.completedProjectsCount.toString(),
      description: "Delivered to clients",
      icon: CheckCircle2,
      iconBg: "bg-indigo-500/10 text-indigo-600",
    },
    {
      title: "Total Clients",
      value: kpis.totalClients.toString(),
      description: "Saved client accounts",
      icon: Users,
      iconBg: "bg-violet-500/10 text-violet-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {firstName}. Here is a live overview of your freelance
            business.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients">Manage Clients</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/invoices">Manage Invoices</Link>
          </Button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title} className="shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">
                  {kpi.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Middle Row: Recharts Revenue Overview & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Revenue Overview
              </CardTitle>
              <CardDescription>
                Paid earnings over the last 6 months
              </CardDescription>
            </div>
            {kpis.revenueTrendPercent !== null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border",
                  kpis.revenueTrendPercent >= 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                )}
              >
                {kpis.revenueTrendPercent >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {kpis.revenueTrendPercent >= 0 ? "+" : ""}
                {kpis.revenueTrendPercent}% vs last month
              </span>
            )}
          </CardHeader>
          <CardContent>
            <RevenueChart data={monthlyRevenue} />
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="lg:col-span-5 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Pending tasks with due dates</CardDescription>
            </div>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                No upcoming task deadlines.{" "}
                <Link href="/tasks" className="text-primary hover:underline">
                  Create a task
                </Link>
              </div>
            ) : (
              upcomingDeadlines.map((deadline) => (
                <Link
                  key={deadline.id}
                  href={`/projects/${deadline.projectId}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 bg-background/50 hover:bg-muted/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium leading-snug truncate">
                      {deadline.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {deadline.projectTitle}
                    </p>
                    <div className="flex items-center gap-2 pt-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={cn(
                          "text-xs",
                          deadline.daysLeft < 0
                            ? "text-destructive font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        Due {formatDate(deadline.dueDate.toISOString())} (
                        {deadline.daysLeft < 0
                          ? `Overdue by ${Math.abs(deadline.daysLeft)}d`
                          : deadline.daysLeft === 0
                          ? "Due today"
                          : `${deadline.daysLeft}d left`}
                        )
                      </span>
                    </div>
                  </div>
                  <PriorityBadge priority={deadline.priority} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Overview Tables + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-8 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Business Records
            </CardTitle>
            <CardDescription>
              Quick view of your recent projects, invoices, and clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="projects" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                <TabsTrigger value="clients">Clients</TabsTrigger>
              </TabsList>

              <TabsContent value="projects">
                {recentProjects.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    No projects yet.{" "}
                    <Link
                      href="/projects"
                      className="text-primary hover:underline"
                    >
                      Create your first project
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/projects/${project.id}`}
                              className="hover:underline"
                            >
                              {project.title}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {project.clientName}
                          </TableCell>
                          <TableCell className="w-32">
                            <div className="flex items-center gap-2">
                              <Progress
                                value={project.progress}
                                className="h-2"
                              />
                              <span className="text-xs text-muted-foreground">
                                {project.progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <ProjectStatusBadge status={project.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="invoices">
                {recentInvoices.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    No invoices yet.{" "}
                    <Link
                      href="/invoices"
                      className="text-primary hover:underline"
                    >
                      Issue an invoice
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice #</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentInvoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell className="font-mono text-xs font-medium">
                            <Link
                              href={`/invoices/${inv.id}`}
                              className="hover:underline"
                            >
                              {inv.invoiceNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{inv.clientName}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(inv.total, true)}
                          </TableCell>
                          <TableCell>
                            <InvoiceStatusBadge status={inv.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="clients">
                {recentClients.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    No clients yet.{" "}
                    <Link
                      href="/clients"
                      className="text-primary hover:underline"
                    >
                      Add a client
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead className="text-right">
                          Total Billed
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell className="font-medium">
                            <Link
                              href={`/clients/${client.id}`}
                              className="hover:underline"
                            >
                              {client.name}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {client.company || "—"}
                          </TableCell>
                          <TableCell>{client.projectsCount}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(client.totalBilled)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-4 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions in your CRM</CardDescription>
            </div>
            <Link
              href="/activity"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-5">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-medium leading-none">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70 pt-0.5">
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}