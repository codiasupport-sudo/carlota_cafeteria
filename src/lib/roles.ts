import type { Role } from "./types";

/**
 * Códigos de acceso demostrativos por rol (entorno provisional sin base de datos).
 * IMPORTANTE: No utilizar como mecanismo de autenticación en producción.
 */
export const ROLE_PINS: Record<Role, string> = {
  admin: "1234",
  caja: "2345",
  mesero: "3456",
};

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
  description?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "Panel", icon: "◧", roles: ["admin", "caja"], description: "Resumen operativo" },
  { href: "/app/pedidos", label: "Pedidos", icon: "≡", roles: ["admin", "caja", "mesero"], description: "Comandas y salón" },
  { href: "/app/caja", label: "Caja", icon: "$", roles: ["admin", "caja"], description: "Cobros y tickets" },
  { href: "/app/delivery", label: "Delivery", icon: "↗", roles: ["admin", "caja"], description: "Rappi y DiDi" },
  { href: "/app/menu", label: "Menú", icon: "❏", roles: ["admin", "caja", "mesero"], description: "Consulta de platillos" },
  { href: "/app/inventario", label: "Inventario", icon: "▦", roles: ["admin"], description: "Insumos y stock" },
  { href: "/app/reportes", label: "Reportes", icon: "◫", roles: ["admin"], description: "Cierre y métricas" },
];

/**
 * Valida si un rol tiene permiso para acceder a una ruta determinada.
 * Funciona como guardia tanto en cliente como en servidor.
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  // Cocina está desactivada para todas las rutas
  if (pathname.startsWith("/app/cocina")) return false;

  if (pathname === "/app" || pathname === "/app/") {
    return role === "admin" || role === "caja";
  }

  if (pathname.startsWith("/app/pedidos")) {
    return true; // admin, caja, mesero
  }

  if (pathname.startsWith("/app/caja") || pathname.startsWith("/app/delivery")) {
    return role === "admin" || role === "caja";
  }

  if (pathname.startsWith("/app/menu")) {
    return true; // admin, caja, mesero
  }

  if (pathname.startsWith("/app/inventario") || pathname.startsWith("/app/reportes")) {
    return role === "admin";
  }

  return true;
}

/** Permisos sobre el catálogo de menú */
export function canManageMenuCatalog(role: Role): boolean {
  return role === "admin";
}

/** Permiso para cambiar disponibilidad de platillo (agotado / disponible) */
export function canToggleItemAvailability(role: Role): boolean {
  return role === "admin" || role === "caja";
}

