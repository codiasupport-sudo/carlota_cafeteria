import { validateMenuImport, type ImportError, type NormalizedImport } from "../domain/menu-import";

export type ImportPayload = NormalizedImport & { logo_path: string | null };

export interface MenuImportGateway {
  countProducts(): Promise<number>;
  /** Sube el logo a Storage y devuelve su ruta (o null si no hay). */
  uploadLogo(): Promise<string | null>;
  /** Importa todo o nada (RPC transaccional). Devuelve conteos creados. */
  importAll(payload: ImportPayload): Promise<{ categories: number; products: number }>;
}

export type ImportResult =
  | { status: "imported"; categories: number; products: number }
  | { status: "invalid"; errors: ImportError[] }
  | { status: "not_empty"; products: number };

/** RF-15…RF-17. La RPC vuelve a revisar que el catálogo esté vacío dentro de la transacción. */
export async function importMenu(gateway: MenuImportGateway, json: unknown): Promise<ImportResult> {
  const validation = validateMenuImport(json);
  if (!validation.ok) return { status: "invalid", errors: validation.errors };

  const existing = await gateway.countProducts();
  if (existing > 0) return { status: "not_empty", products: existing };

  const logo_path = await gateway.uploadLogo();
  const counts = await gateway.importAll({ ...validation.data, logo_path });
  return { status: "imported", ...counts };
}
