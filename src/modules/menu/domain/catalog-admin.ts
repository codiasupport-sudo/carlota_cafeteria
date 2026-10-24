// Reglas puras de administración del catálogo (Etapa 2): permisos y validación. Sin framework ni base de datos.
import {
  SINGLE_PRICE_KEY,
  TAG_LABELS,
  centsToDecimal,
  normalizeText,
  toCents,
  type Money,
  type ProductTag,
  type Size,
} from "./catalog";

/** Roles del catálogo. El POS actual mapea admin→admin, caja→cashier, mesero→waiter (ver lib/catalog-session). */
export type CatalogRole = "owner" | "admin" | "cashier" | "waiter";

/** Solo owner y admin escriben en el catálogo; cashier y waiter únicamente consultan. */
export function canManageCatalog(role: CatalogRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export const MAX_PRICE_CENTS = 9_999_999; // $99,999.99, muy por debajo del límite de numeric(10,2)

export interface FieldError {
  field: string;
  message: string;
}

export type Validation<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };

export interface SizeInput {
  /** Presente si la talla ya existe (se conserva su clave). */
  key?: string;
  label: string;
  detail: string | null;
}

export interface CategoryInput {
  name: string;
  subtitle: string | null;
  note: string | null;
  showInMenu: boolean;
  sizes: SizeInput[];
}

export interface ProductInput {
  categoryId: string;
  name: string;
  description: string | null;
  tags: ProductTag[];
  showInMenu: boolean;
  available: boolean;
}

export interface PriceChange {
  priceKey: string;
  oldPrice: Money | null;
  newPrice: Money | null;
}

const clean = (value: unknown): string => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "");
const orNull = (value: string): string | null => (value === "" ? null : value);

/** "1,250.50", "$85" o "85.5" → "1250.50" / "85.00". Devuelve null si no es dinero válido, cero o excede el límite. */
export function parsePriceInput(raw: unknown): Money | null {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  let text = String(raw).trim().replace(/^\$\s*/, "");
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) text = text.replace(/,/g, "");
  const cents = toCents(text);
  if (cents === null || cents <= 0 || cents > MAX_PRICE_CENTS) return null;
  return centsToDecimal(cents);
}

/** Clave estable de talla a partir del nombre: "Extra Grande" → "extra_grande". */
export function sizeKeyFromLabel(label: string): string {
  return normalizeText(label).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 30);
}

export function validateCategoryInput(raw: Record<string, unknown>): Validation<CategoryInput> {
  const errors: FieldError[] = [];
  const name = clean(raw.name);
  const subtitle = clean(raw.subtitle);
  const note = clean(raw.note);
  if (!name) errors.push({ field: "name", message: "El nombre de la categoría es obligatorio." });
  if (name.length > 60) errors.push({ field: "name", message: "El nombre admite máximo 60 caracteres." });
  if (subtitle.length > 80) errors.push({ field: "subtitle", message: "El subtítulo admite máximo 80 caracteres." });
  if (note.length > 200) errors.push({ field: "note", message: "La nota admite máximo 200 caracteres." });

  const sizes: SizeInput[] = [];
  const seen = new Set<string>();
  const rawSizes = Array.isArray(raw.sizes) ? raw.sizes : [];
  for (const entry of rawSizes) {
    const s = (entry ?? {}) as Record<string, unknown>;
    const label = clean(s.label);
    if (!label) continue; // renglón vacío: se ignora
    const existingKey = clean(s.key);
    const key = existingKey || sizeKeyFromLabel(label);
    if (label.length > 30) errors.push({ field: "sizes", message: `La talla "${label}" excede 30 caracteres.` });
    if (!key || key === SINGLE_PRICE_KEY) errors.push({ field: "sizes", message: `Nombre de talla no permitido: "${label}".` });
    else if (seen.has(key)) errors.push({ field: "sizes", message: `La talla "${label}" está repetida.` });
    seen.add(key);
    sizes.push({ key, label, detail: orNull(clean(s.detail).slice(0, 30)) });
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { name, subtitle: orNull(subtitle), note: orNull(note), showInMenu: raw.showInMenu !== false, sizes } };
}

export function validateProductInput(raw: Record<string, unknown>): Validation<ProductInput> {
  const errors: FieldError[] = [];
  const name = clean(raw.name);
  const description = clean(raw.description);
  const categoryId = clean(raw.categoryId);
  if (!name) errors.push({ field: "name", message: "El nombre del producto es obligatorio." });
  if (name.length > 80) errors.push({ field: "name", message: "El nombre admite máximo 80 caracteres." });
  if (description.length > 300) errors.push({ field: "description", message: "La descripción admite máximo 300 caracteres." });
  if (!categoryId) errors.push({ field: "categoryId", message: "Selecciona una categoría." });

  const tags = (Array.isArray(raw.tags) ? raw.tags : []).filter((t): t is ProductTag => typeof t === "string" && t in TAG_LABELS);

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      categoryId,
      name,
      description: orNull(description),
      tags: [...new Set(tags)],
      showInMenu: raw.showInMenu !== false,
      available: raw.available !== false,
    },
  };
}

/**
 * Valida los precios contra las tallas de la categoría: sin tallas solo "unico"; con tallas, claves de esas tallas.
 * Devuelve precios normalizados a "85.00".
 */
export function validatePrices(sizes: Pick<Size, "key" | "label">[], raw: unknown): Validation<Record<string, Money>> {
  const errors: FieldError[] = [];
  const input = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const allowed = sizes.length ? new Set(sizes.map((s) => s.key)) : new Set([SINGLE_PRICE_KEY]);
  const labelOf = (key: string) => sizes.find((s) => s.key === key)?.label ?? "Precio";
  const prices: Record<string, Money> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === "" || value === null || value === undefined) continue; // talla sin precio
    if (!allowed.has(key)) {
      errors.push({ field: `price.${key}`, message: `La talla "${key}" no existe en esta categoría.` });
      continue;
    }
    const price = parsePriceInput(value);
    if (price === null) {
      errors.push({ field: `price.${key}`, message: `${labelOf(key)}: captura un monto válido mayor a $0.00 (ej. 85.00).` });
      continue;
    }
    prices[key] = price;
  }

  if (!errors.length && Object.keys(prices).length === 0) {
    errors.push({ field: "price", message: "Captura al menos un precio." });
  }
  return errors.length ? { ok: false, errors } : { ok: true, value: prices };
}

/** Diferencias entre dos juegos de precios (alta, cambio o baja). Ignora lo que no cambió. */
export function diffPrices(before: Record<string, Money>, after: Record<string, Money>): PriceChange[] {
  const changes: PriceChange[] = [];
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const oldPrice = before[key] ?? null;
    const newPrice = after[key] ?? null;
    if (oldPrice !== newPrice) changes.push({ priceKey: key, oldPrice, newPrice });
  }
  return changes;
}
