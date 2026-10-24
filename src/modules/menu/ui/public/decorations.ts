import { normalizeText } from "../../domain/catalog";

// Ilustraciones del menú impreso (sacadas del PDF original, ver datos/referencia-diseno).
// Se ligan por nombre de categoría; si el dueño renombra una categoría, solo se pierde el adorno.

export interface Decoration {
  src: string;
  /** Ancho en px a 375 px de pantalla. */
  width: number;
  /** Rotación en grados, como en el impreso. */
  rotate: number;
}

const DECORATIONS: Record<string, Decoration> = {
  frappes: { src: "/brand/ilustraciones/frappe.png", width: 92, rotate: 6 },
  panaderia: { src: "/brand/ilustraciones/rol-canela.png", width: 112, rotate: -8 },
  postres: { src: "/brand/ilustraciones/croissant.png", width: 124, rotate: -6 },
  alimentos: { src: "/brand/ilustraciones/chilaquiles.png", width: 116, rotate: 4 },
};

export function decorationFor(categoryName: string): Decoration | null {
  return DECORATIONS[normalizeText(categoryName)] ?? null;
}

// Agrupación para el índice de categorías (15 categorías son muchas para una sola fila).
const GROUPS: { title: string; names: string[] }[] = [
  {
    title: "Bebidas",
    names: [
      "Los más fríos",
      "Bebidas calientes",
      "Bebidas de la casa",
      "Frappés",
      "Smoothies con agua",
      "Smoothies con leche",
      "Chamoyadas",
      "Nuestros refresher",
      "Malteadas",
    ],
  },
  { title: "Para comer", names: ["Alimentos", "Chapatas"] },
  { title: "Pan y postres", names: ["Panadería", "Postres"] },
  { title: "Más", names: ["Refrescos y agua", "Extras"] },
];

export function groupCategories<T extends { name: string }>(categories: T[]): { title: string; items: T[] }[] {
  const placed = new Set<T>();
  const groups = GROUPS.map((g) => {
    const wanted = g.names.map(normalizeText);
    const items = categories.filter((c) => wanted.includes(normalizeText(c.name)));
    items.forEach((c) => placed.add(c));
    return { title: g.title, items };
  });
  // Categorías nuevas que cree el dueño: van a "Más" para que nunca queden fuera del índice.
  const rest = categories.filter((c) => !placed.has(c));
  const more = groups.find((g) => g.title === "Más")!;
  more.items.push(...rest);
  return groups.filter((g) => g.items.length > 0);
}
