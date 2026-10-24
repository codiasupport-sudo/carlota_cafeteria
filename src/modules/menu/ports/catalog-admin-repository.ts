import type { Category, Money } from "../domain/catalog";
import type { CategoryInput, PriceChange, ProductInput } from "../domain/catalog-admin";

export interface PriceHistoryEntry extends PriceChange {
  id: string;
  productId: string;
  changedBy: string;
  changedAt: string;
}

/** Error de regla de negocio (mensaje apto para mostrar al usuario). */
export class CatalogError extends Error {}

/** Escritura y lectura administrativa del catálogo (incluye ocultos y archivados). Solo se usa en servidor. */
export interface CatalogAdminRepository {
  listCatalog(): Promise<Category[]>;
  createCategory(input: CategoryInput): Promise<string>;
  updateCategory(id: string, input: CategoryInput): Promise<void>;
  reorderCategories(orderedIds: string[]): Promise<void>;
  setCategoryVisibility(id: string, showInMenu: boolean): Promise<void>;
  createProduct(input: ProductInput, prices: Record<string, Money>, changedBy: string): Promise<string>;
  updateProduct(id: string, input: ProductInput): Promise<void>;
  setProductPrices(id: string, prices: Record<string, Money>, changedBy: string): Promise<void>;
  setProductAvailability(id: string, available: boolean): Promise<void>;
  setProductVisibility(id: string, showInMenu: boolean): Promise<void>;
  /** Archivado lógico (archived_at). Nunca borra físicamente. */
  setProductArchived(id: string, archived: boolean): Promise<void>;
  getPriceHistory(productId: string, limit: number): Promise<PriceHistoryEntry[]>;
}
