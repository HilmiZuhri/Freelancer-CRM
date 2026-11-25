"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteInvoice } from "@/actions/invoices";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteInvoiceDialogProps {
  invoiceId: string;
  invoiceNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectAfterDelete?: boolean;
}

export function DeleteInvoiceDialog({
  invoiceId,
  invoiceNumber,
  open,
  onOpenChange,
  redirectAfterDelete = false,
}: DeleteInvoiceDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const result = await deleteInvoice(invoiceId);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Invoice ${invoiceNumber} deleted.`);
      onOpenChange(false);

      if (redirectAfterDelete) {
        router.push("/invoices");
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete invoice {invoiceNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This invoice and all of its line items
            will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Invoice
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}