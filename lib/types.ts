export type Category =
  | "Infrastructure"
  | "AI/API"
  | "SaaS Tools"
  | "Hardware"
  | "Salaries"
  | "Domains"
  | "Contractors"
  | "Other";

export type BillingCycle = "Monthly" | "Annual" | "One-time";

export type Status = "Active" | "Pending Info" | "Cancelled" | "Trial";

export type Account =
  | "tigeri.ai"
  | "tokemak.xyz"
  | "metals.io"
  | "synthesis.inc"
  | "personal";

export interface Expense {
  id: string;
  name: string;
  vendor: string;
  category: Category;
  account: Account | "";
  amount: number;
  cycle: BillingCycle;
  renewal: string;
  status: Status;
  notes: string;
  monthlyEquivalent: number;
}

export interface ExpenseInput {
  name: string;
  vendor?: string;
  category: Category;
  account?: Account | "";
  amount: number;
  cycle: BillingCycle;
  renewal?: string;
  status: Status;
  notes?: string;
}

export const CATEGORIES: Category[] = [
  "Infrastructure",
  "AI/API",
  "SaaS Tools",
  "Hardware",
  "Salaries",
  "Domains",
  "Contractors",
  "Other",
];

export const BILLING_CYCLES: BillingCycle[] = ["Monthly", "Annual", "One-time"];

export const STATUSES: Status[] = ["Active", "Pending Info", "Cancelled", "Trial"];

export const ACCOUNTS: Account[] = [
  "tigeri.ai",
  "tokemak.xyz",
  "metals.io",
  "synthesis.inc",
  "personal",
];
