import { readFile } from "node:fs/promises";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ImportPayload, MenuImportGateway } from "../../application/import-menu";
import { MENU_BUCKET } from "./client";

const LOGO_STORAGE_PATH = "brand/logo-cafeteria.png";

export class SupabaseImportGateway implements MenuImportGateway {
  constructor(
    private readonly db: SupabaseClient,
    private readonly logoFile: string | null,
  ) {}

  async countProducts(): Promise<number> {
    const { count, error } = await this.db.from("products").select("id", { count: "exact", head: true });
    if (error) throw new Error(`No se pudo contar productos: ${error.message}`);
    return count ?? 0;
  }

  async uploadLogo(): Promise<string | null> {
    if (!this.logoFile) return null;
    const file = await readFile(this.logoFile);
    const { error } = await this.db.storage
      .from(MENU_BUCKET)
      .upload(LOGO_STORAGE_PATH, file, { contentType: "image/png", upsert: true });
    if (error) throw new Error(`No se pudo subir el logo: ${error.message}`);
    return LOGO_STORAGE_PATH;
  }

  async importAll(payload: ImportPayload) {
    const { data, error } = await this.db.rpc("import_menu", { payload });
    if (error) throw new Error(error.message);
    return data as { categories: number; products: number };
  }
}
