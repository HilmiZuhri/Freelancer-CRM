import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  FileWarning,
  FolderKanban,
  Users,
} from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  mockActivities,
  mockClients,
  mockDeadlines,
  mockInvoices,
  mockMonthlyRevenue,
  mockProjects,
} from "@/lib/mock-data";

export default function DashboardPage() {
  const totalClients = mockClients.length;
  const activeProjects = mockProjects.filter(
    (p) => p.status === "IN_PROGRESS"
  ).length;
  const completedProjects = mockProjects.filter(
    (p) => p.status === "COMPLETED"
  ).length;
  const unpaidInvoices = mockInvoices.filter(
    (inv) => inv.status === "UNPAID" || inv.status === "OVERDUE"
  );
  const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalRevenue = mockInvoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const maxRevenue = Math.max(...mockMonthlyRevenue.map((m) => m.revenue));

  const kpiCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(totalRevenue),
      description: "+18.2% from last month",
      icon: DollarSign,
      iconBg: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Unpaid Invoices",
      value: formatCurrency(unpaidAmount),
      description: `${unpaidInvoices.length} invoices awaiting payment`,
      icon: FileWarning,
      iconBg: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Active Projects",
      value: activeProjects.toString(),
      description: "Currently in progress",
      icon: FolderKanban,
      iconBg: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Completed Projects",
      value: completedProjects.toString(),
      description: "Delivered on schedule",
      icon: CheckCircle2,
      iconBg: "bg-indigo-500/10 text-indigo-600",
    },
    {
      title: "Total Clients",
      value: totalClients.toString(),
      description: "Active business accounts",
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
            Welcome back, Alex. Here is an overview of your freelance business.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/clients">View Clients</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/invoices">Create Invoice</Link>
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

      {/* Middle Row: Revenue Overview & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Summary Chart Placeholder (Will be upgraded to Recharts in Phase 10) */}
        <Card className="lg:col-span-7 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Revenue Overview
              </CardTitle>
              <CardDescription>
                Monthly earnings over the last 6 months
              </CardDescription>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
              <ArrowUpRight className="h-3.5 w-3.5" /> +24.5%
            </span>
          </CardHeader>
          <CardContent>
            <div className="h-60 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
              {mockMonthlyRevenue.map((item) => {
                const heightPercent = Math.round(
                  (item.revenue / maxRevenue) * 100
                );
                return (
                  <div
                    key={item.month}
                    className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
                  >
                    <span className="text-[11px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatCurrency(item.revenue)}
                    </span>
                    <div className="w-full max-w-12 bg-muted/60 rounded-t-md h-44 flex items-end overflow-hidden">
                      <div
                        className="w-full bg-primary/85 group-hover:bg-primary rounded-t-md transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="lg:col-span-5 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Upcoming Deadlines
              </CardTitle>
              <CardDescription>Tasks requiring your attention</CardDescription>
            </div>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {mockDeadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 bg-background/50"
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium leading-snug truncate">
                    {deadline.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {deadline.projectTitle}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Due {formatDate(deadline.dueDate)} ({deadline.daysLeft}d left)
                    </span>
                  </div>
                </div>
                <PriorityBadge priority={deadline.priority} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Overview Tables + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tabbed Overview Tables */}
        <Card className="lg:col-span-8 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Business Records
            </CardTitle>
            <CardDescription>
              Quick view of your recent projects, clients, and invoices
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
                    {mockProjects.slice(0, 4).map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          {project.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {project.clientName}
                        </TableCell>
                        <TableCell className="w-32">
                          <div className="flex items-center gap-2">
                            <Progress value={project.progress} className="h-2" />
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
              </TabsContent>

              <TabsContent value="invoices">
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
                    {mockInvoices.slice(0, 4).map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs font-medium">
                          {inv.invoiceNumber}
                        </TableCell>
                        <TableCell>{inv.clientName}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(inv.amount)}
                        </TableCell>
                        <TableCell>
                          <InvoiceStatusBadge status={inv.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="clients">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead className="text-right">Total Billed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockClients.slice(0, 4).map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.company}
                        </TableCell>
                        <TableCell>{client.projectsCount}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(client.totalBilled)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="lg:col-span-4 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions in your CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {mockActivities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">
                      {activity.action}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.target}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 pt-0.5">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}