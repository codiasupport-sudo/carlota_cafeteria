"use client";

import { useState } from "react";
import { MENU_ITEMS } from "@/lib/mock-data";
import { formatMoney, type MenuItem, type Role } from "@/lib/types";
import { canManageMenuCatalog, canToggleItemAvailability } from "@/lib/roles";
import { PageHeader } from "@/components/ui";

export function MenuManager({ role = "admin" }: { role?: Role }) {
  const [items, setItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [category, setCategory] = useState<string>("Todas");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [search, setSearch] = useState("");

  const isManager = canManageMenuCatalog(role);
  const canToggleAvailability = canToggleItemAvailability(role);

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
    if (!canToggleAvailability) return;
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, available: !i.available } : i))
    );
  }

  return (
    <>
      <PageHeader
        title="Menú"
        subtitle={
          isManager
            ? "Catálogo de platillos, precios y costos de elaboración"
            : "Consulta de catálogo y disponibilidad de platillos"
        }
      >
        {isManager && (
          <button
            onClick={() => setShowNewCategory((v) => !v)}
            className="flex min-h-[44px] items-center rounded-xl bg-wine px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-wine-light active:scale-95 shadow-xs"
          >
            + Nueva categoría
          </button>
        )}
      </PageHeader>

      {isManager && showNewCategory && (
        <div className="mb-5 flex flex-col gap-2 rounded-2xl border border-wine/20 bg-paper p-4 sm:flex-row shadow-xs">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nombre de la categoría (ej. Postres)"
            className="w-full rounded-xl border border-ink/15 bg-cream px-3 py-2.5 text-base outline-none focus:border-wine sm:text-sm"
          />
          <button
            onClick={() => {
              if (newCategory.trim()) {
                setCategory(newCategory.trim());
                setNewCategory("");
                setShowNewCategory(false);
              }
            }}
            className="flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-wine px-5 py-2.5 text-sm font-semibold text-cream hover:bg-wine-light active:scale-95"
          >
            Registrar
          </button>
        </div>
      )}

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar platillo por nombre…"
          className="w-full max-w-sm rounded-xl border border-ink/15 bg-paper px-3.5 py-2.5 text-base outline-none focus:border-wine shadow-xs sm:text-sm"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`min-h-[40px] rounded-full px-4 py-1.5 text-sm font-medium transition-all active:scale-95 ${
              category === c
                ? "bg-wine text-cream shadow-xs"
                : "bg-paper text-mute hover:bg-sand border border-ink/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-mute bg-cream/40">
                <th className="px-5 py-3.5 font-medium">Platillo</th>
                <th className="px-5 py-3.5 font-medium">Categoría</th>
                <th className="px-5 py-3.5 text-right font-medium">Precio</th>
                {isManager && (
                  <>
                    <th className="px-5 py-3.5 text-right font-medium">Costo elab.</th>
                    <th className="px-5 py-3.5 text-right font-medium">Margen</th>
                  </>
                )}
                <th className="px-5 py-3.5 text-center font-medium">Disponibilidad</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b border-ink/5 last:border-0 hover:bg-cream/20 ${!item.available ? "opacity-60 bg-zinc-50" : ""}`}
                >
                  <td className="px-5 py-3.5 font-semibold text-ink">{item.name}</td>
                  <td className="px-5 py-3.5 text-mute">{item.category}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ink">
                    {formatMoney(item.price)}
                  </td>
                  {isManager && (
                    <>
                      <td className="px-5 py-3.5 text-right text-mute">
                        {formatMoney(item.cost)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-700">
                        {formatMoney(item.price - item.cost)}
                      </td>
                    </>
                  )}
                  <td className="px-5 py-3.5 text-center">
                    {canToggleAvailability ? (
                      <button
                        onClick={() => toggleAvailable(item.id)}
                        className={`min-h-[36px] rounded-full px-3.5 py-1 text-xs font-semibold transition-all active:scale-95 ${
                          item.available
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                        }`}
                      >
                        {item.available ? "Disponible" : "Agotado"}
                      </button>
                    ) : (
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          item.available
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {item.available ? "Disponible" : "Agotado"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={isManager ? 6 : 4}
                    className="px-5 py-10 text-center text-sm text-mute"
                  >
                    Sin resultados — categoría vacía o búsqueda sin coincidencias.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
