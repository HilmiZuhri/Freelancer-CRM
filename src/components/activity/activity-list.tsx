"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ActivityEntityType } from "@prisma/client";
import {
  Activity,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  User,
  Users,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityLogItem {
  id: string;
  action: string;
  entityType: ActivityEntityType;
  entityId: string | null;
  description: string;
  createdAt: Date;
}

const filterOptions: { label: string; value: ActivityEntityType | "ALL" }[] = [
  { label: "All Events", value: "ALL" },
  { label: "Clients", value: "CLIENT" },
  { label: "Projects", value: "PROJECT" },
  { label: "Tasks", value: "TASK" },
  { label: "Invoices", value: "INVOICE" },
  { label: "Account", value: "USER" },
];

const entityIconMap: Record<ActivityEntityType, React.ElementType> = {
  CLIENT: Users,
  PROJECT: FolderKanban,
  TASK: CheckSquare,
  INVOICE: FileText,
  USER: User,
};

function getEntityHref(
  entityType: ActivityEntityType,
  entityId: string | null,
  action: string
): string | null {
  if (!entityId || action.toLowerCase().includes("deleted")) return null;
  switch (entityType) {
    case "CLIENT":
      return `/clients/${entityId}`;
    case "PROJECT":
      return `/projects/${entityId}`;
    case "INVOICE":
      return `/invoices/${entityId}`;
    case "TASK":
      return "/tasks";
    case "USER":
      return "/settings";
    default:
      return null;
  }
}

export function ActivityList({
  logs,
  initialType,
  totalCount,
  currentPage,
  totalPages,
}: {
  logs: ActivityLogItem[];
  initialType: string;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleTypeChange(type: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "ALL") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {filterOptions.map((option) => (
          <Button
            key={option.value}
            variant={initialType === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleTypeChange(option.value)}
            className="text-xs h-8"
          >
            {option.label}
          </Button>
        ))}
      </div>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Workspace Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
              No activity events found for this category.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((item) => {
                const Icon = entityIconMap[item.entityType];
                const href = getEntityHref(
                  item.entityType,
                  item.entityId,
                  item.action
                );

                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 p-2 rounded-lg bg-muted text-muted-foreground shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{item.action}</p>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 font-normal"
                          >
                            {item.entityType}
                          </Badge>
                        </div>
                        {href ? (
                          <Link
                            href={href}
                            className="text-xs text-muted-foreground hover:text-foreground hover:underline block truncate"
                          >
                            {item.description}
                          </Link>
                        ) : (
                          <p className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                      <p className="text-[11px] text-muted-foreground/70">
                        {formatDate(item.createdAt.toISOString())}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <p className="text-xs text-muted-foreground">
            Showing page <span className="font-medium">{currentPage}</span> of{" "}
            <span className="font-medium">{totalPages}</span> ({totalCount}{" "}
            {totalCount === 1 ? "event" : "events"} total)
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
      )}
    </div>
  );
}