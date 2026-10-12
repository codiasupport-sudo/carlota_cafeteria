"use client";

import { useState } from "react";
import { INVENTORY } from "@/lib/mock-data";
import type { InventoryItem } from "@/lib/types";
import { PageHeader, StatCard } from "@/components/ui";

export function InventoryTable() {
  const [items, setItems] = useState<InventoryItem[]>(INVENTORY);
  const low = items.filter((i) => i.stock <= i.min);

  function restock(id: string) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, stock: i.stock + i.min } : i
      )
    );
  }

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Insumos y alertas de stock mínimo"
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Insumos" value={String(items.length)} />
        <StatCard
          label="Bajo el mínimo"
          value={String(low.length)}
          hint={low.map((i) => i.name).join(", ")}
        />
        <StatCard
          label="Próximo pedido"
          value={low.length > 0 ? "Sí" : "No"}
          hint="Sugerencia según mínimos"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-mute">
              <th className="px-5 py-3 font-medium">Insumo</th>
              <th className="px-5 py-3 text-right font-medium">Stock</th>
              <th className="px-5 py-3 text-right font-medium">Mínimo</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.stock <= item.min;
              return (
                <tr
                  key={item.id}
                  className="border-b border-ink/5 last:border-0"
                >
                  <td className="px-5 py-3 font-medium">{item.name}</td>
                  <td className="px-5 py-3 text-right">
                    {item.stock} {item.unit}
                  </td>
                  <td className="px-5 py-3 text-right text-mute">
                    {item.min} {item.unit}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        isLow
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {isLow ? "Bajo" : "OK"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isLow && (
                      <button
                        onClick={() => restock(item.id)}
                        className="rounded-lg bg-wine/10 px-3 py-1.5 text-xs font-medium text-wine transition-colors hover:bg-wine hover:text-cream"
                      >
                        Registrar entrada
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
