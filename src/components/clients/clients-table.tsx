"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  Users,
} from "lucide-react";
import { ClientListItem } from "@/lib/data/clients";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ClientFormDialog,
  type EditableClient,
} from "@/components/clients/client-form-dialog";
import { DeleteClientDialog } from "@/components/clients/delete-client-dialog";

interface ClientsTableProps {
  clients: ClientListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasActiveSearchOrFilter: boolean;
}

export function ClientsTable({
  clients,
  totalCount,
  currentPage,
  totalPages,
  hasActiveSearchOrFilter,
}: ClientsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [editingClient, setEditingClient] = useState<EditableClient | null>(
    null
  );
  const [deletingClient, setDeletingClient] = useState<{
    id: string;
    name: string;
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

  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <Users className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold">
          {hasActiveSearchOrFilter
            ? "No matching clients found"
            : "No clients yet"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
          {hasActiveSearchOrFilter
            ? "Try adjusting your search query or filter criteria."
            : "Add your first freelance client to start tracking projects and invoices."}
        </p>
        {!hasActiveSearchOrFilter && <ClientFormDialog mode="create" />}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Total Billed</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => {
              const initials = client.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <TableRow key={client.id} className="group">
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {client.name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs text-muted-foreground space-y-0.5">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 shrink-0" /> {client.email}
                      </span>
                      {client.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0" /> {client.phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.company || "—"}
                  </TableCell>
                  <TableCell>{client.projectsCount}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(client.totalBilled)}
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
                            href={`/clients/${client.id}`}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditingClient(client)}
                          className="cursor-pointer"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            setDeletingClient({
                              id: client.id,
                              name: client.name,
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
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
        <p className="text-xs text-muted-foreground">
          Showing page <span className="font-medium">{currentPage}</span> of{" "}
          <span className="font-medium">{totalPages}</span> ({totalCount}{" "}
          {totalCount === 1 ? "client" : "clients"} total)
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

      {/* Edit Modal */}
      {editingClient && (
        <ClientFormDialog
          mode="edit"
          client={editingClient}
          open={Boolean(editingClient)}
          onOpenChange={(open) => {
            if (!open) setEditingClient(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingClient && (
        <DeleteClientDialog
          clientId={deletingClient.id}
          clientName={deletingClient.name}
          open={Boolean(deletingClient)}
          onOpenChange={(open) => {
            if (!open) setDeletingClient(null);
          }}
        />
      )}
    </>
  );
}