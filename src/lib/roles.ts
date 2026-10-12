import type { Role } from "./types";

/** Códigos de acceso de prueba por rol (prototipo, sin base de datos) */
export const ROLE_PINS: Record<Role, string> = {
  admin: "1234",
  caja: "2345",
  mesero: "3456",
  cocina: "4567",
};

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "Panel", icon: "◧", roles: ["admin", "caja", "mesero", "cocina"] },
  { href: "/app/pedidos", label: "Pedidos", icon: "≡", roles: ["admin", "caja", "mesero"] },
  { href: "/app/cocina", label: "Cocina", icon: "◔", roles: ["admin", "cocina"] },
  { href: "/app/caja", label: "Caja", icon: "$", roles: ["admin", "caja"] },
  { href: "/app/delivery", label: "Delivery", icon: "↗", roles: ["admin", "caja"] },
  { href: "/app/menu", label: "Menú", icon: "❏", roles: ["admin", "caja", "mesero"] },
  { href: "/app/inventario", label: "Inventario", icon: "▦", roles: ["admin", "cocina"] },
  { href: "/app/reportes", label: "Reportes", icon: "◫", roles: ["admin"] },
];
