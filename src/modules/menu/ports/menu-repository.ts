import type { BusinessSettings, Category } from "../domain/catalog";

/** Lectura del catálogo para el menú público. */
export interface MenuReadRepository {
  getSettings(): Promise<BusinessSettings | null>;
  getCatalog(): Promise<Category[]>;
}

/** Registro de visitas al menú (sin datos personales). */
export interface VisitRepository {
  add(visitedAt: Date): Promise<void>;
}
