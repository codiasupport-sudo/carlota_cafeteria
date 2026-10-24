import type { BusinessSettings, Category } from "../domain/catalog";
import type { MenuReadRepository } from "../ports/menu-repository";

export interface PublicMenu {
  unpublished: false;
  settings: BusinessSettings;
  categories: Category[];
}

export type PublicMenuResult = PublicMenu | { unpublished: true };

const bySort = <T extends { sort: number }>(a: T, b: T) => a.sort - b.sort;

/** RF-1, RF-9, RF-13: solo lo publicado, sin archivados ni ocultos, sin categorías vacías. */
export async function getPublicMenu(repo: MenuReadRepository): Promise<PublicMenuResult> {
  const settings = await repo.getSettings();
  if (!settings || !settings.menuPublished) return { unpublished: true };

  const categories = (await repo.getCatalog())
    .filter((c) => c.showInMenu)
    .map((c) => ({
      ...c,
      sizes: [...c.sizes].sort(bySort),
      products: c.products.filter((p) => p.showInMenu && !p.archivedAt).sort(bySort),
    }))
    .filter((c) => c.products.length > 0)
    .sort(bySort);

  return { unpublished: false, settings, categories };
}
