import { supabase } from "@/lib/supabase";
import type {
  Hotel,
  MenuItem,
  Medicine,
  Customer,
  Supplier,
  Sale,
  Purchase,
  FinanceEntry,
  Attendance,
  PrinterSettings,
} from "@/lib/store";
import type { BusinessType, FeatureKey } from "@/lib/business";
import { DEFAULT_FEATURES, normalizeBusinessType } from "@/lib/business";

/** Convert DB tenant row to Hotel model */
export function tenantToHotel(t: any): Hotel {
  const businessType = normalizeBusinessType(t.type);
  const rawFeatures = t.features;
  let features: FeatureKey[] = DEFAULT_FEATURES[businessType];

  if (rawFeatures) {
    if (Array.isArray(rawFeatures.modules)) {
      features = rawFeatures.modules;
    } else if (typeof rawFeatures === "object") {
      const activeKeys = Object.entries(rawFeatures)
        .filter(([k, v]) => v === true && k !== "superbill" && k !== "apps")
        .map(([k]) => k as FeatureKey);
      if (activeKeys.length > 0) features = activeKeys;
    }
  }

  return {
    id: t.id,
    name: t.name || "Business",
    loginId: t.admin_phone || t.id,
    password: t.admin_password || "",
    ownerName: t.admin_name || t.name,
    phone: t.admin_phone || "",
    city: t.city || "",
    state: t.state || "Andhra Pradesh",
    plan: "Monthly",
    businessType,
    features,
    active: t.active ?? true,
    createdAt: t.created_at || new Date().toISOString(),
  };
}

