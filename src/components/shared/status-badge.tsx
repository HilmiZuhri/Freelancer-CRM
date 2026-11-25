import { Badge } from "@/components/ui/badge";
import {
  InvoiceStatus,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "@/types/crm";
import { cn } from "@/lib/utils";

const projectStatusConfig: Record<
  ProjectStatus,
  { label: string; className: string }
> = {
  PLANNING: {
    label: "Planning",
    className: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50",
  },
  ON_HOLD: {
    label: "On Hold",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
};

const invoiceStatusConfig: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100",
  },
  UNPAID: {
    label: "Unpaid",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
  },
  PAID: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
  },
  OVERDUE: {
    label: "Overdue",
    className: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50",
  },
};

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  LOW: {
    label: "Low",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  HIGH: {
    label: "High",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

const taskStatusConfig: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  TODO: {
    label: "To Do",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  DONE: {
    label: "Done",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const config = projectStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const config = invoiceStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = taskStatusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}