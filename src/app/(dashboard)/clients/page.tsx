import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientsTable } from "@/components/clients/clients-table";
import { mockClients } from "@/lib/mock-data";

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your freelance clients and contact details.
          </p>
        </div>
        <Button className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <ClientsTable clients={mockClients} />
    </div>
  );
}