export const db = {
  // ---- TENANTS / BUSINESS ACCOUNTS (Super Admin) ----
  async getTenants(): Promise<Hotel[]> {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tenants:", error);
      return [];
    }

    // Filter to SuperBill-eligible tenants or show all in Super Admin
    return (data || []).map(tenantToHotel);
  },

  async createTenant(h: Omit<Hotel, "createdAt">): Promise<Hotel | null> {
    const id = h.id || "T" + Math.floor(100000 + Math.random() * 900000);
    const businessType = normalizeBusinessType(h.businessType);

    const featureObj: Record<string, any> = {
      superbill: true,
      apps: ["superbill"],
      modules: h.features || DEFAULT_FEATURES[businessType],
    };
    (h.features || DEFAULT_FEATURES[businessType]).forEach((f) => {
      featureObj[f] = true;
    });

    // 1. Try secure provisioning RPC first
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc("superbill_provision_shop", {
        p_tenant_id: id,
        p_name: h.name.trim(),
        p_type: businessType,
        p_owner_name: h.ownerName || h.name,
        p_phone: h.loginId.trim(),
        p_password: h.password,
        p_features: featureObj,
        p_city: h.city || null,
        p_state: h.state || "Andhra Pradesh",
      });

      if (!rpcErr && rpcRes?.success && rpcRes.tenant) {
        return tenantToHotel(rpcRes.tenant);
      }
    } catch {
      // RPC not yet applied, fallback to direct insert below
    }

    // 2. Direct database insert fallback
    const payload = {
      id,
      name: h.name.trim(),
      type: businessType,
      admin_name: h.ownerName || h.name,
      admin_phone: h.loginId.trim(),
      admin_password: h.password,
      active: h.active ?? true,
      city: h.city || null,
      state: h.state || "Andhra Pradesh",
      features: featureObj,
    };

    const { data, error } = await supabase
      .from("tenants")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error("Failed to insert tenant:", error);
      throw error;
    }
    return tenantToHotel(data);
  },

  async updateTenant(id: string, patch: Partial<Hotel>): Promise<boolean> {
    const updateObj: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.name !== undefined) updateObj.name = patch.name;
    if (patch.ownerName !== undefined) updateObj.admin_name = patch.ownerName;
    if (patch.loginId !== undefined) updateObj.admin_phone = patch.loginId;
    if (patch.password !== undefined) updateObj.admin_password = patch.password;
    if (patch.active !== undefined) updateObj.active = patch.active;
    if (patch.city !== undefined) updateObj.city = patch.city;
    if (patch.state !== undefined) updateObj.state = patch.state;
    if (patch.businessType !== undefined) updateObj.type = normalizeBusinessType(patch.businessType);

    if (patch.features !== undefined || patch.businessType !== undefined) {
      const bType = normalizeBusinessType(patch.businessType);
      const featureObj: Record<string, any> = {
        superbill: true,
        apps: ["superbill"],
        modules: patch.features || DEFAULT_FEATURES[bType],
      };
      (patch.features || DEFAULT_FEATURES[bType]).forEach((f) => {
        featureObj[f] = true;
      });
      updateObj.features = featureObj;
    }

    const { error } = await supabase.from("tenants").update(updateObj).eq("id", id);
    if (error) {
      console.error("Failed to update tenant:", error);
      return false;
    }
    return true;
  },

  async deleteTenant(id: string): Promise<boolean> {
    const { error } = await supabase.from("tenants").delete().eq("id", id);
    if (error) {
      console.error("Failed to delete tenant:", error);
      return false;
    }
    return true;
  },

  // ---- MEDICINES / PRODUCTS / ITEMS (Tenant scoped) ----
  async getProducts(tenantId: string): Promise<{ menuItems: MenuItem[]; medicines: Medicine[] }> {
    if (!tenantId) return { menuItems: [], medicines: [] };
    const { data, error } = await supabase
      .from("medicines")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching products:", error);
      return { menuItems: [], medicines: [] };
    }

    const menuItems: MenuItem[] = (data || []).map((m) => ({
      id: m.id,
      hotelId: m.tenant_id,
      name: m.name,
      category: m.category || "General",
      price: Number(m.mrp) || 0,
      photo: m.company || undefined,
      active: true,
      unit: m.units || "pcs",
      barcode: m.code || undefined,
      size: m.pack || undefined,
      stock: Number(m.stock) || 0,
    }));

    const medicines: Medicine[] = (data || []).map((m) => ({
      id: m.id,
      name: m.name,
      code: m.code || undefined,
      company: m.company || undefined,
      category: m.category || undefined,
      batch: m.batch || "STANDARD",
      expiry: m.expiry || "",
      mrp: Number(m.mrp) || 0,
      cost: Number(m.cost) || 0,
      gst: Number(m.gst) || 0,
      stock: Number(m.stock) || 0,
      minStock: Number(m.min_stock) || 10,
      rack: m.rack || undefined,
      units: m.units || undefined,
      pack: m.pack || undefined,
    }));

    return { menuItems, medicines };
  },

  async saveProduct(tenantId: string, item: Partial<MenuItem> & { name: string; price?: number; stock?: number; batch?: string; expiry?: string; cost?: number; gst?: number }): Promise<string> {
    if (!tenantId) throw new Error("No tenant specified");
    const id = item.id || "M" + Date.now().toString().slice(-6);

    const payload = {
      id,
      tenant_id: tenantId,
      name: item.name.trim(),
      code: item.barcode || item.id || null,
      company: item.photo || null,
      category: item.category || "General",
      batch: item.batch || "STANDARD",
      expiry: item.expiry || "",
      mrp: item.price ?? 0,
      cost: item.cost ?? (item.price ? Math.round(item.price * 0.7) : 0),
      gst: item.gst ?? 0,
      stock: item.stock ?? 100,
      min_stock: 10,
      units: item.unit || "pcs",
      pack: item.size || "1",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("medicines").upsert([payload]);
    if (error) {
      console.error("Failed to save product:", error);
      throw error;
    }
    return id;
  },

  async deleteProduct(tenantId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from("medicines")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);
    return !error;
  },

  async adjustStock(tenantId: string, productId: string, delta: number): Promise<void> {
    if (!tenantId || !productId) return;
    const { data } = await supabase
      .from("medicines")
      .select("stock")
      .eq("tenant_id", tenantId)
      .eq("id", productId)
      .single();

    if (data) {
      const nextStock = Math.max(0, (Number(data.stock) || 0) + delta);
      await supabase
        .from("medicines")
        .update({ stock: nextStock, updated_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", productId);
    }
  },

  // ---- SALES & BILLING (Tenant scoped) ----
  async getSales(tenantId: string): Promise<Sale[]> {
    if (!tenantId) return [];
    const { data: salesData, error: sErr } = await supabase
      .from("sales")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (sErr || !salesData) return [];

    const saleIds = salesData.map((s) => s.id);
    let itemsMap: Record<string, any[]> = {};
    if (saleIds.length > 0) {
      const { data: itemsData } = await supabase
        .from("sale_items")
        .select("*")
        .eq("tenant_id", tenantId)
        .in("sale_id", saleIds);

      if (itemsData) {
        itemsData.forEach((it) => {
          if (!itemsMap[it.sale_id]) itemsMap[it.sale_id] = [];
          itemsMap[it.sale_id].push({
            id: it.id,
            name: it.medicine_name,
            batch: it.batch || "",
            qty: Number(it.quantity) || 1,
            mrp: Number(it.mrp) || 0,
            gst: Number(it.gst) || 0,
            discount: Number(it.discount) || 0,
            total: Number(it.total) || 0,
          });
        });
      }
    }

    return salesData.map((s) => ({
      id: s.id,
      date: s.sale_date || s.created_at,
      customerId: s.customer_id,
      customerName: s.customer_name || "Walk-in",
      phone: s.phone || "",
      doctor: s.doctor || undefined,
      table: undefined,
      items: itemsMap[s.id] || [],
      sub: Number(s.subtotal) || 0,
      disc: Number(s.discount) || 0,
      gst: Number(s.gst) || 0,
      grand: Number(s.grand_total) || 0,
      payment: s.payment_mode || "Cash",
      status: s.status === "cancelled" ? "cancelled" : "paid",
      cashierId: s.cashier_id || undefined,
      cashierName: s.cashier_name || undefined,
      hotelId: s.tenant_id,
    }));
  },

  async saveSale(tenantId: string, sale: Omit<Sale, "id" | "date" | "status"> & { id?: string }): Promise<Sale> {
    const id = sale.id || "INV" + Date.now().toString().slice(-6);
    const now = new Date().toISOString();

    const saleRecord = {
      id,
      tenant_id: tenantId,
      sale_date: now,
      customer_id: sale.customerId || null,
      customer_name: sale.customerName,
      phone: sale.phone || null,
      doctor: sale.doctor || null,
      subtotal: sale.sub,
      discount: sale.disc,
      gst: sale.gst,
      grand_total: sale.grand,
      payment_mode: sale.payment || "Cash",
      status: "paid",
      cashier_id: sale.cashierId || null,
      cashier_name: sale.cashierName || null,
      created_at: now,
      updated_at: now,
    };

    const { error: sErr } = await supabase.from("sales").insert([saleRecord]);
    if (sErr) {
      console.error("Failed to insert sale:", sErr);
      throw sErr;
    }

    if (sale.items && sale.items.length > 0) {
      const itemsPayload = sale.items.map((it, idx) => ({
        id: `ITEM-${Date.now()}-${idx}`,
        sale_id: id,
        tenant_id: tenantId,
        medicine_id: it.id || null,
        medicine_name: it.name,
        batch: it.batch || "STANDARD",
        quantity: it.qty,
        mrp: it.mrp,
        gst: it.gst || 0,
        discount: it.discount || 0,
        total: it.total,
        created_at: now,
      }));

      await supabase.from("sale_items").insert(itemsPayload);

      // Decrement stock in medicines
      for (const it of sale.items) {
        if (it.id) {
          await db.adjustStock(tenantId, it.id, -it.qty);
        } else {
          // Find by name
          const { data } = await supabase
            .from("medicines")
            .select("id, stock")
            .eq("tenant_id", tenantId)
            .eq("name", it.name)
            .limit(1);
          if (data && data[0]) {
            await db.adjustStock(tenantId, data[0].id, -it.qty);
          }
        }
      }
    }

    return {
      ...sale,
      id,
      date: now,
      status: "paid",
    };
  },

  async cancelSale(tenantId: string, saleId: string): Promise<boolean> {
    const { error } = await supabase
      .from("sales")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("tenant_id", tenantId)
      .eq("id", saleId);

    if (error) return false;

    // Restore stock
    const { data: items } = await supabase
      .from("sale_items")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("sale_id", saleId);

    if (items) {
      for (const it of items) {
        if (it.medicine_id) {
          await db.adjustStock(tenantId, it.medicine_id, Number(it.quantity) || 0);
        }
      }
    }
    return true;
  },

  // ---- PURCHASES (Tenant scoped) ----
  async getPurchases(tenantId: string): Promise<Purchase[]> {
    if (!tenantId) return [];
    const { data: purData, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error || !purData) return [];

    const purIds = purData.map((p) => p.id);
    let itemsMap: Record<string, any[]> = {};
    if (purIds.length > 0) {
      const { data: pItems } = await supabase
        .from("purchase_items")
        .select("*")
        .eq("tenant_id", tenantId)
        .in("purchase_id", purIds);

      if (pItems) {
        pItems.forEach((it) => {
          if (!itemsMap[it.purchase_id]) itemsMap[it.purchase_id] = [];
          itemsMap[it.purchase_id].push({
            name: it.medicine_name,
            batch: it.batch || "STANDARD",
            qty: Number(it.quantity) || 1,
            rate: Number(it.purchase_rate) || 0,
            gst: Number(it.gst) || 0,
          });
        });
      }
    }

    return purData.map((p) => ({
      id: p.id,
      date: p.purchase_date || p.created_at?.slice(0, 10),
      supplier: p.supplier_name || "Supplier",
      invoiceNo: p.invoice_no || "",
      items: itemsMap[p.id] || [],
      total: Number(p.total) || 0,
    }));
  },

  async savePurchase(tenantId: string, pur: Omit<Purchase, "id"> & { id?: string }): Promise<Purchase> {
    const id = pur.id || "P" + Date.now().toString().slice(-6);
    const now = new Date().toISOString();

    const purRecord = {
      id,
      tenant_id: tenantId,
      supplier_name: pur.supplier,
      invoice_no: pur.invoiceNo,
      purchase_date: pur.date || now.slice(0, 10),
      total: pur.total,
      subtotal: pur.total,
      discount: 0,
      gst: 0,
      created_at: now,
    };

    const { error: pErr } = await supabase.from("purchases").insert([purRecord]);
    if (pErr) {
      console.error("Failed to insert purchase:", pErr);
      throw pErr;
    }

    if (pur.items && pur.items.length > 0) {
      const itemsPayload = pur.items.map((it, idx) => ({
        id: `${id}_ITEM_${idx + 1}`,
        tenant_id: tenantId,
        purchase_id: id,
        medicine_name: it.name,
        batch: it.batch || "STANDARD",
        quantity: it.qty,
        purchase_rate: it.rate,
        mrp: Math.round(it.rate * 1.3),
        gst: it.gst || 0,
        discount: 0,
        total: Math.round(it.qty * it.rate * (1 + (it.gst || 0) / 100)),
        created_at: now,
      }));

      await supabase.from("purchase_items").insert(itemsPayload);

      // Increase stock in medicines or create product if missing
      for (const it of pur.items) {
        const { data } = await supabase
          .from("medicines")
          .select("id, stock")
          .eq("tenant_id", tenantId)
          .eq("name", it.name)
          .limit(1);

        if (data && data[0]) {
          await db.adjustStock(tenantId, data[0].id, it.qty);
        } else {
          await db.saveProduct(tenantId, {
            name: it.name,
            batch: it.batch || "STANDARD",
            price: Math.round(it.rate * 1.3),
            cost: it.rate,
            gst: it.gst,
            stock: it.qty,
            category: "General",
          });
        }
      }
    }

    return { ...pur, id };
  },

  // ---- CUSTOMERS (Tenant scoped) ----
  async getCustomers(tenantId: string): Promise<Customer[]> {
    if (!tenantId) return [];
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((c) => ({
      id: c.id,
      name: c.name || "Customer",
      phone: c.phone || "",
      doctor: c.doctor || undefined,
      address: c.address || undefined,
      balance: Number(c.balance) || 0,
      createdAt: c.created_at || new Date().toISOString(),
    }));
  },

  async saveCustomer(tenantId: string, cust: Omit<Customer, "id" | "createdAt"> & { id?: string }): Promise<Customer> {
    const id = cust.id || "C" + Date.now().toString().slice(-6);
    const now = new Date().toISOString();

    const payload = {
      id,
      tenant_id: tenantId,
      name: cust.name.trim(),
      phone: cust.phone.trim(),
      doctor: cust.doctor || null,
      address: cust.address || null,
      balance: cust.balance || 0,
      active: true,
      updated_at: now,
    };

    const { error } = await supabase.from("customers").upsert([payload]);
    if (error) {
      console.error("Failed to save customer:", error);
      throw error;
    }
    return { ...cust, id, createdAt: now };
  },

  async deleteCustomer(tenantId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);
    return !error;
  },

  // ---- SUPPLIERS (Tenant scoped) ----
  async getSuppliers(tenantId: string): Promise<Supplier[]> {
    if (!tenantId) return [];
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((s) => ({
      id: s.id,
      name: s.name || "Supplier",
      phone: s.phone || "",
      gstin: s.gstin || undefined,
      city: s.address || undefined,
      balance: 0,
    }));
  },

  async saveSupplier(tenantId: string, supp: Omit<Supplier, "id"> & { id?: string }): Promise<Supplier> {
    const id = supp.id || "S" + Date.now().toString().slice(-6);
    const now = new Date().toISOString();

    const payload = {
      id,
      tenant_id: tenantId,
      name: supp.name.trim(),
      phone: supp.phone.trim(),
      gstin: supp.gstin || null,
      address: supp.city || null,
      updated_at: now,
    };

    const { error } = await supabase.from("suppliers").upsert([payload]);
    if (error) {
      console.error("Failed to save supplier:", error);
      throw error;
    }
    return { ...supp, id };
  },

  // ---- FINANCE / INCOME & EXPENSE (Tenant scoped) ----
  async getFinance(tenantId: string): Promise<FinanceEntry[]> {
    if (!tenantId) return [];
    const { data, error } = await supabase
      .from("finance_entries")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("entry_date", { ascending: false });

    if (error || !data) return [];
    return data.map((f) => ({
      id: f.id,
      hotelId: f.tenant_id,
      date: f.entry_date || f.created_at?.slice(0, 10),
      kind: f.type === "income" ? "income" : "expense",
      title: f.title || "",
      category: f.category || "General",
      amount: Number(f.amount) || 0,
      payment: f.payment_mode || "Cash",
      note: f.reference || undefined,
    }));
  },

  async addFinance(tenantId: string, entry: Omit<FinanceEntry, "id"> & { id?: string }): Promise<FinanceEntry> {
    const id = entry.id || "F" + Date.now().toString().slice(-8);
    const now = new Date().toISOString();

    const payload = {
      id,
      tenant_id: tenantId,
      entry_date: entry.date || now.slice(0, 10),
      type: entry.kind,
      title: entry.title,
      category: entry.category,
      amount: entry.amount,
      payment_mode: entry.payment,
      reference: entry.note || null,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from("finance_entries").insert([payload]);
    if (error) {
      console.error("Failed to insert finance entry:", error);
      throw error;
    }
    return { ...entry, id };
  },

  async deleteFinance(tenantId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from("finance_entries")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);
    return !error;
  },

  // ---- ATTENDANCE (Tenant scoped) ----
  async getAttendance(tenantId: string): Promise<Attendance[]> {
    if (!tenantId) return [];
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("attendance_date", { ascending: false });

    if (error || !data) return [];
    return data.map((a) => ({
      id: a.id,
      hotelId: a.tenant_id,
      employeeId: a.employee_id || "",
      employeeName: a.employee_name || "",
      date: a.attendance_date || a.created_at?.slice(0, 10),
      status: a.status || "full",
      note: undefined,
    }));
  },

  async markAttendance(tenantId: string, att: Omit<Attendance, "id"> & { id?: string }): Promise<Attendance> {
    const id = att.id || "AT" + Date.now().toString().slice(-8);
    const now = new Date().toISOString();

    // Remove existing for same date & employee
    await supabase
      .from("attendance")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("employee_id", att.employeeId)
      .eq("attendance_date", att.date);

    const payload = {
      id,
      tenant_id: tenantId,
      employee_id: att.employeeId,
      employee_name: att.employeeName,
      attendance_date: att.date,
      status: att.status,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase.from("attendance").insert([payload]);
    if (error) {
      console.error("Failed to mark attendance:", error);
      throw error;
    }
    return { ...att, id };
  },

  async deleteAttendance(tenantId: string, id: string): Promise<boolean> {
    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);
    return !error;
  },
};
