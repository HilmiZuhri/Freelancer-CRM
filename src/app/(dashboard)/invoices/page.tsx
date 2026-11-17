import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import { mockInvoices } from "@/lib/mock-data";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Create, send, and track client billing and payments.
          </p>
        </div>
        <Button className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <InvoicesTable invoices={mockInvoices} />
    </div>
  );
}