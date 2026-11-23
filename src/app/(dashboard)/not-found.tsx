import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-md w-full shadow-xs">
        <CardContent className="flex flex-col items-center text-center p-8 space-y-4">
          <div className="p-3 rounded-full bg-muted text-muted-foreground">
            <FileQuestion className="h-8 w-8" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight">
              404 — Record Not Found
            </h2>
            <p className="text-sm text-muted-foreground">
              The resource you are looking for does not exist or you do not
              have permission to view it.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}