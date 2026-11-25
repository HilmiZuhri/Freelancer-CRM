import { requireAuth } from "@/lib/auth-utils";
import {
  getInvoiceFormOptions,
  getInvoices,
  getNextInvoiceNumber,
} from "@/lib/data/invoices";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { InvoicesToolbar } from "@/components/invoices/invoices-toolbar";
import { InvoicesTable } from "@/components/invoices/invoices-table";

interface InvoicesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
  const { userId } = await requireAuth();
  const params = await searchParams;

  const search = params.search ?? "";
  const status = params.status ?? "ALL";
  const page = Number(params.page) || 1;

  const [
    { invoices, totalCount, totalPages, currentPage },
    { clients, projects },
    nextInvoiceNumber,
  ] = await Promise.all([
    getInvoices({ userId, search, status, page }),
    getInvoiceFormOptions(userId),
    getNextInvoiceNumber(userId),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            Create itemized invoices, track payments, and export PDFs.
          </p>
        </div>
        <InvoiceFormDialog
          mode="create"
          clients={clients}
          projects={projects}
          defaultInvoiceNumber={nextInvoiceNumber}
        />
      </div>

      <InvoicesToolbar initialSearch={search} initialStatus={status} />

      <InvoicesTable
        invoices={invoices}
        clients={clients}
        projects={projects}
        nextInvoiceNumber={nextInvoiceNumber}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        hasActiveSearchOrFilter={Boolean(search || status !== "ALL")}
      />
    </div>
  );
}