// Business types + per-account feature flags for RSP SuperBill.
// Super Admin picks the business type when creating an account; that decides
// which modules the customer sees, the billing style and the wording used.

export type BusinessType =
  | "Hotel"
  | "Restaurant"
  | "Cafe / Coffee Shop"
  | "Small Hotel"
  | "Tiffin Center"
  | "Bakery / Sweets"
  | "Bar & Restaurant"
  | "Supermarket"
  | "Grocery Store"
  | "Kirana Store"
  | "General Store"
  | "Electronics Shop"
  | "Mobile Shop"
  | "Electrical Shop"
  | "Clothing Store"
  | "Hardware Shop"
  | "Paint Shop"
  | "Medical Store";

export const BUSINESS_TYPES: BusinessType[] = [
  "Hotel", "Restaurant", "Cafe / Coffee Shop", "Small Hotel", "Tiffin Center",
  "Bakery / Sweets", "Bar & Restaurant",
  "Supermarket", "Grocery Store", "Kirana Store", "General Store",
  "Electronics Shop", "Mobile Shop", "Electrical Shop", "Clothing Store",
  "Hardware Shop", "Paint Shop", "Medical Store",
];

export type FeatureKey =
  | "dashboard" | "billing" | "items" | "sales" | "purchase" | "inventory"
  | "customers" | "suppliers" | "employees" | "attendance" | "finance"
  | "reports" | "gst" | "accounts" | "barcode" | "audit" | "settings" | "backup" | "help";

