import { redirect } from "next/navigation";
import { MenuManager } from "@/components/menu-manager";
import { getCatalogActor } from "@/lib/catalog-session";
import { canManageCatalog } from "@/modules/menu/domain/catalog-admin";
import type { Category } from "@/modules/menu/domain/catalog";
import { getCatalogAdminRepository, getCatalogMode } from "@/modules/menu/infrastructure/repository-factory";

export default async function MenuPage() {
  const actor = await getCatalogActor();
  if (!actor) redirect("/login");

  const mode = getCatalogMode();
  let categories: Category[] = [];
  let loadError: string | null = null;
  try {
    categories = await getCatalogAdminRepository(mode).listCatalog();
  } catch (err) {
    console.error("catalogo:", err instanceof Error ? err.message : err);
    loadError = "No se pudo cargar el catálogo desde Supabase. Revisa la conexión y el esquema.";
  }

  // Solo owner/admin ven productos archivados.
  if (!canManageCatalog(actor.role)) {
    categories = categories.map((c) => ({ ...c, products: c.products.filter((p) => !p.archivedAt) }));
  }

  return <MenuManager role={actor.role} mode={mode} categories={categories} loadError={loadError} />;
}
