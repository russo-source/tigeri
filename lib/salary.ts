// Russo's salary: $2,000/month, paid in USDC on the 15th.
// Shared by the Salary view and the dashboard's Total Spend.

export interface SalaryEntry {
  month: string;
  date: string;
  amount: number;
  currency: string;
  status: "Paid" | "Pending";
}

export const SALARY_MONTHLY = 2000;

export const SALARY: SalaryEntry[] = [
  { month: "April 2026", date: "Apr 15, 2026", amount: 2000, currency: "USDC", status: "Paid" },
  { month: "May 2026", date: "May 19, 2026", amount: 2000, currency: "USDC", status: "Paid" },
  { month: "June 2026", date: "Jun 15, 2026", amount: 2000, currency: "USDC", status: "Pending" },
];

export function salaryTotal(): number {
  return SALARY.reduce((s, e) => s + e.amount, 0);
}

export function salaryPaid(): number {
  return SALARY.filter((e) => e.status === "Paid").reduce((s, e) => s + e.amount, 0);
}