export const FEATURE_LIST: { key: FeatureKey; label: string; hint: string }[] = [
  { key: "dashboard", label: "Dashboard", hint: "Daily summary screen" },
  { key: "billing", label: "Billing", hint: "Make bills and print receipts" },
  { key: "items", label: "Items / Menu", hint: "Item list with price, unit and photo" },
  { key: "sales", label: "Sales", hint: "Bill history" },
  { key: "purchase", label: "Purchase", hint: "Stock purchase entries" },
  { key: "inventory", label: "Stock", hint: "Stock on hand" },
  { key: "customers", label: "Customers", hint: "Customer list and dues" },
  { key: "suppliers", label: "Suppliers", hint: "Supplier list and dues" },
  { key: "employees", label: "Employees", hint: "Staff logins" },
  { key: "attendance", label: "Attendance & Salary", hint: "Daily duty and monthly pay" },
  { key: "finance", label: "Income & Expense", hint: "All business income and expenses" },
  { key: "reports", label: "Reports", hint: "Daily, monthly, yearly and item-wise reports" },
  { key: "gst", label: "GST", hint: "GST summary and filing help" },
  { key: "accounts", label: "Accounts", hint: "Cash book and balances" },
  { key: "barcode", label: "Barcode scanning", hint: "USB barcode scanner while billing" },
  { key: "audit", label: "Audit log", hint: "Who did what" },
  { key: "settings", label: "Settings", hint: "Printer and shop details" },
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
const SHOP: FeatureKey[] = [...FULL, "barcode"];

export const DEFAULT_FEATURES: Record<BusinessType, FeatureKey[]> = {
  Hotel: FULL,
  Restaurant: FULL,
  "Cafe / Coffee Shop": [...BASE, "purchase", "customers", "accounts", "backup"],
  "Small Hotel": [...BASE, "purchase", "customers", "accounts", "backup"],
  "Tiffin Center": [...BASE, "purchase", "accounts", "backup"],
  "Bakery / Sweets": [...BASE, "purchase", "inventory", "customers", "gst", "accounts", "backup", "barcode"],
  "Bar & Restaurant": FULL,
  Supermarket: SHOP,
  "Grocery Store": SHOP,
  "Kirana Store": SHOP,
  "General Store": SHOP,
  "Electronics Shop": SHOP,
  "Mobile Shop": SHOP,
  "Electrical Shop": SHOP,
  "Clothing Store": SHOP,
  "Hardware Shop": SHOP,
  "Paint Shop": SHOP,
  "Medical Store": [...SHOP],
};

export type BusinessLabels = {
  items: string;
  itemsOne: string;
  bill: string;
  /** photo = tap dish photos (hotels); search = search bar + barcode scan (shops) */
  billingMode: "photo" | "search";
  categories: string[];
};

const FOOD = ["Tiffins", "Meals", "Curries", "Biryani", "Chinese", "Tandoori", "Breads", "Beverages", "Desserts", "Others"];
const GROCERY = ["Rice & Grains", "Dal & Pulses", "Oil & Ghee", "Spices & Masala", "Flour & Atta", "Sugar & Salt",
  "Dairy", "Snacks", "Biscuits", "Beverages", "Personal Care", "Household", "Vegetables & Fruits", "Others"];
const MOBILE = ["Mobiles", "Chargers", "Cables", "Earphones", "Covers & Cases", "Screen Guards", "Power Banks",
  "Memory Cards", "Recharge", "Repairs", "Others"];
const BAKERY = ["Cakes", "Breads", "Biscuits", "Sweets", "Snacks", "Beverages", "Others"];
const ELECTRONICS = ["TV & Audio", "Kitchen Appliances", "Cooling & Heating", "Small Appliances", "Laptops & Computers", "Cables & Accs", "Others"];
const ELECTRICAL = ["Wires & Cables", "Switches & Sockets", "LED & Lighting", "Fans", "MCB & Distribution", "Pipes & Fittings", "Batteries & Inverters", "Others"];
const CLOTHING = ["Men's Wear", "Women's Wear", "Kids & Boys", "Girls Wear", "Sarees & Ethnic", "Innerwear", "Fabrics", "Accessories", "Others"];
const HARDWARE = ["Fasteners & Screws", "Hand Tools", "Power Tools", "Plumbing", "Door Fittings", "Adhesives & Tapes", "Locks & Keys", "Safety & Security", "Others"];
const PAINT = ["Interior Paint", "Exterior Paint", "Enamel & Gloss", "Primer & Putty", "Waterproofing", "Brushes & Rollers", "Thinners & Solvents", "Spray Paints", "Others"];
const MEDICAL = ["Tablets & Capsules", "Syrups & Suspensions", "Injections", "Ointments & Creams", "Drops & Sprays", "Surgical & First Aid", "Baby Care", "Health Supplements", "Others"];

const food = (itemsOne = "dish"): BusinessLabels =>
  ({ items: "Menu Items", itemsOne, bill: "Bill", billingMode: "photo", categories: FOOD });
const shop = (categories: string[]): BusinessLabels =>
  ({ items: "Products", itemsOne: "product", bill: "Bill", billingMode: "search", categories });

export const BUSINESS_LABELS: Record<BusinessType, BusinessLabels> = {
  Hotel: food(),
  Restaurant: food(),
  "Cafe / Coffee Shop": food("item"),
  "Small Hotel": food(),
  "Tiffin Center": food("tiffin"),
  "Bakery / Sweets": { ...food("item"), categories: BAKERY },
  "Bar & Restaurant": food("item"),
  Supermarket: shop(GROCERY),
  "Grocery Store": shop(GROCERY),
  "Kirana Store": shop(GROCERY),
  "General Store": shop(GROCERY),
  "Electronics Shop": shop(ELECTRONICS),
  "Mobile Shop": shop(MOBILE),
  "Electrical Shop": shop(ELECTRICAL),
  "Clothing Store": shop(CLOTHING),
  "Hardware Shop": shop(HARDWARE),
  "Paint Shop": shop(PAINT),
  "Medical Store": shop(MEDICAL),
};

export function labelsFor(type?: BusinessType | string): BusinessLabels {
  return BUSINESS_LABELS[normalizeBusinessType(type)];
}

/** Old / unknown business types fall back to a close match. */
export function normalizeBusinessType(t?: string): BusinessType {
  if ((BUSINESS_TYPES as string[]).includes(t ?? "")) return t as BusinessType;
  if (t === "Retail" || t === "General" || t === "Other") return "General Store";
  if (t === "Bakery") return "Bakery / Sweets";
  if (t === "Medical") return "Medical Store";
  if (t === "Kirana") return "Kirana Store";
  if (t === "Grocery") return "Grocery Store";
  return "Hotel";
}

/** Units of measurement for selling items. */
export const UNITS = [
  { v: "pcs", l: "Piece (pcs)" },
  { v: "plate", l: "Plate" },
  { v: "kg", l: "Kilogram (kg)" },
  { v: "g", l: "Gram (g)" },
  { v: "l", l: "Litre (L)" },
  { v: "ml", l: "Millilitre (ml)" },
  { v: "dozen", l: "Dozen" },
  { v: "pack", l: "Pack / Packet" },
  { v: "box", l: "Box" },
  { v: "bottle", l: "Bottle" },
  { v: "strip", l: "Strip" },
  { v: "meter", l: "Meter (m)" },
  { v: "set", l: "Set" },
];

/** Units where a decimal quantity makes sense (e.g. 0.5 kg). */
export const LOOSE_UNITS = ["kg", "g", "l", "ml", "meter"];
