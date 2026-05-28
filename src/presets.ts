import { PresetPrompt } from "./types";

export const PRESET_PROMPTS: PresetPrompt[] = [
  {
    id: "student-perf",
    title: "Student Academic Performance Tracker",
    prompt: "Generate a student performance dashboard with student names, computer science scores, attendance percentages, final letter grades, and remedial pass/fail status.",
    category: "Education"
  },
  {
    id: "sales-report",
    title: "Regional Sales & Revenue Ledger",
    prompt: "Generate a quarterly sales report consisting of transaction date, region, product title, product units sold, gross revenue, and client key accounts representative.",
    category: "Sales"
  },
  {
    id: "employee-tracking",
    title: "Enterprise Key Team Members Directory",
    prompt: "Generate an HR employee tracking dataset with unique employee ID codes, full employee names, departments, position responsibilities, USD salary, and current status.",
    category: "HR"
  },
  {
    id: "inventory-dashboard",
    title: "Warehouse Materials & Asset Stock Tracker",
    prompt: "Generate an inventory list containing SKU codes, technical item descriptor names, physical warehouse zones, shelf count units, single unit cost, and restock trigger status.",
    category: "Inventory"
  },
  {
    id: "finance-summary",
    title: "Corporate Balance Sheet Ledger",
    prompt: "Generate a financial transaction ledger highlighting account ID, deployment type, vendor name, amount in USD, transaction flag risk level, and executive approver code.",
    category: "Finance"
  }
];
