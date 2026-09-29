/** Datos del cliente que se reutilizan en el próximo pedido. */

export type CustomerProfile = {
  customerName: string;
  businessName: string;
  cuit: string;
  phone: string;
  address: string;
  delivery: "retiro" | "envio";
};

const STORAGE_KEY = "sofia-customer-v1";

export const EMPTY_CUSTOMER_PROFILE: CustomerProfile = {
  customerName: "",
  businessName: "",
  cuit: "",
  phone: "",
  address: "",
  delivery: "retiro",
};

let profile: CustomerProfile = EMPTY_CUSTOMER_PROFILE;
let hydrated = false;
const listeners = new Set<() => void>();

export function normalizeCustomerProfile(value: unknown): CustomerProfile {
  if (!value || typeof value !== "object") return { ...EMPTY_CUSTOMER_PROFILE };
  const raw = value as Partial<CustomerProfile>;
  return {
    customerName: String(raw.customerName ?? "").slice(0, 120),
    businessName: String(raw.businessName ?? "").slice(0, 160),
    cuit: String(raw.cuit ?? "").slice(0, 20),
    phone: String(raw.phone ?? "").slice(0, 40),
    address: String(raw.address ?? "").slice(0, 200),
    delivery: raw.delivery === "envio" ? "envio" : "retiro",
  };
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    profile = raw ? normalizeCustomerProfile(JSON.parse(raw)) : { ...EMPTY_CUSTOMER_PROFILE };
  } catch {
    profile = { ...EMPTY_CUSTOMER_PROFILE };
  }
}

function commit(next: CustomerProfile) {
  profile = normalizeCustomerProfile(next);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  for (const listener of listeners) listener();
}

export function subscribeCustomerProfile(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCustomerProfileSnapshot() {
  hydrate();
  return profile;
}

export function getServerCustomerProfileSnapshot() {
  return EMPTY_CUSTOMER_PROFILE;
}

export function saveCustomerProfile(next: CustomerProfile) {
  hydrate();
  const normalized = normalizeCustomerProfile(next);
  if (
    normalized.customerName === profile.customerName &&
    normalized.businessName === profile.businessName &&
    normalized.cuit === profile.cuit &&
    normalized.phone === profile.phone &&
    normalized.address === profile.address &&
    normalized.delivery === profile.delivery
  ) {
    return;
  }
  commit(normalized);
}

export function patchCustomerProfile(patch: Partial<CustomerProfile>) {
  hydrate();
  saveCustomerProfile({ ...profile, ...patch });
}
