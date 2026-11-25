"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type {
  InvoiceClientOption,
  InvoiceListItem,
  InvoiceProjectOption,
} from "@/lib/data/invoices";
import { updateInvoiceStatus } from "@/actions/invoices";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";

interface InvoicesTableProps {
  invoices: InvoiceListItem[];
  clients: InvoiceClientOption[];
  projects: InvoiceProjectOption[];
  nextInvoiceNumber: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasActiveSearchOrFilter: boolean;
}

export function InvoicesTable({
  invoices,
  clients,
  projects,
  nextInvoiceNumber,
  totalCount,
  currentPage,
  totalPages,
  hasActiveSearchOrFilter,
}: InvoicesTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editingInvoice, setEditingInvoice] = useState<InvoiceListItem | null>(
    null
  );
  const [deletingInvoice, setDeletingInvoice] = useState<{
    id: string;
    invoiceNumber: string;
  } | null>(null);

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleMarkAsPaid(invoiceId: string, invoiceNumber: string) {
    const result = await updateInvoiceStatus(invoiceId, "PAID");
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Invoice ${invoiceNumber} marked as paid!`);
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <FileText className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold">
          {hasActiveSearchOrFilter
            ? "No matching invoices found"
            : "No invoices yet"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
          {hasActiveSearchOrFilter
            ? "Try adjusting your search query or status filter."
            : "Create your first invoice to bill clients and track payments."}
        </p>
        {!hasActiveSearchOrFilter && (
          <InvoiceFormDialog
            mode="create"
            clients={clients}
            projects={projects}
            defaultInvoiceNumber={nextInvoiceNumber}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="font-mono text-xs font-semibold text-foreground hover:underline"
                  >
                    {inv.invoiceNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/clients/${inv.clientId}`}
                    className="font-medium hover:underline"
                  >
                    {inv.clientName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-xs truncate">
                  {inv.projectTitle || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(inv.issueDate.toISOString())}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(inv.dueDate.toISOString())}
                </TableCell>
                <TableCell className="font-semibold">
                  {formatCurrency(inv.total, true)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={inv.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View & Print PDF
                        </Link>
                      </DropdownMenuItem>
                      {inv.status !== "PAID" && (
                        <DropdownMenuItem
                          onClick={() =>
                            handleMarkAsPaid(inv.id, inv.invoiceNumber)
                          }
                          className="text-emerald-600 focus:text-emerald-600 cursor-pointer"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setEditingInvoice(inv)}
                        className="cursor-pointer"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Invoice
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() =>
                          setDeletingInvoice({
                            id: inv.id,
                            invoiceNumber: inv.invoiceNumber,
                          })
                        }
                        className="text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <p className="text-xs text-muted-foreground">
          Showing page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span> ({totalCount}{" "}
          {totalCount === 1 ? "invoice" : "invoices"} total)
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {editingInvoice && (
        <InvoiceFormDialog
          mode="edit"
          clients={clients}
          projects={projects}
          invoice={editingInvoice}
          open={Boolean(editingInvoice)}
          onOpenChange={(open) => {
            if (!open) setEditingInvoice(null);
          }}
        />
      )}

      {deletingInvoice && (
        <DeleteInvoiceDialog
          invoiceId={deletingInvoice.id}
          invoiceNumber={deletingInvoice.invoiceNumber}
          open={Boolean(deletingInvoice)}
          onOpenChange={(open) => {
            if (!open) setDeletingInvoice(null);
          }}
        />
      )}
    </>
  );
}