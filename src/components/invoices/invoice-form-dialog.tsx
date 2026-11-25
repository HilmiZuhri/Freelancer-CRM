"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { InvoiceStatus } from "@prisma/client";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { invoiceSchema, type InvoiceInput } from "@/validations/invoice";
import { createInvoice, updateInvoice } from "@/actions/invoices";
import type {
  InvoiceClientOption,
  InvoiceListItem,
  InvoiceProjectOption,
} from "@/lib/data/invoices";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface InvoiceFormDialogProps {
  mode: "create" | "edit";
  clients: InvoiceClientOption[];
  projects: InvoiceProjectOption[];
  defaultInvoiceNumber?: string;
  invoice?: InvoiceListItem;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

function toDateInputValue(date?: Date | null): string {
  if (!date) return new Date().toISOString().split("T")[0];
  return new Date(date).toISOString().split("T")[0];
}

function addDaysToToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function InvoiceFormDialog({
  mode,
  clients,
  projects,
  defaultInvoiceNumber = "",
  invoice,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: InvoiceFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: invoice?.invoiceNumber ?? defaultInvoiceNumber,
      clientId: invoice?.clientId ?? clients[0]?.id ?? "",
      projectId: invoice?.projectId ?? "NONE",
      status: invoice?.status ?? "UNPAID",
      issueDate: invoice
        ? toDateInputValue(invoice.issueDate)
        : toDateInputValue(),
      dueDate: invoice
        ? toDateInputValue(invoice.dueDate)
        : addDaysToToday(14),
      taxRate: invoice?.taxRate ?? 0,
      notes: invoice?.notes ?? "",
      items:
        invoice?.items && invoice.items.length > 0
          ? invoice.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            }))
          : [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const selectedClientId = watch("clientId");
  const selectedProjectId = watch("projectId");
  const selectedStatus = watch("status");
  const watchedItems = watch("items");
  const watchedTaxRate = watch("taxRate") || 0;

  // Filter projects to only show projects belonging to the selected client
  const clientProjects = projects.filter(
    (p) => p.clientId === selectedClientId
  );

  // Live financial preview
  const subtotal = (watchedItems || []).reduce((sum, item) => {
    const qty = Number(item?.quantity) || 0;
    const price = Number(item?.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
  const taxAmount = (subtotal * Number(watchedTaxRate)) / 100;
  const total = subtotal + taxAmount;

  useEffect(() => {
    if (open) {
      reset({
        invoiceNumber: invoice?.invoiceNumber ?? defaultInvoiceNumber,
        clientId: invoice?.clientId ?? clients[0]?.id ?? "",
        projectId: invoice?.projectId ?? "NONE",
        status: invoice?.status ?? "UNPAID",
        issueDate: invoice
          ? toDateInputValue(invoice.issueDate)
          : toDateInputValue(),
        dueDate: invoice
          ? toDateInputValue(invoice.dueDate)
          : addDaysToToday(14),
        taxRate: invoice?.taxRate ?? 0,
        notes: invoice?.notes ?? "",
        items:
          invoice?.items && invoice.items.length > 0
            ? invoice.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              }))
            : [{ description: "", quantity: 1, unitPrice: 0 }],
      });
    }
  }, [open, invoice, defaultInvoiceNumber, clients, reset]);

  function handleClientChange(newClientId: string) {
    setValue("clientId", newClientId, { shouldValidate: true });
    // Reset project selection if current project does not belong to new client
    const stillValid = projects.some(
      (p) => p.id === selectedProjectId && p.clientId === newClientId
    );
    if (!stillValid) {
      setValue("projectId", "NONE");
    }
  }

  async function onSubmit(data: InvoiceInput) {
    setIsSubmitting(true);
    try {
      const result =
        mode === "create"
          ? await createInvoice(data)
          : await updateInvoice(invoice!.id, data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === "create"
          ? "Invoice created successfully."
          : "Invoice updated successfully."
      );
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === "create" && !isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              Create Invoice
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Invoice" : "Edit Invoice"}
          </DialogTitle>
          <DialogDescription>
            Add line items, set due dates, and calculate totals automatically.
          </DialogDescription>
        </DialogHeader>

        {clients.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              You need at least one client before issuing an invoice.
            </p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/clients">Go to Clients</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
            {/* Top Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-number">
                  Invoice # <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="inv-number"
                  className="font-mono"
                  disabled={isSubmitting}
                  {...register("invoiceNumber")}
                />
                {errors.invoiceNumber && (
                  <p className="text-xs text-destructive">
                    {errors.invoiceNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  Client <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedClientId}
                  onValueChange={handleClientChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.company ? ` (${c.company})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && (
                  <p className="text-xs text-destructive">
                    {errors.clientId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Project (Optional)</Label>
                <Select
                  value={selectedProjectId || "NONE"}
                  onValueChange={(val) => setValue("projectId", val)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No specific project</SelectItem>
                    {clientProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates & Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-issue">Issue Date</Label>
                <Input
                  id="inv-issue"
                  type="date"
                  disabled={isSubmitting}
                  {...register("issueDate")}
                />
                {errors.issueDate && (
                  <p className="text-xs text-destructive">
                    {errors.issueDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-due">Due Date</Label>
                <Input
                  id="inv-due"
                  type="date"
                  disabled={isSubmitting}
                  {...register("dueDate")}
                />
                {errors.dueDate && (
                  <p className="text-xs text-destructive">
                    {errors.dueDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(val) =>
                    setValue("status", val as InvoiceStatus)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inv-tax">Tax Rate (%)</Label>
                <Input
                  id="inv-tax"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  disabled={isSubmitting}
                  {...register("taxRate", {
                    setValueAs: (v) => (v === "" ? 0 : Number(v)),
                  })}
                />
                {errors.taxRate && (
                  <p className="text-xs text-destructive">
                    {errors.taxRate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Line Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ description: "", quantity: 1, unitPrice: 0 })
                  }
                  disabled={isSubmitting}
                  className="gap-1 h-8 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
                {fields.map((field, index) => {
                  const rowQty = Number(watchedItems?.[index]?.quantity) || 0;
                  const rowPrice =
                    Number(watchedItems?.[index]?.unitPrice) || 0;
                  const rowTotal = rowQty * rowPrice;

                  return (
                    <div
                      key={field.id}
                      className="grid grid-cols-12 gap-2 items-start"
                    >
                      <div className="col-span-12 sm:col-span-5 space-y-1">
                        <Input
                          placeholder="Service or deliverable description"
                          disabled={isSubmitting}
                          {...register(`items.${index}.description`)}
                        />
                        {errors.items?.[index]?.description && (
                          <p className="text-[11px] text-destructive">
                            {errors.items[index]?.description?.message}
                          </p>
                        )}
                      </div>

                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          disabled={isSubmitting}
                          {...register(`items.${index}.quantity`, {
                            setValueAs: (v) => (v === "" ? 1 : Number(v)),
                          })}
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-2 space-y-1">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Price"
                          disabled={isSubmitting}
                          {...register(`items.${index}.unitPrice`, {
                            setValueAs: (v) => (v === "" ? 0 : Number(v)),
                          })}
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-2 flex items-center justify-end h-9 text-sm font-medium">
                        {formatCurrency(rowTotal, true)}
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                          disabled={fields.length === 1 || isSubmitting}
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {errors.items?.root && (
                  <p className="text-xs text-destructive">
                    {errors.items.root.message}
                  </p>
                )}
              </div>
            </div>

            {/* Notes & Financial Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start pt-1">
              <div className="sm:col-span-7 space-y-2">
                <Label htmlFor="inv-notes">Payment Instructions / Notes</Label>
                <Textarea
                  id="inv-notes"
                  placeholder="Bank transfer details, payment terms (Net 14), thank you note..."
                  rows={3}
                  disabled={isSubmitting}
                  {...register("notes")}
                />
              </div>

              <div className="sm:col-span-5 rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, true)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax ({watchedTaxRate}%)</span>
                  <span>{formatCurrency(taxAmount, true)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(total, true)}</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Create Invoice" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}