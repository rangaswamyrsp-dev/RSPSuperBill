export type Medicine = {
  id: string;
  name: string;
  batch: string;
  mrp: number;
  gst: number;
  stock: number;
  expiry: string;
  company: string;
  cost?: number;
  category?: string;
  code?: string;
  units?: string;
  pack?: string;
  rack?: string;
  minStock?: number;
};

export const MEDICINES: Medicine[] = [
  { id: "M001", name: "Paracetamol 500mg", batch: "B12A", mrp: 25, gst: 5, stock: 240, expiry: "2027-06", company: "Cipla" },
  { id: "M002", name: "Azithromycin 500mg", batch: "AZ88", mrp: 78, gst: 12, stock: 60, expiry: "2026-11", company: "Sun Pharma" },
  { id: "M003", name: "Amoxicillin 250mg", batch: "AM21", mrp: 55, gst: 12, stock: 150, expiry: "2027-02", company: "Dr Reddy's" },
  { id: "M004", name: "Cetirizine 10mg", batch: "CT09", mrp: 18, gst: 5, stock: 320, expiry: "2028-01", company: "Mankind" },
  { id: "M005", name: "Pantoprazole 40mg", batch: "PT44", mrp: 92, gst: 12, stock: 80, expiry: "2026-09", company: "Alkem" },
  { id: "M006", name: "Metformin 500mg", batch: "MT77", mrp: 34, gst: 5, stock: 210, expiry: "2027-08", company: "USV" },
  { id: "M007", name: "Amlodipine 5mg", batch: "AM55", mrp: 42, gst: 12, stock: 8, expiry: "2026-08", company: "Torrent" },
  { id: "M008", name: "Atorvastatin 10mg", batch: "AT10", mrp: 110, gst: 12, stock: 95, expiry: "2027-04", company: "Zydus" },
  { id: "M009", name: "Ibuprofen 400mg", batch: "IB40", mrp: 30, gst: 5, stock: 180, expiry: "2027-12", company: "Cipla" },
  { id: "M010", name: "Ranitidine 150mg", batch: "RN15", mrp: 22, gst: 12, stock: 4, expiry: "2026-07", company: "GSK" },
  { id: "M011", name: "Vitamin D3 60K", batch: "VD60", mrp: 65, gst: 5, stock: 140, expiry: "2028-03", company: "Mankind" },
  { id: "M012", name: "ORS Powder", batch: "OR01", mrp: 20, gst: 0, stock: 260, expiry: "2027-10", company: "FDC" },
];
