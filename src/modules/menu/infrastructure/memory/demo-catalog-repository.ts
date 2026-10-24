// Modo demo con escritura: los cambios viven SOLO en la memoria del servidor y se pierden al reiniciar.
// No es persistencia. La UI lo declara siempre (ver CatalogMode "demo-memory").
import { SINGLE_PRICE_KEY, type Category, type Money, type Product } from "../../domain/catalog";
import { diffPrices, type CategoryInput, type ProductInput } from "../../domain/catalog-admin";
import { CatalogError, type CatalogAdminRepository, type PriceHistoryEntry } from "../../ports/catalog-admin-repository";
import { JsonMenuRepository } from "../json/json-menu-repository";

export class DemoCatalogRepository extends JsonMenuRepository implements CatalogAdminRepository {
  private readonly history: PriceHistoryEntry[] = [];
  private seq = 0;

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${Date.now().toString(36)}-${this.seq}`;
  }

  private category(id: string): Category {
    const c = this.catalog.find((x) => x.id === id);
    if (!c) throw new CatalogError("La categoría ya no existe.");
    return c;
  }

  private find(productId: string): { category: Category; product: Product } {
    for (const category of this.catalog) {
      const product = category.products.find((p) => p.id === productId);
      if (product) return { category, product };
    }
    throw new CatalogError("El producto ya no existe.");
  }

  private logPrices(productId: string, before: Record<string, Money>, after: Record<string, Money>, changedBy: string) {
    const changedAt = new Date().toISOString();
    for (const change of diffPrices(before, after)) {
      this.history.unshift({ id: this.nextId("h"), productId, changedBy, changedAt, ...change });
    }
  }

  async listCatalog(): Promise<Category[]> {
    return structuredClone(this.catalog).sort((a, b) => a.sort - b.sort);
  }

  async createCategory(input: CategoryInput): Promise<string> {
    const id = this.nextId("c");
    const sort = Math.max(0, ...this.catalog.map((c) => c.sort)) + 10;
    this.catalog.push({
      id,
      name: input.name,
      subtitle: input.subtitle,
      note: input.note,
      sort,
      showInMenu: input.showInMenu,
      sizes: input.sizes.map((s, i) => ({ id: this.nextId("s"), key: s.key ?? "", label: s.label, detail: s.detail, sort: (i + 1) * 10 })),
      products: [],
    });
    return id;
  }

  async updateCategory(id: string, input: CategoryInput): Promise<void> {
    const category = this.category(id);
    const nextKeys = new Set(input.sizes.map((s) => s.key));
    for (const size of category.sizes) {
      if (nextKeys.has(size.key)) continue;
      if (category.products.some((p) => !p.archivedAt && p.prices[size.key] !== undefined)) {
        throw new CatalogError(`No se puede quitar la talla "${size.label}": hay productos con precio en esa talla.`);
      }
    }
    const byKey = new Map(category.sizes.map((s) => [s.key, s]));
    category.name = input.name;
    category.subtitle = input.subtitle;
    category.note = input.note;
    category.showInMenu = input.showInMenu;
    category.sizes = input.sizes.map((s, i) => ({
      id: byKey.get(s.key ?? "")?.id ?? this.nextId("s"),
      key: s.key ?? "",
      label: s.label,
      detail: s.detail,
      sort: (i + 1) * 10,
    }));
  }

  async reorderCategories(orderedIds: string[]): Promise<void> {
    orderedIds.forEach((id, i) => {
      this.category(id).sort = (i + 1) * 10;
    });
  }

  async setCategoryVisibility(id: string, showInMenu: boolean): Promise<void> {
    this.category(id).showInMenu = showInMenu;
  }

  async createProduct(input: ProductInput, prices: Record<string, Money>, changedBy: string): Promise<string> {
    const category = this.category(input.categoryId);
    const id = this.nextId("p");
    category.products.push({
      id,
      name: input.name,
      description: input.description,
      imageUrl: null,
      tags: input.tags,
      sort: Math.max(0, ...category.products.map((p) => p.sort)) + 10,
      showInMenu: input.showInMenu,
      available: input.available,
      archivedAt: null,
      prices,
    });
    this.logPrices(id, {}, prices, changedBy);
    return id;
  }

  async updateProduct(id: string, input: ProductInput): Promise<void> {
    const { category, product } = this.find(id);
    if (input.categoryId !== category.id) {
      const target = this.category(input.categoryId);
      const targetKeys = target.sizes.length ? target.sizes.map((s) => s.key) : [SINGLE_PRICE_KEY];
      if (Object.keys(product.prices).some((k) => !targetKeys.includes(k))) {
        throw new CatalogError("Los precios del producto no coinciden con las tallas de la nueva categoría. Cambia primero sus precios.");
      }
      category.products = category.products.filter((p) => p.id !== id);
      target.products.push(product);
    }
    product.name = input.name;
    product.description = input.description;
    product.tags = input.tags;
    product.showInMenu = input.showInMenu;
    product.available = input.available;
  }

  async setProductPrices(id: string, prices: Record<string, Money>, changedBy: string): Promise<void> {
    const { product } = this.find(id);
    this.logPrices(id, product.prices, prices, changedBy);
    product.prices = prices;
  }

  async setProductAvailability(id: string, available: boolean): Promise<void> {
    this.find(id).product.available = available;
  }

  async setProductVisibility(id: string, showInMenu: boolean): Promise<void> {
    this.find(id).product.showInMenu = showInMenu;
  }

  async setProductArchived(id: string, archived: boolean): Promise<void> {
    this.find(id).product.archivedAt = archived ? new Date().toISOString() : null;
  }

  async getPriceHistory(productId: string, limit: number): Promise<PriceHistoryEntry[]> {
    return this.history.filter((h) => h.productId === productId).slice(0, limit);
  }
}
