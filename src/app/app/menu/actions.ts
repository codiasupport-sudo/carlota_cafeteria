"use server";

import { revalidatePath } from "next/cache";
import { getCatalogActor, type CatalogActor } from "@/lib/catalog-session";
import { SINGLE_PRICE_KEY } from "@/modules/menu/domain/catalog";
import {
  canManageCatalog,
  validateCategoryInput,
  validatePrices,
  validateProductInput,
  type FieldError,
} from "@/modules/menu/domain/catalog-admin";
import {
  getCatalogAdminRepository,
  getCatalogMode,
  isWritableMode,
} from "@/modules/menu/infrastructure/repository-factory";
import {
  CatalogError,
  type CatalogAdminRepository,
  type PriceHistoryEntry,
} from "@/modules/menu/ports/catalog-admin-repository";

export type ActionResult = { ok: true; message: string } | { ok: false; error: string; fields?: FieldError[] };

const WRITE_BLOCKED: Record<string, string> = {
  "supabase-readonly": "Supabase está configurado pero falta SUPABASE_SERVICE_ROLE_KEY en el servidor: no se puede guardar.",
  "demo-readonly": "Modo demo en producción: las escrituras están desactivadas. Configura Supabase para guardar cambios.",
};

/** Toda escritura pasa por aquí: sesión → permiso de rol → modo de persistencia → ejecución → revalidación. */
async function write(
  run: (repo: CatalogAdminRepository, actor: CatalogActor) => Promise<string>,
): Promise<ActionResult> {
  const actor = await getCatalogActor();
  if (!actor) return { ok: false, error: "Tu sesión expiró. Vuelve a iniciar sesión." };
  if (!canManageCatalog(actor.role)) return { ok: false, error: "No tienes permiso para modificar el catálogo." };

  const mode = getCatalogMode();
  if (!isWritableMode(mode)) return { ok: false, error: WRITE_BLOCKED[mode] ?? "Escritura no disponible." };

  try {
    const message = await run(getCatalogAdminRepository(mode), actor);
    revalidatePath("/app/menu");
    revalidatePath("/m");
    return { ok: true, message };
  } catch (err) {
    if (err instanceof CatalogError) return { ok: false, error: err.message };
    console.error("catalogo:", err instanceof Error ? err.message : err);
    return { ok: false, error: "No se pudo guardar el cambio. Intenta de nuevo." };
  }
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const fail = (errors: FieldError[]): ActionResult => ({ ok: false, error: errors[0].message, fields: errors });

export async function saveCategory(id: string | null, raw: unknown): Promise<ActionResult> {
  const parsed = validateCategoryInput(asRecord(raw));
  if (!parsed.ok) return fail(parsed.errors);
  return write(async (repo) => {
    if (id) {
      await repo.updateCategory(id, parsed.value);
      return "Categoría actualizada.";
    }
    await repo.createCategory(parsed.value);
    return "Categoría creada.";
  });
}

export async function moveCategory(id: string, direction: "up" | "down"): Promise<ActionResult> {
  return write(async (repo) => {
    const ids = (await repo.listCatalog()).sort((a, b) => a.sort - b.sort).map((c) => c.id);
    const from = ids.indexOf(id);
    const to = direction === "up" ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= ids.length) throw new CatalogError("La categoría no se puede mover en esa dirección.");
    [ids[from], ids[to]] = [ids[to], ids[from]];
    await repo.reorderCategories(ids);
    return "Orden actualizado.";
  });
}

export async function setCategoryVisibility(id: string, showInMenu: boolean): Promise<ActionResult> {
  return write(async (repo) => {
    await repo.setCategoryVisibility(id, showInMenu === true);
    return showInMenu ? "Categoría visible en el menú público." : "Categoría oculta del menú público.";
  });
}

export async function createProduct(raw: unknown): Promise<ActionResult> {
  const input = asRecord(raw);
  const parsed = validateProductInput(input);
  if (!parsed.ok) return fail(parsed.errors);
  return write(async (repo, actor) => {
    const category = (await repo.listCatalog()).find((c) => c.id === parsed.value.categoryId);
    if (!category) throw new CatalogError("La categoría ya no existe.");
    const prices = validatePrices(category.sizes, input.prices);
    if (!prices.ok) throw new CatalogError(prices.errors[0].message);
    await repo.createProduct(parsed.value, prices.value, actor.name);
    return "Producto creado.";
  });
}

export async function updateProduct(id: string, raw: unknown): Promise<ActionResult> {
  const parsed = validateProductInput(asRecord(raw));
  if (!parsed.ok) return fail(parsed.errors);
  return write(async (repo) => {
    const catalog = await repo.listCatalog();
    const current = catalog.find((c) => c.products.some((p) => p.id === id));
    const product = current?.products.find((p) => p.id === id);
    if (!current || !product) throw new CatalogError("El producto ya no existe.");
    if (parsed.value.categoryId !== current.id) {
      const target = catalog.find((c) => c.id === parsed.value.categoryId);
      if (!target) throw new CatalogError("La categoría destino ya no existe.");
      const targetKeys = target.sizes.length ? target.sizes.map((s) => s.key) : [SINGLE_PRICE_KEY];
      if (Object.keys(product.prices).some((k) => !targetKeys.includes(k))) {
        throw new CatalogError("Los precios no coinciden con las tallas de la nueva categoría. Ajusta los precios o elige otra categoría.");
      }
    }
    await repo.updateProduct(id, parsed.value);
    return "Producto actualizado.";
  });
}

export async function saveProductPrices(id: string, rawPrices: unknown): Promise<ActionResult> {
  return write(async (repo, actor) => {
    const category = (await repo.listCatalog()).find((c) => c.products.some((p) => p.id === id));
    if (!category) throw new CatalogError("El producto ya no existe.");
    const prices = validatePrices(category.sizes, rawPrices);
    if (!prices.ok) throw new CatalogError(prices.errors[0].message);
    await repo.setProductPrices(id, prices.value, actor.name);
    return "Precios guardados y cambio registrado.";
  });
}

export async function setProductAvailability(id: string, available: boolean): Promise<ActionResult> {
  return write(async (repo) => {
    await repo.setProductAvailability(id, available === true);
    return available ? "Producto marcado como disponible." : "Producto marcado como agotado.";
  });
}

export async function setProductVisibility(id: string, showInMenu: boolean): Promise<ActionResult> {
  return write(async (repo) => {
    await repo.setProductVisibility(id, showInMenu === true);
    return showInMenu ? "Producto visible en el menú público." : "Producto oculto del menú público.";
  });
}

export async function setProductArchived(id: string, archived: boolean): Promise<ActionResult> {
  return write(async (repo) => {
    await repo.setProductArchived(id, archived === true);
    return archived ? "Producto archivado (conserva su historial)." : "Producto restaurado.";
  });
}

/** Consulta: cualquier rol con sesión puede ver el historial de precios. */
export async function loadPriceHistory(productId: string): Promise<PriceHistoryEntry[]> {
  const actor = await getCatalogActor();
  if (!actor) return [];
  try {
    return await getCatalogAdminRepository().getPriceHistory(productId, 8);
  } catch (err) {
    console.error("catalogo historial:", err instanceof Error ? err.message : err);
    return [];
  }
}
