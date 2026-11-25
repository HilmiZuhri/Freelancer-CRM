"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { InvoiceStatus } from "@prisma/client";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const invoiceFilters: { label: string; value: InvoiceStatus | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Draft", value: "DRAFT" },
  { label: "Unpaid", value: "UNPAID" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
];

export function InvoicesToolbar({
  initialSearch,
  initialStatus,
}: {
  initialSearch: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(initialSearch);

  useEffect(() => {
    setSearchValue(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get("search") ?? "";
      if (searchValue.trim() === currentSearch) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchValue, pathname, router, searchParams]);

  function handleStatusChange(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleReset() {
    setSearchValue("");
    router.replace(pathname);
  }

  const hasActiveFilters = Boolean(initialSearch || initialStatus !== "ALL");

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex flex-1 items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice #, client, or project..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="px-2.5 text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {invoiceFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={initialStatus === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => handleStatusChange(filter.value)}
            className="text-xs h-8"
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}