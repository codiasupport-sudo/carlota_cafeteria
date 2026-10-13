"use client";

import { useState } from "react";
import { MENU_ITEMS } from "@/lib/mock-data";
import { formatMoney, type MenuItem } from "@/lib/types";
import { PageHeader } from "@/components/ui";

export function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [category, setCategory] = useState<string>("Todas");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [search, setSearch] = useState("");

  const categories = [
    "Todas",
    ...Array.from(new Set(items.map((i) => i.category))),
  ];
  const q = search.trim().toLowerCase();
  const visible = items.filter(
    (i) =>
      (category === "Todas" || i.category === category) &&
      (!q || i.name.toLowerCase().includes(q))
  );

  function toggleAvailable(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, available: !i.available } : i))
    );
  }

  return (
    <>
      <PageHeader
        title="Menú"
        subtitle="Categorías, platillos y costo de elaboración"
      >
        <button
          onClick={() => setShowNewCategory((v) => !v)}
          className="rounded-lg bg-wine px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-wine-light"
        >
          + Nueva categoría
        </button>
      </PageHeader>

      {showNewCategory && (
        <div className="mb-5 flex gap-2 rounded-xl border border-wine/20 bg-paper p-4">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nombre de la categoría (ej. Postres)"
            className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-wine"
          />
          <button
            onClick={() => {
              if (newCategory.trim()) {
                setCategory(newCategory.trim());
                setNewCategory("");
                setShowNewCategory(false);
              }
            }}
            className="shrink-0 rounded-lg bg-wine px-4 py-2.5 text-sm font-medium text-cream hover:bg-wine-light"
          >
            Registrar
          </button>
        </div>
      )}

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar platillo…"
          className="w-full max-w-sm rounded-lg border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-wine"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === c
                ? "bg-wine text-cream"
                : "bg-paper text-mute hover:bg-sand"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-mute">
              <th className="px-5 py-3 font-medium">Platillo</th>
              <th className="px-5 py-3 font-medium">Categoría</th>
              <th className="px-5 py-3 text-right font-medium">Precio</th>
              <th className="px-5 py-3 text-right font-medium">Costo elab.</th>
              <th className="px-5 py-3 text-right font-medium">Margen</th>
              <th className="px-5 py-3 text-center font-medium">Disponible</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => (
              <tr
                key={item.id}
                className={`border-b border-ink/5 last:border-0 ${!item.available ? "opacity-50" : ""}`}
              >
                <td className="px-5 py-3 font-medium">{item.name}</td>
                <td className="px-5 py-3 text-mute">{item.category}</td>
                <td className="px-5 py-3 text-right">
                  {formatMoney(item.price)}
                </td>
                <td className="px-5 py-3 text-right text-mute">
                  {formatMoney(item.cost)}
                </td>
                <td className="px-5 py-3 text-right font-medium text-emerald-700">
                  {formatMoney(item.price - item.cost)}
                </td>
                <td className="px-5 py-3 text-center">
                  <button
                    onClick={() => toggleAvailable(item.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      item.available
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-zinc-200 text-zinc-600"
                    }`}
                  >
                    {item.available ? "Sí" : "Agotado"}
                  </button>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-10 text-center text-sm text-mute"
                >
                  Sin resultados — categoría nueva o búsqueda sin coincidencias.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
