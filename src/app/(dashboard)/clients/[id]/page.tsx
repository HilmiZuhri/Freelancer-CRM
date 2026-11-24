import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  FolderKanban,
  Mail,
  MapPin,
  Phone,
  StickyNote,
} from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getClientById } from "@/lib/data/clients";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  InvoiceStatusBadge,
  ProjectStatusBadge,
} from "@/components/shared/status-badge";
import { ClientDetailActions } from "@/components/clients/client-detail-actions";

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { userId } = await requireAuth();
  const { id } = await params;

  const client = await getClientById(id, userId);

  if (!client) {
    notFound();
  }

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalPaid = client.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-6">
      {/* Back link & Header */}
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" asChild>
          <Link href="/clients">
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {client.name}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {client.company && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {client.company}
                  </span>
                )}
                <span>•</span>
                <span>Client since {formatDate(client.createdAt.toISOString())}</span>
              </p>
            </div>
          </div>

          <ClientDetailActions
            client={{
              id: client.id,
              name: client.name,
              email: client.email,
              phone: client.phone,
              company: client.company,
              address: client.address,
              notes: client.notes,
            }}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Contact Details & Notes */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium break-all">{client.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{client.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium whitespace-pre-line">
                    {client.address || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-border">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-muted-foreground whitespace-pre-line mt-0.5">
                    {client.notes || "No additional notes."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Client Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Projects</p>
                <p className="text-xl font-bold mt-0.5">
                  {client.projects.length}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Total Paid</p>
                <p className="text-xl font-bold mt-0.5">
                  {formatCurrency(totalPaid)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Project History & Invoices */}
        <div className="lg:col-span-8 space-y-6">
          {/* Project History */}
          <Card className="shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-primary" />
                  Project History
                </CardTitle>
                <CardDescription>
                  Projects associated with {client.name}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {client.projects.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  No projects created for this client yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Deadline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/projects/${project.id}`}
                            className="hover:underline text-foreground"
                          >
                            {project.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <ProjectStatusBadge status={project.status} />
                        </TableCell>
                        <TableCell className="w-28">
                          <div className="flex items-center gap-2">
                            <Progress value={project.progress} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {project.progress}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(project.budget)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {project.deadline ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(project.deadline.toISOString())}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card className="shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Invoices
              </CardTitle>
              <CardDescription>
                Billing history for this client
              </CardDescription>
            </CardHeader>
            <CardContent>
              {client.invoices.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                  No invoices issued to this client yet.
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
                    {client.invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          {inv.invoiceNumber}
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
      </div>
    </div>
  );
}