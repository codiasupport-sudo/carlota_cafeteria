import "server-only";
import menuJson from "../../../../datos/menu-inicial.json";
import type { CatalogAdminRepository } from "../ports/catalog-admin-repository";
import type { MenuReadRepository, VisitRepository } from "../ports/menu-repository";
import { DemoCatalogRepository } from "./memory/demo-catalog-repository";
import { createAnonClient, createServiceClient, hasServiceRoleEnv, hasSupabaseEnv } from "./supabase/client";
import { SupabaseCatalogAdminRepository } from "./supabase/catalog-admin-repository";
import { SupabaseMenuRepository } from "./supabase/menu-repository";

type Repo = MenuReadRepository & VisitRepository;

// globalThis: el menú público y las acciones del panel deben compartir la misma instancia demo en desarrollo.
const globalForDemo = globalThis as unknown as { __carlotaDemoCatalog?: DemoCatalogRepository };

function getDemoRepo(): DemoCatalogRepository {
  globalForDemo.__carlotaDemoCatalog ??= new DemoCatalogRepository(menuJson, {
    // MENU_DEMO_UNPUBLISHED=1 permite probar la pantalla "Menú no disponible" sin base de datos.
    menuPublished: process.env.MENU_DEMO_UNPUBLISHED !== "1",
  });
  return globalForDemo.__carlotaDemoCatalog;
}

/** Supabase si hay variables de entorno; si no, modo demo con datos/menu-inicial.json. */
export function getMenuRepository(): Repo {
  if (hasSupabaseEnv()) return new SupabaseMenuRepository(createAnonClient());
  return getDemoRepo();
}

/**
 * Estado de persistencia del panel:
 * - supabase: escrituras persistentes (service role en servidor).
 * - supabase-readonly: hay Supabase pero falta SUPABASE_SERVICE_ROLE_KEY; no se escribe.
 * - demo-memory: sin Supabase; escrituras solo en memoria del servidor (se pierden al reiniciar).
 * - demo-readonly: sin Supabase en producción; escrituras bloqueadas.
 */
export type CatalogMode = "supabase" | "supabase-readonly" | "demo-memory" | "demo-readonly";

export function getCatalogMode(): CatalogMode {
  if (hasSupabaseEnv()) return hasServiceRoleEnv() ? "supabase" : "supabase-readonly";
  const demoWrites = process.env.NODE_ENV !== "production" || process.env.MENU_DEMO_WRITES === "1";
  return demoWrites ? "demo-memory" : "demo-readonly";
}

export function isWritableMode(mode: CatalogMode): boolean {
  return mode === "supabase" || mode === "demo-memory";
}

/** Repositorio administrativo (lee ocultos y archivados). Solo desde servidor, tras validar el rol. */
export function getCatalogAdminRepository(mode: CatalogMode = getCatalogMode()): CatalogAdminRepository {
  if (mode === "supabase") return new SupabaseCatalogAdminRepository(createServiceClient());
  if (mode === "supabase-readonly") return new SupabaseCatalogAdminRepository(createAnonClient()); // solo lectura: RLS anon
  return getDemoRepo();
}
