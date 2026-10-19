import { useEffect, useState, useSyncExternalStore } from "react";
import { useStore } from "@/lib/store";
import { getUser } from "@/lib/auth";
import { DEFAULT_FEATURES, labelsFor, normalizeBusinessType, type FeatureKey, type BusinessType } from "@/lib/business";

/** The account (business) the signed-in user belongs to, plus its enabled features. */
export function useAccount() {
  const hotels = useStore((s) => s.hotels);
  const [me, setMe] = useState<ReturnType<typeof getUser>>(null);
  useEffect(() => setMe(getUser()), []);

  const account = hotels.find((h) => h.id === me?.hotelId) ?? null;
  const businessType: BusinessType = normalizeBusinessType(account?.businessType);
  const features: FeatureKey[] = account?.features
    ? account.features
    : DEFAULT_FEATURES[businessType];

  return {
    me,
    account,
    businessType,
    features,
    labels: labelsFor(businessType),
    /** Super admin has no business account, so nothing is feature-gated for them. */
    has: (f: FeatureKey) => (me?.role === "SuperAdmin" ? true : features.includes(f)),
  };
}

// ---- Collapsible sidebar (remembered per device) ----
const SB_KEY = "rsp_sidebar_hidden";
let hidden = false;
const subs = new Set<() => void>();

function readHidden() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SB_KEY) === "1";
}

export function toggleSidebar() {
  hidden = !hidden;
  if (typeof window !== "undefined") localStorage.setItem(SB_KEY, hidden ? "1" : "0");
  subs.forEach((s) => s());
}

export function useSidebarHidden(): boolean {
  useEffect(() => {
    const v = readHidden();
    if (v !== hidden) { hidden = v; subs.forEach((s) => s()); }
  }, []);
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => subs.delete(cb); },
    () => hidden,
    () => false,
  );
}
