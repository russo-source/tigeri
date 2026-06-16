import { Client } from "@notionhq/client";
import type { Expense, ExpenseInput, Category, BillingCycle, Status, Account } from "./types";

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN) throw new Error("NOTION_TOKEN env var is required");
if (!NOTION_DATABASE_ID) throw new Error("NOTION_DATABASE_ID env var is required");

const notion = new Client({ auth: NOTION_TOKEN });

// Helper to safely get a property from Notion's verbose format
function getTitle(prop: any): string {
  if (!prop || prop.type !== "title") return "";
  return (prop.title || []).map((t: any) => t.plain_text).join("");
}

function getRichText(prop: any): string {
  if (!prop || prop.type !== "rich_text") return "";
  return (prop.rich_text || []).map((t: any) => t.plain_text).join("");
}

function getNumber(prop: any): number {
  if (!prop || prop.type !== "number") return 0;
  return prop.number ?? 0;
}

function getSelect(prop: any): string {
  if (!prop || prop.type !== "select" || !prop.select) return "";
  return prop.select.name || "";
}

function getDate(prop: any): string {
  if (!prop || prop.type !== "date" || !prop.date) return "";
  return prop.date.start || "";
}

function getFormulaNumber(prop: any): number {
  if (!prop || prop.type !== "formula") return 0;
  if (prop.formula.type === "number") return prop.formula.number ?? 0;
  return 0;
}

// Notion "people" property → { full name, normalized first name for filtering }
function getPaidBy(prop: any): { paidBy?: string; paidByName?: string } {
  if (!prop || prop.type !== "people" || !Array.isArray(prop.people) || prop.people.length === 0) {
    return {};
  }
  const paidByName: string | undefined = prop.people[0]?.name || undefined;
  let paidBy = paidByName;
  // Normalize to first name so the dashboard profile filter can match "Russo" / "Tim"
  if (paidBy?.startsWith("Russo")) paidBy = "Russo";
  else if (paidBy?.startsWith("Tim")) paidBy = "Tim";
  return { paidBy, paidByName };
}

function pageToExpense(page: any): Expense {
  const props = page.properties || {};
  const { paidBy, paidByName } = getPaidBy(props["Paid by"]);
  return {
    id: page.id,
    name: getTitle(props["Name"]),
    vendor: getRichText(props["Vendor"]),
    category: (getSelect(props["Category"]) as Category) || "Other",
    account: (getSelect(props["Account"]) as Account) || "",
    amount: getNumber(props["Amount"]),
    cycle: (getSelect(props["Billing Cycle"]) as BillingCycle) || "Monthly",
    renewal: getDate(props["Next Renewal"]),
    status: (getSelect(props["Status"]) as Status) || "Active",
    notes: getRichText(props["Notes"]),
    monthlyEquivalent: getFormulaNumber(props["Monthly Equivalent"]),
    paidBy,
    paidByName,
  };
}

function expenseToProperties(input: ExpenseInput): any {
  const props: any = {
    Name: { title: [{ text: { content: input.name } }] },
    Category: { select: { name: input.category } },
    "Billing Cycle": { select: { name: input.cycle } },
    Status: { select: { name: input.status } },
    Amount: { number: Number(input.amount) || 0 },
  };

  if (input.vendor !== undefined) {
    props.Vendor = {
      rich_text: input.vendor ? [{ text: { content: input.vendor } }] : [],
    };
  }
  if (input.notes !== undefined) {
    props.Notes = {
      rich_text: input.notes ? [{ text: { content: input.notes } }] : [],
    };
  }
  if (input.account !== undefined) {
    if (input.account) {
      props.Account = { select: { name: input.account } };
    } else {
      props.Account = { select: null };
    }
  }
  if (input.renewal !== undefined) {
    if (input.renewal) {
      props["Next Renewal"] = { date: { start: input.renewal } };
    } else {
      props["Next Renewal"] = { date: null };
    }
  }
  return props;
}

export async function listExpenses(): Promise<Expense[]> {
  const all: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID!,
      start_cursor: cursor,
      page_size: 100,
    });
    all.push(...response.results);
    cursor = response.has_more ? response.next_cursor || undefined : undefined;
  } while (cursor);

  return all.map(pageToExpense);
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const response = await notion.pages.create({
    parent: { database_id: NOTION_DATABASE_ID! },
    properties: expenseToProperties(input),
  });
  return pageToExpense(response);
}

export async function updateExpense(
  id: string,
  input: Partial<ExpenseInput>
): Promise<Expense> {
  const response = await notion.pages.update({
    page_id: id,
    properties: expenseToProperties(input as ExpenseInput),
  });
  return pageToExpense(response);
}

export async function cancelExpense(id: string): Promise<Expense> {
  const response = await notion.pages.update({
    page_id: id,
    properties: {
      Status: { select: { name: "Cancelled" } },
    },
  });
  return pageToExpense(response);
}
