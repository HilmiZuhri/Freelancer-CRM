"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  FileText,
  FolderKanban,
  Loader2,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react";
import { logoutUser } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarContent } from "./sidebar";

interface TopbarProps {
  user: {
    name: string;
    email: string;
  };
  clientsCount?: number;
}

interface SearchResults {
  clients: { id: string; name: string; company: string | null }[];
  projects: { id: string; title: string; client: { name: string } }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    client: { name: string };
  }[];
}

export function Topbar({ user, clientsCount = 0 }: TopbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );
        if (res.ok) {
          const data: SearchResults = await res.json();
          setResults(data);
          setDropdownOpen(true);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const hasAnyResult =
    results &&
    (results.clients.length > 0 ||
      results.projects.length > 0 ||
      results.invoices.length > 0);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 print:hidden">
      {/* Left: Mobile Drawer Trigger + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-64 p-0 bg-sidebar border-sidebar-border text-sidebar-foreground"
          >
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent
              clientsCount={clientsCount}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div
          ref={searchContainerRef}
          className="relative w-full hidden sm:block"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients, projects, or invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (results) setDropdownOpen(true);
            }}
            className="pl-9 pr-8 bg-background/60 h-9 text-sm"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}

          {dropdownOpen && results && (
            <div className="absolute left-0 right-0 top-11 z-50 rounded-lg border border-border bg-popover p-2 shadow-lg space-y-2 max-h-80 overflow-y-auto">
              {!hasAnyResult ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No results found for &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
                <>
                  {results.clients.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Clients
                      </p>
                      {results.clients.map((c) => (
                        <Link
                          key={c.id}
                          href={`/clients/${c.id}`}
                          onClick={() => {
                            setDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
                        >
                          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">{c.name}</span>
                          {c.company && (
                            <span className="text-muted-foreground truncate">
                              ({c.company})
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}

                  {results.projects.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Projects
                      </p>
                      {results.projects.map((p) => (
                        <Link
                          key={p.id}
                          href={`/projects/${p.id}`}
                          onClick={() => {
                            setDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
                        >
                          <FolderKanban className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-medium truncate">
                            {p.title}
                          </span>
                          <span className="text-muted-foreground truncate">
                            • {p.client.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {results.invoices.length > 0 && (
                    <div>
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Invoices
                      </p>
                      {results.invoices.map((inv) => (
                        <Link
                          key={inv.id}
                          href={`/invoices/${inv.id}`}
                          onClick={() => {
                            setDropdownOpen(false);
                            setSearchQuery("");
                          }}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent"
                        >
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono font-medium">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-muted-foreground truncate">
                            • {inv.client.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Quick Action, Activity Shortcut, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button size="sm" className="hidden sm:inline-flex gap-1.5" asChild>
          <Link href="/projects">
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Activity Log"
          asChild
        >
          <Link href="/activity">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 h-auto rounded-full hover:bg-accent"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-sm font-medium leading-none">
                  {user.name}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {user.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutUser()}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}