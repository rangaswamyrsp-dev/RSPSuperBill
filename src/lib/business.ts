// Business types + per-account feature flags.
// Super Admin picks the business type when creating an account; that decides
// which modules the customer sees, the billing style, and the wording used.

export type BusinessType = "Hotel" | "Medical" | "Supermarket" | "Retail" | "Bakery" | "Other";

export const BUSINESS_TYPES: BusinessType[] = ["Hotel", "Medical", "Supermarket", "Retail", "Bakery", "Other"];

export type FeatureKey =
  | "dashboard" | "billing" | "items" | "sales" | "purchase" | "inventory" | "expiry"
  | "customers" | "suppliers" | "employees" | "attendance" | "finance"
  | "reports" | "gst" | "accounts" | "barcode" | "audit" | "settings" | "backup" | "help";

export const FEATURE_LIST: { key: FeatureKey; label: string; hint: string }[] = [
  { key: "dashboard", label: "Dashboard", hint: "Daily summary screen" },
  { key: "billing", label: "Billing", hint: "Make bills and print receipts" },
  { key: "items", label: "Products / Menu", hint: "Item list with price" },
  { key: "sales", label: "Sales", hint: "Bill history" },
  { key: "purchase", label: "Purchase", hint: "Stock purchase entries" },
  { key: "inventory", label: "Inventory", hint: "Stock on hand" },
  { key: "expiry", label: "Expiry / Batch tracking", hint: "Only for medical shops" },
  { key: "customers", label: "Customers", hint: "Customer list and dues" },
  { key: "suppliers", label: "Suppliers", hint: "Supplier list and dues" },
  { key: "employees", label: "Employees", hint: "Staff logins" },
  { key: "attendance", label: "Attendance & Salary", hint: "Daily duty and monthly pay" },
  { key: "finance", label: "Income & Expense", hint: "All business income and expenses" },
  { key: "reports", label: "Reports", hint: "Daily, monthly, yearly reports" },
  { key: "gst", label: "GST", hint: "GST summary and filing help" },
  { key: "accounts", label: "Accounts", hint: "Cash book and balances" },
  { key: "barcode", label: "Barcode scanning", hint: "Scan products while billing" },
  { key: "audit", label: "Audit log", hint: "Who did what" },
  { key: "settings", label: "Settings", hint: "Printer and shop details" },
  { key: "backup", label: "Backup", hint: "Export / import data" },
  { key: "help", label: "Help & Guide", hint: "Built-in usage guide" },
];

const BASE: FeatureKey[] = [
  "dashboard", "billing", "items", "sales", "purchase", "inventory",
  "customers", "employees", "attendance", "finance", "reports", "accounts",
  "settings", "backup", "help",
];

export const DEFAULT_FEATURES: Record<BusinessType, FeatureKey[]> = {
  Hotel: [...BASE, "gst", "audit"],
  Medical: [...BASE, "expiry", "suppliers", "barcode", "gst", "audit"],
  Supermarket: [...BASE, "suppliers", "barcode", "gst", "audit"],
  Retail: [...BASE, "suppliers", "barcode", "gst"],
  Bakery: [...BASE, "gst"],
  Other: [...BASE],
};

export type BusinessLabels = {
  items: string;      // "Menu Items" / "Medicines" / "Products"
  itemsOne: string;   // "dish" / "medicine" / "product"
  bill: string;       // "Bill"
  billingMode: "photo" | "search";
};

export const BUSINESS_LABELS: Record<BusinessType, BusinessLabels> = {
  Hotel:       { items: "Menu Items", itemsOne: "dish", bill: "Bill", billingMode: "photo" },
  Medical:     { items: "Medicines", itemsOne: "medicine", bill: "Bill", billingMode: "search" },
  Supermarket: { items: "Products", itemsOne: "product", bill: "Bill", billingMode: "search" },
  Retail:      { items: "Products", itemsOne: "product", bill: "Bill", billingMode: "search" },
  Bakery:      { items: "Products", itemsOne: "product", bill: "Bill", billingMode: "photo" },
  Other:       { items: "Products", itemsOne: "product", bill: "Bill", billingMode: "search" },
};

export function labelsFor(type?: BusinessType): BusinessLabels {
  return BUSINESS_LABELS[type ?? "Hotel"] ?? BUSINESS_LABELS.Other;
}
