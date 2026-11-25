import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  User,
} from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getClientOptions, getProjectById } from "@/lib/data/projects";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceStatusBadge, ProjectStatusBadge, } from "@/components/shared/status-badge";
import { ProjectDetailActions } from "@/components/projects/project-detail-actions";
import { ProjectTasksCard } from "@/components/projects/project-tasks-card";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { userId } = await requireAuth();
  const { id } = await params;

  const [project, clients] = await Promise.all([
    getProjectById(id, userId),
    getClientOptions(userId),
  ]);

  if (!project) {
    notFound();
  }

  const totalInvoiced = project.invoices.reduce(
    (sum, inv) => sum + inv.total,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header & Back link */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {project.title}
              </h1>
              <ProjectStatusBadge status={project.status} />
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span>Client:</span>
              <Link
                href={`/clients/${project.client.id}`}
                className="font-medium text-foreground hover:underline"
              >
                {project.client.name}
                {project.client.company ? ` (${project.client.company})` : ""}
              </Link>
            </p>
          </div>

          <ProjectDetailActions
            project={{
              id: project.id,
              title: project.title,
              clientId: project.client.id,
              description: project.description,
              status: project.status,
              budget: project.budget,
              startDate: project.startDate,
              deadline: project.deadline,
            }}
            clients={clients}
          />
        </div>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Progress
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">{project.progress}%</div>
            <Progress value={project.progress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {project.tasksCount > 0
                ? `${project.doneTasksCount} of ${project.tasksCount} tasks completed`
                : "No tasks added yet"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Project Budget
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(project.budget)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalInvoiced)} invoiced so far
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Timeline
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-semibold">
              {project.deadline
                ? formatDate(project.deadline.toISOString())
                : "No deadline"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Started:{" "}
              {project.startDate
                ? formatDate(project.startDate.toISOString())
                : "Not set"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Client Contact
            </CardTitle>
            <User className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <Link
              href={`/clients/${project.client.id}`}
              className="text-base font-semibold hover:underline block truncate"
            >
              {project.client.name}
            </Link>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
              <Building2 className="h-3 w-3 shrink-0" />
              {project.client.company || project.client.email}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Description & Tasks Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base">Project Scope & Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {project.description || "No project description provided."}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 shadow-xs">
          <ProjectTasksCard
            projectId={project.id}
            projectTitle={project.title}
            clientName={project.client.name}
            tasks={project.tasks}
          />
        </Card>
      </div>

      {/* Invoices Linked to This Project */}
      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Project Invoices
          </CardTitle>
          <CardDescription>
            Billing records tied to this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {project.invoices.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              No invoices linked to this project yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs font-semibold">
                      <Link href={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(inv.issueDate.toISOString())}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(inv.dueDate.toISOString())}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(inv.total)}
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={inv.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}