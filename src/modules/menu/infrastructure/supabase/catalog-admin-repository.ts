// Escritura persistente del catálogo. Usa la service role key SOLO en servidor, tras validar el rol en la acción.
// Requiere el SQL pendiente de la Etapa 2 (supabase/pendiente/etapa2-catalogo-admin.sql): historial de precios y RPC atómico.
import type { SupabaseClient } from "@supabase/supabase-js";
import { SINGLE_PRICE_KEY, type Category, type Money } from "../../domain/catalog";
import type { CategoryInput, ProductInput } from "../../domain/catalog-admin";
import { CatalogError, type CatalogAdminRepository, type PriceHistoryEntry } from "../../ports/catalog-admin-repository";
import { SupabaseMenuRepository } from "./menu-repository";

function fail(action: string, error: { message: string }): never {
  throw new Error(`${action}: ${error.message}`);
}

export class SupabaseCatalogAdminRepository extends SupabaseMenuRepository implements CatalogAdminRepository {
  constructor(private readonly admin: SupabaseClient) {
    super(admin);
  }

  async listCatalog(): Promise<Category[]> {
    return this.getCatalog();
  }

  async createCategory(input: CategoryInput): Promise<string> {
    const { data: last } = await this.admin.from("categories").select("sort").order("sort", { ascending: false }).limit(1);
    const sort = ((last?.[0]?.sort as number | undefined) ?? 0) + 10;
    const { data, error } = await this.admin
      .from("categories")
      .insert({ name: input.name, subtitle: input.subtitle, note: input.note, show_in_menu: input.showInMenu, sort })
      .select("id")
      .single();
    if (error) fail("No se pudo crear la categoría", error);
    const id = data.id as string;
    if (input.sizes.length) {
      const { error: sizeError } = await this.admin.from("category_sizes").insert(
        input.sizes.map((s, i) => ({ category_id: id, key: s.key, label: s.label, detail: s.detail, sort: (i + 1) * 10 })),
      );
      if (sizeError) {
        await this.admin.from("categories").delete().eq("id", id); // categoría recién creada, sin productos ni historial
        fail("No se pudieron crear las tallas", sizeError);
      }
    }
    return id;
  }

  async updateCategory(id: string, input: CategoryInput): Promise<void> {
    const { data: existing, error: readError } = await this.admin.from("category_sizes").select("id, key, label").eq("category_id", id);
    if (readError) fail("No se pudieron leer las tallas", readError);
    const nextKeys = new Set(input.sizes.map((s) => s.key));
    const removed = (existing ?? []).filter((s) => !nextKeys.has(s.key as string));
    if (removed.length) {
      const { count, error } = await this.admin
        .from("product_prices")
        .select("id", { count: "exact", head: true })
        .in("size_id", removed.map((s) => s.id as string));
      if (error) fail("No se pudo validar el uso de tallas", error);
      if (count) throw new CatalogError("No se puede quitar una talla que tiene precios capturados.");
    }

    const { error } = await this.admin
      .from("categories")
      .update({ name: input.name, subtitle: input.subtitle, note: input.note, show_in_menu: input.showInMenu })
      .eq("id", id);
    if (error) fail("No se pudo actualizar la categoría", error);

    if (input.sizes.length) {
      const { error: upsertError } = await this.admin.from("category_sizes").upsert(
        input.sizes.map((s, i) => ({ category_id: id, key: s.key, label: s.label, detail: s.detail, sort: (i + 1) * 10 })),
        { onConflict: "category_id,key" },
      );
      if (upsertError) fail("No se pudieron guardar las tallas", upsertError);
    }
    if (removed.length) {
      const { error: delError } = await this.admin.from("category_sizes").delete().in("id", removed.map((s) => s.id as string));
      if (delError) fail("No se pudieron quitar las tallas", delError);
    }
  }

  async reorderCategories(orderedIds: string[]): Promise<void> {
    for (const [i, id] of orderedIds.entries()) {
      const { error } = await this.admin.from("categories").update({ sort: (i + 1) * 10 }).eq("id", id);
      if (error) fail("No se pudo reordenar", error);
    }
  }

  async setCategoryVisibility(id: string, showInMenu: boolean): Promise<void> {
    const { error } = await this.admin.from("categories").update({ show_in_menu: showInMenu }).eq("id", id);
    if (error) fail("No se pudo cambiar la visibilidad", error);
  }

  async createProduct(input: ProductInput, prices: Record<string, Money>, changedBy: string): Promise<string> {
    const { data: last } = await this.admin
      .from("products")
      .select("sort")
      .eq("category_id", input.categoryId)
      .order("sort", { ascending: false })
      .limit(1);
    const sort = ((last?.[0]?.sort as number | undefined) ?? 0) + 10;
    const { data, error } = await this.admin
      .from("products")
      .insert({
        category_id: input.categoryId,
        name: input.name,
        description: input.description,
        tags: input.tags,
        show_in_menu: input.showInMenu,
        available: input.available,
        sort,
      })
      .select("id")
      .single();
    if (error) fail("No se pudo crear el producto", error);
    const id = data.id as string;
    try {
      await this.setProductPrices(id, prices, changedBy);
    } catch (err) {
      await this.admin.from("products").delete().eq("id", id); // sin precios ni historial: no hay nada que conservar
      throw err;
    }
    return id;
  }

  async updateProduct(id: string, input: ProductInput): Promise<void> {
    const { error } = await this.admin
      .from("products")
      .update({
        category_id: input.categoryId,
        name: input.name,
        description: input.description,
        tags: input.tags,
        show_in_menu: input.showInMenu,
        available: input.available,
      })
      .eq("id", id);
    if (error) fail("No se pudo actualizar el producto", error);
  }

  async setProductPrices(id: string, prices: Record<string, Money>, changedBy: string): Promise<void> {
    // Un solo RPC (transacción): reemplaza product_prices y registra product_price_history.
    const { error } = await this.admin.rpc("admin_set_product_prices", {
      p_product_id: id,
      p_prices: prices,
      p_changed_by: changedBy,
      p_single_key: SINGLE_PRICE_KEY,
    });
    if (error) fail("No se pudieron guardar los precios", error);
  }

  async setProductAvailability(id: string, available: boolean): Promise<void> {
    const { error } = await this.admin.from("products").update({ available }).eq("id", id);
    if (error) fail("No se pudo cambiar la disponibilidad", error);
  }

  async setProductVisibility(id: string, showInMenu: boolean): Promise<void> {
    const { error } = await this.admin.from("products").update({ show_in_menu: showInMenu }).eq("id", id);
    if (error) fail("No se pudo cambiar la visibilidad", error);
  }

  async setProductArchived(id: string, archived: boolean): Promise<void> {
    const { error } = await this.admin
      .from("products")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", id);
    if (error) fail("No se pudo archivar el producto", error);
  }

  async getPriceHistory(productId: string, limit: number): Promise<PriceHistoryEntry[]> {
    const { data, error } = await this.admin
      .from("product_price_history")
      .select("id, product_id, price_key, old_price::text, new_price::text, changed_by, changed_at")
      .eq("product_id", productId)
      .order("changed_at", { ascending: false })
      .limit(limit);
    if (error) fail("No se pudo leer el historial de precios", error);
    return (data ?? []).map((r) => ({
      id: String(r.id),
      productId: String(r.product_id),
      priceKey: String(r.price_key),
      oldPrice: (r.old_price as string | null) ?? null,
      newPrice: (r.new_price as string | null) ?? null,
      changedBy: String(r.changed_by),
      changedAt: String(r.changed_at),
    }));
  }
}
