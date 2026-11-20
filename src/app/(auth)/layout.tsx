import { Briefcase } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Briefcase className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          Freelancer CRM
        </span>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}