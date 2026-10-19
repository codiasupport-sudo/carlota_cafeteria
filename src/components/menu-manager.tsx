"use client";

import { useMemo, useState } from "react";
import {
  getCategories,
  getProducts,
  type CatalogCategory,
  type CatalogProduct,
} from "@/lib/catalog-adapter";
import { formatMoney, type Role } from "@/lib/types";
import { canToggleItemAvailability } from "@/lib/roles";
import { usePos } from "@/lib/pos-context";
import { PageHeader } from "@/components/ui";

export function MenuManager({ role = "admin" }: { role?: Role }) {
  const { isProductAvailable, toggleProductAvailability } = usePos();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("Todas");
  const [search, setSearch] = useState("");

  const canToggleAvailability = canToggleItemAvailability(role);
  const categories: CatalogCategory[] = useMemo(() => getCategories(), []);
  const allProducts: CatalogProduct[] = useMemo(() => getProducts(), []);

  const totalCatalogItems = allProducts.length;

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProducts.filter((p) => {
      const matchCat =
        selectedCategoryId === "Todas" || p.categoryId === selectedCategoryId;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        p.categoryName.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [allProducts, selectedCategoryId, search]);

  return (
    <>
      <PageHeader
        title="Catálogo del Menú"
        subtitle={
          role === "mesero"
            ? "Consulta oficial de platillos, presentaciones, tamaños y disponibilidad"
            : "Consulta del catálogo oficial y administración de disponibilidad (demostración)"
        }
      >
        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-wine/20 bg-wine/10 px-3 py-1.5 text-xs font-bold text-wine">
            {totalCatalogItems} productos · Versión 2026.1 (MXN)
          </span>
        </div>
      </PageHeader>

      {/* Banner de fuente de verdad del catálogo */}
      <div className="mb-5 rounded-2xl border border-wine/15 bg-paper p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <p className="font-bold text-ink">
              Fuente oficial: <code className="rounded bg-cream px-1.5 py-0.5 font-mono text-wine">data/catalogo.json</code>
            </p>
            <p className="text-mute mt-0.5">
              Los productos, tamaños y precios provienen exclusivamente del menú oficial validado.
              {canToggleAvailability
                ? " Las modificaciones de disponibilidad se conservan en la capa de estado temporal de demostración."
                : " Vista de consulta para servicio de salón."}
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center rounded-lg bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink">
              Moneda: pesos mexicanos (MXN)
            </span>
          </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por platillo, ingrediente o categoría (ej. Latte, Chapatas, Mostachón)…"
            className="w-full rounded-2xl border border-ink/15 bg-paper px-4 py-3 text-base sm:text-sm outline-none focus:border-wine shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-mute hover:text-ink"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Chips de categorías con scroll horizontal */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId("Todas")}
            className={`min-h-[40px] shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
              selectedCategoryId === "Todas"
                ? "bg-wine text-cream shadow-xs"
                : "bg-paper text-mute hover:bg-sand border border-ink/10"
            }`}
          >
            Todas ({totalCatalogItems})
          </button>
          {categories.map((c) => {
            const active = selectedCategoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategoryId(c.id)}
                className={`min-h-[40px] shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                  active
                    ? "bg-wine text-cream shadow-xs"
                    : "bg-paper text-mute hover:bg-sand border border-ink/10"
                }`}
              >
                <span>{c.name}</span>
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    active ? "bg-cream/20 text-cream" : "bg-ink/5 text-mute"
                  }`}
                >
                  {c.productCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de productos responsiva */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const available = isProductAvailable(product.id);
          const hasVariants = product.variants && product.variants.length > 0;

          return (
            <article
              key={product.id}
              className={`flex flex-col justify-between rounded-2xl border bg-paper p-4 shadow-xs transition-all ${
                !available
                  ? "border-zinc-300 opacity-60 bg-zinc-50/70"
                  : "border-ink/10 hover:border-wine/30"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-mute">
                      {product.categoryName}
                    </span>
                    <h3 className="font-display text-base font-bold text-ink">
                      {product.name}
                    </h3>
                  </div>
                  {/* Badge de disponibilidad */}
                  <div>
                    {canToggleAvailability ? (
                      <button
                        type="button"
                        onClick={() => toggleProductAvailability(product.id, role)}
                        className={`min-h-[32px] rounded-full px-3 py-1 text-[11px] font-bold transition-all active:scale-95 ${
                          available
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                        }`}
                        title="Toca para cambiar disponibilidad (demostración)"
                      >
                        {available ? "✓ Disponible" : "✕ Agotado"}
                      </button>
                    ) : (
                      <span
                        className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          available
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-zinc-200 text-zinc-600"
                        }`}
                      >
                        {available ? "Disponible" : "Agotado"}
                      </span>
                    )}
                  </div>
                </div>

                {product.description && (
                  <p className="mt-1 text-xs text-mute line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Presentaciones y Precios en MXN */}
              <div className="mt-3.5 border-t border-ink/10 pt-2.5">
                {hasVariants ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-mute">
                      Presentaciones:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {product.variants!.map((v, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 rounded-lg bg-cream px-2.5 py-1 text-xs border border-ink/10"
                        >
                          <span className="font-medium text-ink">
                            {v.size}
                            {v.volumeMl ? ` (${v.volumeMl} ml)` : ""}:
                          </span>
                          <span className="font-bold text-wine">
                            {formatMoney(v.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-mute">Precio:</span>
                    <span className="font-display text-lg font-bold text-wine">
                      {formatMoney(product.price ?? 0)}
                    </span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink/20 p-12 text-center text-sm text-mute bg-paper/40">
          <p className="font-semibold text-base text-ink mb-1">
            No se encontraron platillos
          </p>
          <p className="text-xs">
            Intenta con otro término de búsqueda o selecciona otra categoría.
          </p>
        </div>
      )}
    </>
  );
}
