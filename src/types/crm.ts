export type ProjectStatus = "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type InvoiceStatus = "DRAFT" | "UNPAID" | "PAID" | "OVERDUE";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  projectsCount: number;
  totalBilled: number;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  clientId: string;
  clientName: string;
  status: ProjectStatus;
  budget: number;
  progress: number;
  startDate: string;
  deadline: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  projectTitle: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  target: string;
  timestamp: string;
  type: "client" | "project" | "task" | "invoice";
}

export interface UpcomingDeadline {
  id: string;
  title: string;
  projectTitle: string;
  dueDate: string;
  priority: TaskPriority;
  daysLeft: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}