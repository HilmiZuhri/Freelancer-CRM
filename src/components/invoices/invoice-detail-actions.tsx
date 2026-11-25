"use client";

import { useState } from "react";
import { InvoiceStatus } from "@prisma/client";
import { CheckCircle2, Pencil, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateInvoiceStatus } from "@/actions/invoices";
import type {
  InvoiceClientOption,
  InvoiceListItem,
  InvoiceProjectOption,
} from "@/lib/data/invoices";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { DeleteInvoiceDialog } from "@/components/invoices/delete-invoice-dialog";

export function InvoiceDetailActions({
  invoice,
  clients,
  projects,
}: {
  invoice: InvoiceListItem;
  clients: InvoiceClientOption[];
  projects: InvoiceProjectOption[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  async function handleStatusChange(newStatus: InvoiceStatus) {
    setIsUpdatingStatus(true);
    try {
      const result = await updateInvoiceStatus(invoice.id, newStatus);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        newStatus === "PAID"
          ? "Invoice marked as paid!"
          : "Invoice status updated."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <Select
          value={invoice.status}
          onValueChange={(value) => handleStatusChange(value as InvoiceStatus)}
          disabled={isUpdatingStatus}
        >
          <SelectTrigger className="w-[130px] bg-card h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>

        {invoice.status !== "PAID" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("PAID")}
            disabled={isUpdatingStatus}
            className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Paid
          </Button>
        )}

        <Button
          size="sm"
          onClick={() => window.print()}
          className="gap-1.5"
        >
          <Printer className="h-4 w-4" />
          Print / Download PDF
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="gap-1.5"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          className="gap-1.5"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <InvoiceFormDialog
        mode="edit"
        clients={clients}
        projects={projects}
        invoice={invoice}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <DeleteInvoiceDialog
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoiceNumber}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        redirectAfterDelete
      />
    </>
  );
}