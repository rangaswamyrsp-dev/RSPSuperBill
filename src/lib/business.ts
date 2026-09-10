// Business types + per-account feature flags.
// This software is for hotels, restaurants, cafes and tiffin centers only.
// Super Admin picks the business type when creating an account; that decides
// which modules the customer sees and the wording used.

export type BusinessType =
  | "Hotel"
  | "Restaurant"
  | "Cafe / Coffee Shop"
  | "Small Hotel"
  | "Tiffin Center"
  | "Bakery / Sweets"
  | "Bar & Restaurant";

export const BUSINESS_TYPES: BusinessType[] = [
  "Hotel",
  "Restaurant",
  "Cafe / Coffee Shop",
  "Small Hotel",
  "Tiffin Center",
  "Bakery / Sweets",
  "Bar & Restaurant",
];

export type FeatureKey =
  | "dashboard" | "billing" | "items" | "sales" | "purchase" | "inventory"
  | "customers" | "suppliers" | "employees" | "attendance" | "finance"
  | "reports" | "gst" | "accounts" | "audit" | "settings" | "backup" | "help";

export const FEATURE_LIST: { key: FeatureKey; label: string; hint: string }[] = [
  { key: "dashboard", label: "Dashboard", hint: "Daily summary screen" },
  { key: "billing", label: "Billing", hint: "Make bills and print receipts" },
  { key: "items", label: "Menu Items", hint: "Dish list with photo and price" },
  { key: "sales", label: "Sales", hint: "Bill history" },
  { key: "purchase", label: "Purchase", hint: "Kitchen purchase entries" },
  { key: "inventory", label: "Kitchen Stock", hint: "Stock on hand" },
  { key: "customers", label: "Customers", hint: "Customer list and dues" },
  { key: "suppliers", label: "Suppliers", hint: "Vegetable / grocery suppliers" },
  { key: "employees", label: "Employees", hint: "Staff logins" },
  { key: "attendance", label: "Attendance & Salary", hint: "Daily duty and monthly pay" },
  { key: "finance", label: "Income & Expense", hint: "All hotel income and expenses" },
  { key: "reports", label: "Reports", hint: "Daily, monthly, yearly and item-wise reports" },
  { key: "gst", label: "GST", hint: "GST summary and filing help" },
  { key: "accounts", label: "Accounts", hint: "Cash book and balances" },
  { key: "audit", label: "Audit log", hint: "Who did what" },
  { key: "settings", label: "Settings", hint: "Printer and hotel details" },
  { key: "backup", label: "Backup", hint: "Export / import data" },
  { key: "help", label: "Help & Guide", hint: "Built-in usage guide" },
];

const BASE: FeatureKey[] = [
  "dashboard", "billing", "items", "sales", "reports",
  "employees", "attendance", "finance", "settings", "help",
];

const FULL: FeatureKey[] = [
  ...BASE, "purchase", "inventory", "customers", "suppliers",
  "gst", "accounts", "audit", "backup",
];

export const DEFAULT_FEATURES: Record<BusinessType, FeatureKey[]> = {
  Hotel: FULL,
  Restaurant: FULL,
  "Cafe / Coffee Shop": [...BASE, "purchase", "customers", "accounts", "backup"],
  "Small Hotel": [...BASE, "purchase", "customers", "accounts", "backup"],
  "Tiffin Center": [...BASE, "purchase", "accounts", "backup"],
  "Bakery / Sweets": [...BASE, "purchase", "inventory", "customers", "gst", "accounts", "backup"],
  "Bar & Restaurant": FULL,
};

export type BusinessLabels = {
  items: string;      // menu wording
  itemsOne: string;   // "dish"
  bill: string;       // "Bill"
};

export const BUSINESS_LABELS: Record<BusinessType, BusinessLabels> = {
  Hotel: { items: "Menu Items", itemsOne: "dish", bill: "Bill" },
  Restaurant: { items: "Menu Items", itemsOne: "dish", bill: "Bill" },
  "Cafe / Coffee Shop": { items: "Menu Items", itemsOne: "item", bill: "Bill" },
  "Small Hotel": { items: "Menu Items", itemsOne: "dish", bill: "Bill" },
  "Tiffin Center": { items: "Menu Items", itemsOne: "tiffin", bill: "Bill" },
  "Bakery / Sweets": { items: "Menu Items", itemsOne: "item", bill: "Bill" },
  "Bar & Restaurant": { items: "Menu Items", itemsOne: "item", bill: "Bill" },
};

export function labelsFor(type?: BusinessType): BusinessLabels {
  return BUSINESS_LABELS[type ?? "Hotel"] ?? BUSINESS_LABELS.Hotel;
}

/** Old / unknown business types (from earlier versions) fall back to Hotel. */
export function normalizeBusinessType(t?: string): BusinessType {
  return (BUSINESS_TYPES as string[]).includes(t ?? "") ? (t as BusinessType) : "Hotel";
}
