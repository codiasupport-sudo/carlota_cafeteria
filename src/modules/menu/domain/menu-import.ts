// Valida y normaliza datos/menu-inicial.json antes de importarlo (RF-17).
import { SINGLE_PRICE_KEY, TAG_LABELS, centsToDecimal, toCents, type ProductTag } from "./catalog";

export interface ImportError {
  /** Ubicación legible, ej. "categories[0] (Los más fríos) › items[3] (Matcha) › prices.jumbo". */
  path: string;
  message: string;
}

export interface NormalizedImport {
  business: {
    name: string;
    tagline: string | null;
    color_primary: string | null;
    color_accent: string | null;
    color_text: string | null;
    font_titles: string | null;
    font_body: string | null;
  };
  categories: {
    name: string;
    subtitle: string | null;
    note: string | null;
    sizes: { key: string; label: string; detail: string | null }[];
    items: {
      name: string;
      description: string | null;
      tags: ProductTag[];
      /** Clave de tamaño o "unico" → precio decimal como texto ("85.00"). */
      prices: Record<string, string>;
    }[];
  }[];
}

export type ImportValidation =
  | { ok: true; data: NormalizedImport; errors: [] }
  | { ok: false; errors: ImportError[] };

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const text = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

export function validateMenuImport(input: unknown): ImportValidation {
  const errors: ImportError[] = [];
  const fail = (path: string, message: string) => errors.push({ path, message });

  if (!isObject(input)) return { ok: false, errors: [{ path: "(raíz)", message: "El archivo debe ser un objeto JSON" }] };

  const business = isObject(input.business) ? input.business : null;
  if (!business) fail("business", "Falta la sección del negocio");
  const businessName = text(business?.name);
  if (business && !businessName) fail("business.name", "El nombre del negocio es obligatorio");
  const branding = isObject(business?.branding) ? business.branding : {};

  const categories: NormalizedImport["categories"] = [];
  if (!Array.isArray(input.categories) || input.categories.length === 0) {
    fail("categories", "Debe haber al menos una categoría");
  } else {
    const seenCategories = new Set<string>();
    input.categories.forEach((rawCategory, ci) => {
      const cat = isObject(rawCategory) ? rawCategory : {};
      const catName = text(cat.name);
      const catPath = `categories[${ci}]${catName ? ` (${catName})` : ""}`;
      if (!catName) fail(`${catPath}.name`, "El nombre de la categoría es obligatorio");
      else if (seenCategories.has(catName.toLowerCase())) fail(`${catPath}.name`, "Categoría repetida");
      else seenCategories.add(catName.toLowerCase());

      const sizes: NormalizedImport["categories"][number]["sizes"] = [];
      const rawSizes = cat.sizes ?? [];
      if (!Array.isArray(rawSizes)) fail(`${catPath}.sizes`, "Los tamaños deben ser una lista");
      else
        rawSizes.forEach((rawSize, si) => {
          const size = isObject(rawSize) ? rawSize : {};
          const key = text(size.key);
          const label = text(size.label);
          const sizePath = `${catPath} › sizes[${si}]`;
          if (!key) fail(`${sizePath}.key`, "La clave del tamaño es obligatoria");
          else if (key === SINGLE_PRICE_KEY) fail(`${sizePath}.key`, `"${SINGLE_PRICE_KEY}" está reservado para precio sin tamaño`);
          else if (sizes.some((s) => s.key === key)) fail(`${sizePath}.key`, "Tamaño repetido");
          if (!label) fail(`${sizePath}.label`, "El nombre del tamaño es obligatorio");
          if (key && label && key !== SINGLE_PRICE_KEY) sizes.push({ key, label, detail: text(size.detail) });
        });
      const sizeKeys = new Set(sizes.map((s) => s.key));

      const items: NormalizedImport["categories"][number]["items"] = [];
      if (!Array.isArray(cat.items) || cat.items.length === 0) {
        fail(`${catPath}.items`, "La categoría no tiene productos");
      } else {
        cat.items.forEach((rawItem, ii) => {
          const item = isObject(rawItem) ? rawItem : {};
          const itemName = text(item.name);
          const itemPath = `${catPath} › items[${ii}]${itemName ? ` (${itemName})` : ""}`;
          if (!itemName) fail(`${itemPath}.name`, "El nombre del producto es obligatorio");

          const prices: Record<string, string> = {};
          if (!isObject(item.prices) || Object.keys(item.prices).length === 0) {
            fail(`${itemPath}.prices`, "El producto no tiene precios");
          } else {
            for (const [key, rawPrice] of Object.entries(item.prices)) {
              const pricePath = `${itemPath} › prices.${key}`;
              const validKey = sizeKeys.size === 0 ? key === SINGLE_PRICE_KEY : sizeKeys.has(key);
              if (!validKey) {
                fail(
                  pricePath,
                  sizeKeys.size === 0
                    ? `La categoría no tiene tamaños; usa "${SINGLE_PRICE_KEY}"`
                    : `Tamaño inexistente; los válidos son: ${[...sizeKeys].join(", ")}`,
                );
                continue;
              }
              const isNegative =
                (typeof rawPrice === "number" && rawPrice < 0) ||
                (typeof rawPrice === "string" && rawPrice.trim().startsWith("-"));
              const cents =
                typeof rawPrice === "number" || typeof rawPrice === "string" ? toCents(rawPrice) : null;
              if (isNegative) fail(pricePath, "El precio no puede ser negativo");
              else if (cents === null) fail(pricePath, "El precio debe ser un número con máximo 2 decimales");
              else prices[key] = centsToDecimal(cents);
            }
          }

          const tags: ProductTag[] = [];
          if (item.tags !== undefined) {
            if (!Array.isArray(item.tags)) fail(`${itemPath}.tags`, "Las etiquetas deben ser una lista");
            else
              item.tags.forEach((tag, ti) => {
                if (typeof tag === "string" && tag in TAG_LABELS) tags.push(tag as ProductTag);
                else fail(`${itemPath} › tags[${ti}]`, `Etiqueta desconocida; válidas: ${Object.keys(TAG_LABELS).join(", ")}`);
              });
          }

          if (itemName) items.push({ name: itemName, description: text(item.description), tags, prices });
        });
      }

      if (catName) categories.push({ name: catName, subtitle: text(cat.subtitle), note: text(cat.note), sizes, items });
    });
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: [],
    data: {
      business: {
        name: businessName!,
        tagline: text(business?.tagline),
        color_primary: text(branding.primary),
        color_accent: text(branding.accent),
        color_text: text(branding.text),
        font_titles: text(branding.font_titles),
        font_body: text(branding.font_body),
      },
      categories,
    },
  };
}
