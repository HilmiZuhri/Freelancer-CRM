import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="max-w-xl w-full bg-card border border-border rounded-xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Phase 1: Environment Ready
            </h1>
            <p className="text-sm text-muted-foreground">
              Freelancer CRM SaaS Foundation
            </p>
          </div>
        </div>

        <p className="text-muted-foreground text-sm leading-relaxed">
          Next.js 16 App Router, Tailwind CSS v4, shadcn/ui (Radix UI), Lucide Icons,
          and TypeScript have been successfully configured with a modular SaaS architecture.
        </p>

        <div className="pt-4 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">
            Status: Ready for Phase 2 (UI Foundation)
          </span>
          <Button className="gap-2">
            Proceed to UI Setup <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}