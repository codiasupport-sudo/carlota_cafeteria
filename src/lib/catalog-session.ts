import "server-only";
import { cookies } from "next/headers";
import type { CatalogRole } from "@/modules/menu/domain/catalog-admin";
import type { Role } from "./types";

export interface CatalogActor {
  role: CatalogRole;
  name: string;
}

/** Roles actuales del POS → roles del catálogo. No se reemplaza el login existente. */
const ROLE_MAP: Record<Role, CatalogRole> = {
  admin: "admin",
  caja: "cashier",
  mesero: "waiter",
};

/**
 * Lee la sesión del POS en servidor (cookies del login actual). Devuelve null si no hay sesión válida.
 * Nota: la cookie del login provisional es sin firma; ver README (hallazgos de seguridad).
 */
export async function getCatalogActor(): Promise<CatalogActor | null> {
  const store = await cookies();
  const posRole = store.get("carlota-role")?.value;
  const user = store.get("carlota-user")?.value;
  if (!posRole || !user || !(posRole in ROLE_MAP)) return null;
  let name = user;
  try {
    name = decodeURIComponent(user);
  } catch {
    // cookie mal codificada: se usa tal cual
  }
  return { role: ROLE_MAP[posRole as Role], name: name.slice(0, 80) };
}
