import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase } from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { getInvoiceById, getInvoiceFormOptions } from "@/lib/data/invoices";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { InvoiceDetailActions } from "@/components/invoices/invoice-detail-actions";

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({
  params,
}: InvoiceDetailPageProps) {
  const { userId } = await requireAuth();
  const { id } = await params;

  const [invoice, { clients, projects }] = await Promise.all([
    getInvoiceById(id, userId),
    getInvoiceFormOptions(userId),
  ]);

  if (!invoice) {
    notFound();
  }

  const taxAmount = (invoice.subtotal * invoice.taxRate) / 100;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Action Bar (hidden when printing PDF) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <Button variant="ghost" size="sm" className="-ml-2 gap-1.5" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Link>
        </Button>

        <InvoiceDetailActions
          invoice={{
            id: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
            issueDate: invoice.issueDate,
            dueDate: invoice.dueDate,
            paidAt: invoice.paidAt,
            subtotal: invoice.subtotal,
            taxRate: invoice.taxRate,
            total: invoice.total,
            notes: invoice.notes,
            clientId: invoice.client.id,
            clientName: invoice.client.name,
            clientCompany: invoice.client.company,
            projectId: invoice.project?.id ?? null,
            projectTitle: invoice.project?.title ?? null,
            items: invoice.items,
          }}
          clients={clients}
          projects={projects}
        />
      </div>

      {/* Printable A4 Invoice Document */}
      <div className="rounded-xl border border-border bg-white text-slate-900 p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Briefcase className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                {invoice.user.businessName || invoice.user.name || "Freelancer Studio"}
              </span>
            </div>
            <div className="text-xs text-slate-500 space-y-0.5">
              {invoice.user.name && <p>{invoice.user.name}</p>}
              <p>{invoice.user.email}</p>
              {invoice.user.phone && <p>{invoice.user.phone}</p>}
              {invoice.user.address && (
                <p className="whitespace-pre-line">{invoice.user.address}</p>
              )}
            </div>
          </div>

          <div className="sm:text-right space-y-2">
            <div className="flex sm:justify-end items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight uppercase text-slate-900">
                Invoice
              </h1>
              <div className="print:hidden">
                <InvoiceStatusBadge status={invoice.status} />
              </div>
            </div>
            <p className="font-mono text-sm font-semibold text-slate-700">
              {invoice.invoiceNumber}
            </p>
            <div className="text-xs text-slate-500 space-y-0.5 pt-1">
              <p>
                Issue Date:{" "}
                <span className="font-medium text-slate-800">
                  {formatDate(invoice.issueDate.toISOString())}
                </span>
              </p>
              <p>
                Due Date:{" "}
                <span className="font-medium text-slate-800">
                  {formatDate(invoice.dueDate.toISOString())}
                </span>
              </p>
              {invoice.paidAt && (
                <p className="text-emerald-700 font-medium">
                  Paid on {formatDate(invoice.paidAt.toISOString())}
                </p>
              )}
            </div>
          </div>
        </div>

        <Separator className="bg-slate-200" />

        {/* Bill To & Project Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Bill To
            </p>
            <p className="text-base font-semibold text-slate-900">
              {invoice.client.name}
            </p>
            {invoice.client.company && (
              <p className="text-sm font-medium text-slate-700">
                {invoice.client.company}
              </p>
            )}
            <p className="text-xs text-slate-500">{invoice.client.email}</p>
            {invoice.client.phone && (
              <p className="text-xs text-slate-500">{invoice.client.phone}</p>
            )}
            {invoice.client.address && (
              <p className="text-xs text-slate-500 whitespace-pre-line">
                {invoice.client.address}
              </p>
            )}
          </div>

          {invoice.project && (
            <div className="space-y-1.5 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Project Reference
              </p>
              <p className="text-sm font-medium text-slate-800">
                {invoice.project.title}
              </p>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50 border-slate-200">
                <TableHead className="text-slate-700 font-semibold">
                  Description
                </TableHead>
                <TableHead className="text-right text-slate-700 font-semibold w-24">
                  Qty
                </TableHead>
                <TableHead className="text-right text-slate-700 font-semibold w-32">
                  Unit Price
                </TableHead>
                <TableHead className="text-right text-slate-700 font-semibold w-32">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-slate-200 hover:bg-transparent"
                >
                  <TableCell className="font-medium text-slate-800">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {formatCurrency(item.unitPrice, true)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">
                    {formatCurrency(item.amount, true)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end pt-6">
          <div className="w-full sm:w-72 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.subtotal, true)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax ({invoice.taxRate}%)</span>
              <span>{formatCurrency(taxAmount, true)}</span>
            </div>
            <Separator className="bg-slate-200 my-2" />
            <div className="flex justify-between text-lg font-bold text-slate-900">
              <span>Total Due</span>
              <span>{formatCurrency(invoice.total, true)}</span>
            </div>
          </div>
        </div>

        {/* Notes / Payment Instructions */}
        {invoice.notes && (
          <div className="mt-10 pt-6 border-t border-slate-200 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Payment Instructions & Notes
            </p>
            <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
              {invoice.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}