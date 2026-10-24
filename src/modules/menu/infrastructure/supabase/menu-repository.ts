import type { SupabaseClient } from "@supabase/supabase-js";
import { SINGLE_PRICE_KEY, type BusinessHours, type BusinessSettings, type Category, type ProductTag } from "../../domain/catalog";
import type { MenuReadRepository, VisitRepository } from "../../ports/menu-repository";
import { publicStorageUrl } from "./client";

interface SettingsRow {
  name: string;
  tagline: string | null;
  logo_path: string | null;
  color_primary: string | null;
  color_accent: string | null;
  color_text: string | null;
  address: string | null;
  whatsapp: string | null;
  instagram: string | null;
  facebook: string | null;
  hours: unknown;
  menu_notice: string | null;
  menu_published: boolean;
  loyalty_url: string | null;
}

interface CategoryRow {
  id: string;
  name: string;
  subtitle: string | null;
  note: string | null;
  sort: number;
  show_in_menu: boolean;
  category_sizes: { id: string; key: string; label: string; detail: string | null; sort: number }[];
  products: {
    id: string;
    name: string;
    description: string | null;
    image_path: string | null;
    tags: string[] | null;
    sort: number;
    show_in_menu: boolean;
    available: boolean;
    archived_at: string | null;
    product_prices: { price: string; size_id: string | null }[];
  }[];
}

// price::text → el dinero llega como texto exacto, nunca como float.
const CATALOG_SELECT = `id, name, subtitle, note, sort, show_in_menu,
  category_sizes ( id, key, label, detail, sort ),
  products ( id, name, description, image_path, tags, sort, show_in_menu, available, archived_at,
    product_prices ( price::text, size_id ) )`;

function parseHours(value: unknown): BusinessHours[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (h): h is BusinessHours => typeof h?.days === "string" && typeof h?.hours === "string",
  );
}

export class SupabaseMenuRepository implements MenuReadRepository, VisitRepository {
  constructor(private readonly db: SupabaseClient) {}

  async getSettings(): Promise<BusinessSettings | null> {
    const { data, error } = await this.db.from("business_settings").select("*").eq("id", 1).maybeSingle<SettingsRow>();
    if (error) throw new Error(`No se pudo leer business_settings: ${error.message}`);
    if (!data) return null;
    return {
      name: data.name,
      tagline: data.tagline,
      logoUrl: publicStorageUrl(data.logo_path),
      colorPrimary: data.color_primary,
      colorAccent: data.color_accent,
      colorText: data.color_text,
      address: data.address,
      whatsapp: data.whatsapp,
      instagram: data.instagram,
      facebook: data.facebook,
      hours: parseHours(data.hours),
      menuNotice: data.menu_notice,
      menuPublished: data.menu_published,
      loyaltyUrl: data.loyalty_url,
    };
  }

  async getCatalog(): Promise<Category[]> {
    const { data, error } = await this.db.from("categories").select(CATALOG_SELECT).order("sort").returns<CategoryRow[]>();
    if (error) throw new Error(`No se pudo leer el catálogo: ${error.message}`);
    return (data ?? []).map((c) => {
      const keyBySizeId = new Map(c.category_sizes.map((s) => [s.id, s.key]));
      return {
        id: c.id,
        name: c.name,
        subtitle: c.subtitle,
        note: c.note,
        sort: c.sort,
        showInMenu: c.show_in_menu,
        sizes: c.category_sizes,
        products: c.products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          imageUrl: publicStorageUrl(p.image_path),
          tags: (p.tags ?? []) as ProductTag[],
          sort: p.sort,
          showInMenu: p.show_in_menu,
          available: p.available,
          archivedAt: p.archived_at,
          prices: Object.fromEntries(
            p.product_prices.map((pp) => [pp.size_id ? (keyBySizeId.get(pp.size_id) ?? pp.size_id) : SINGLE_PRICE_KEY, pp.price]),
          ),
        })),
      };
    });
  }

  async add(): Promise<void> {
    // La hora la pone la base (now()); el parámetro del caso de uso queda para repos en memoria y pruebas.
    const { error } = await this.db.rpc("register_menu_visit");
    if (error) throw new Error(`No se pudo registrar la visita: ${error.message}`);
  }
}
