export type MenuItem = {
  id: string;
  hotelId: string;
  name: string;
  category: string;
  price: number;
  photo?: string; // data URL or https URL
  active?: boolean;
  unit?: string;     // pcs, kg, g, ml, l, pack ...
  barcode?: string;  // for USB scanner billing
  size?: string;     // e.g. "500 g", "1 L"
};

export const MENU_CATEGORIES = [
  "Tiffins",
  "Meals",
  "Curries",
  "Biryani",
  "Chinese",
  "Tandoori",
  "Breads",
  "Beverages",
  "Desserts",
  "Others",
];

export const SEED_MENU: MenuItem[] = [
  { id: "IT001", hotelId: "H001", name: "Idly (2 pcs)", category: "Tiffins", price: 30, active: true },
  { id: "IT002", hotelId: "H001", name: "Masala Dosa", category: "Tiffins", price: 70, active: true },
  { id: "IT003", hotelId: "H001", name: "Poori (2 pcs)", category: "Tiffins", price: 50, active: true },
  { id: "IT004", hotelId: "H001", name: "Veg Meals", category: "Meals", price: 120, active: true },
  { id: "IT005", hotelId: "H001", name: "Non-Veg Meals", category: "Meals", price: 180, active: true },
  { id: "IT006", hotelId: "H001", name: "Chicken Biryani", category: "Biryani", price: 220, active: true },
  { id: "IT007", hotelId: "H001", name: "Mutton Biryani", category: "Biryani", price: 320, active: true },
  { id: "IT008", hotelId: "H001", name: "Paneer Butter Masala", category: "Curries", price: 190, active: true },
  { id: "IT009", hotelId: "H001", name: "Butter Naan", category: "Breads", price: 45, active: true },
  { id: "IT010", hotelId: "H001", name: "Chicken 65", category: "Tandoori", price: 210, active: true },
  { id: "IT011", hotelId: "H001", name: "Gobi Manchurian", category: "Chinese", price: 160, active: true },
  { id: "IT012", hotelId: "H001", name: "Filter Coffee", category: "Beverages", price: 30, active: true },
];
