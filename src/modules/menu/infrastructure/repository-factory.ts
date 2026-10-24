import "server-only";
import menuJson from "../../../../datos/menu-inicial.json";
import type { MenuReadRepository, VisitRepository } from "../ports/menu-repository";
import { JsonMenuRepository } from "./json/json-menu-repository";
import { createAnonClient, hasSupabaseEnv } from "./supabase/client";
import { SupabaseMenuRepository } from "./supabase/menu-repository";

type Repo = MenuReadRepository & VisitRepository;

let demoRepo: JsonMenuRepository | null = null;

/** Supabase si hay variables de entorno; si no, modo demo con datos/menu-inicial.json. */
export function getMenuRepository(): Repo {
  if (hasSupabaseEnv()) return new SupabaseMenuRepository(createAnonClient());
  demoRepo ??= new JsonMenuRepository(menuJson, {
    // MENU_DEMO_UNPUBLISHED=1 permite probar la pantalla "Menú no disponible" sin base de datos.
    menuPublished: process.env.MENU_DEMO_UNPUBLISHED !== "1",
  });
  return demoRepo;
}
