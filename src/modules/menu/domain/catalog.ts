// Reglas puras del catálogo. Sin dependencias de framework ni de base de datos.

/** Clave de precio para productos sin tamaño. */
export const SINGLE_PRICE_KEY = "unico";

export type ProductTag = "nuevo" | "temporada" | "recomendado" | "sin_azucar";

export const TAG_LABELS: Record<ProductTag, string> = {
  nuevo: "Nuevo",
  temporada: "Temporada",
  recomendado: "Recomendado",
  sin_azucar: "Sin azúcar",
};

export interface Size {
  id: string;
  key: string;
  label: string;
  detail: string | null;
  sort: number;
}

/** Precio como texto decimal ("85.00"): el dinero nunca viaja como float. */
export type Money = string;

export interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  tags: ProductTag[];
  sort: number;
  showInMenu: boolean;
  available: boolean;
  archivedAt: string | null;
  /** Clave de tamaño (o "unico") → precio. */
  prices: Record<string, Money>;
}

export interface Category {
  id: string;
  name: string;
  subtitle: string | null;
  note: string | null;
  sort: number;
  showInMenu: boolean;
  sizes: Size[];
  products: Product[];
}

export interface BusinessHours {
  days: string;
  hours: string;
}

export interface BusinessSettings {
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  colorPrimary: string | null;
  colorAccent: string | null;
  colorText: string | null;
  address: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  hours: BusinessHours[];
  menuNotice: string | null;
  menuPublished: boolean;
  loyaltyUrl: string | null;
}

const MONEY_PATTERN = /^(\d+)(?:\.(\d{1,2}))?$/;

/** Convierte "85", "85.5", 85 o 85.5 a centavos enteros. Devuelve null si no es dinero válido. */
export function toCents(value: string | number): number | null {
  const text = typeof value === "number" ? String(value) : value.trim();
  const match = MONEY_PATTERN.exec(text);
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Centavos → "85.00" (formato de numeric(10,2)). */
export function centsToDecimal(cents: number): Money {
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

const mxnFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 85 → "$85.00"; 1250.5 → "$1,250.50"; sin precio → "—". */
export function formatPrice(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  const cents = toCents(value);
  if (cents === null) return "—";
  return mxnFormatter.format(cents / 100);
}

/** Minúsculas, sin acentos ni espacios repetidos: "Açaí" → "acai". */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function productMatches(product: Pick<Product, "name" | "description">, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  return normalizeText(`${product.name} ${product.description ?? ""}`).includes(q);
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** Solo acepta colores #RRGGBB (evita inyectar CSS desde la configuración). */
export function safeColor(value: string | null | undefined): string | null {
  return value && HEX_COLOR.test(value) ? value : null;
}

/** Solo ligas https para redes y Cliente Consentido. */
export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** "+52 (33) 1234-5678" → "https://wa.me/523312345678". */
export function whatsappLink(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}
