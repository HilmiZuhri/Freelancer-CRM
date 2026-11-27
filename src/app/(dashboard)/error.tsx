"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard runtime error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-md w-full shadow-xs">
        <CardContent className="flex flex-col items-center text-center p-8 space-y-4">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold tracking-tight">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground">
              We encountered an unexpected error while loading this page. Please
              try again.
            </p>
          </div>
          <Button onClick={() => reset()} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}