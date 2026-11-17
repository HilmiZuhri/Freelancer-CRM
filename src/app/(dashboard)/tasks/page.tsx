import { CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Organize and prioritize project deliverables.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold">Task Board Ready for Phase 8</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-1">
            Full task management with priorities, deadlines, and status columns will be connected to PostgreSQL in Phase 8.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}