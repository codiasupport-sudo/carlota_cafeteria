// Modo demo / desarrollo: sin Supabase configurado, el menú se lee de datos/menu-inicial.json.
import type { BusinessSettings, Category } from "../../domain/catalog";
import { validateMenuImport } from "../../domain/menu-import";
import type { MenuReadRepository, VisitRepository } from "../../ports/menu-repository";

export class JsonMenuRepository implements MenuReadRepository, VisitRepository {
  readonly visits: Date[] = [];
  protected readonly settings: BusinessSettings;
  protected readonly catalog: Category[];

  constructor(json: unknown, overrides: Partial<BusinessSettings> = {}) {
    const result = validateMenuImport(json);
    if (!result.ok) throw new Error(`menu-inicial.json inválido: ${result.errors.map((e) => `${e.path}: ${e.message}`).join("; ")}`);
    const { business, categories } = result.data;

    this.settings = {
      name: business.name,
      tagline: business.tagline,
      logoUrl: "/brand/ilustraciones/logo-cafeteria.png",
      colorPrimary: business.color_primary,
      colorAccent: business.color_accent,
      colorText: business.color_text,
      address: null,
      whatsapp: null,
      instagram: null,
      facebook: null,
      hours: [],
      menuNotice: null,
      menuPublished: true,
      loyaltyUrl: null,
      ...overrides,
    };

    this.catalog = categories.map((c, ci) => ({
      id: `c${ci}`,
      name: c.name,
      subtitle: c.subtitle,
      note: c.note,
      sort: (ci + 1) * 10,
      showInMenu: true,
      sizes: c.sizes.map((s, si) => ({ id: `c${ci}s${si}`, ...s, sort: (si + 1) * 10 })),
      products: c.items.map((p, pi) => ({
        id: `c${ci}p${pi}`,
        name: p.name,
        description: p.description,
        imageUrl: null,
        tags: p.tags,
        sort: (pi + 1) * 10,
        showInMenu: true,
        available: true,
        archivedAt: null,
        prices: p.prices,
      })),
    }));
  }

  async getSettings() {
    return this.settings;
  }

  async getCatalog() {
    return this.catalog;
  }

  async add(visitedAt: Date) {
    this.visits.push(visitedAt);
  }
}
