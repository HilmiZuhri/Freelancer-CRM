import { requireAuth } from "@/lib/auth-utils";
import { getClients } from "@/lib/data/clients";
import { ClientFormDialog } from "@/components/clients/client-form-dialog";
import { ClientsToolbar } from "@/components/clients/clients-toolbar";
import { ClientsTable } from "@/components/clients/clients-table";

interface ClientsPageProps {
  searchParams: Promise<{
    search?: string;
    filter?: string;
    page?: string;
  }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { userId } = await requireAuth();
  const params = await searchParams;

  const search = params.search ?? "";
  const filter = params.filter ?? "all";
  const page = Number(params.page) || 1;

  const { clients, totalCount, totalPages, currentPage } = await getClients({
    userId,
    search,
    filter,
    page,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your freelance clients, contact records, and project history.
          </p>
        </div>
        <ClientFormDialog mode="create" />
      </div>

      <ClientsToolbar initialSearch={search} initialFilter={filter} />

      <ClientsTable
        clients={clients}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        hasActiveSearchOrFilter={Boolean(search || filter !== "all")}
      />
    </div>
  );
}