"use client";

import { useState } from "react";
import { ORDERS } from "@/lib/mock-data";
import {
  ORDER_TYPE_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/types";
import { PageHeader } from "@/components/ui";

const COLUMNS: { status: OrderStatus; title: string; action: string; next: OrderStatus }[] = [
  { status: "pendiente", title: "Pendiente", action: "Tomar pedido", next: "preparando" },
  { status: "preparando", title: "En preparación", action: "Marcar listo", next: "listo" },
  { status: "listo", title: "Listo para entregar", action: "Entregado", next: "entregado" },
];

export function KitchenBoard() {
  const [orders, setOrders] = useState<Order[]>(
    ORDERS.filter((o) => o.status !== "pagado")
  );

  function move(id: string, next: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: next } : o))
    );
  }

  return (
    <>
      <PageHeader
        title="Cocina"
        subtitle="Pedidos en tiempo real — qué falta por preparar"
        />
      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => o.status === col.status);
          return (
            <section
              key={col.status}
              className="rounded-xl border border-ink/10 bg-paper"
            >
              <header className="flex items-center justify-between border-b border-ink/10 px-4 py-3">
                <h2 className="font-display font-semibold">{col.title}</h2>
                <span className="rounded-full bg-wine/10 px-2.5 py-0.5 text-xs font-semibold text-wine">
                  {columnOrders.length}
                </span>
              </header>
              <div className="space-y-3 p-3">
                {columnOrders.map((order) => (
                  <article
                    key={order.id}
                    className="rounded-lg border border-ink/10 bg-cream p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{order.id}</p>
                      <p className="text-xs text-mute">{order.createdAt}</p>
                    </div>
                    <p className="mt-0.5 text-xs text-mute">
                      {ORDER_TYPE_LABELS[order.type]}
                      {order.table ? ` · ${order.table}` : ""}
                      {order.customer ? ` · ${order.customer}` : ""}
                    </p>
                    <ul className="mt-3 space-y-1 text-sm">
                      {order.items.map((item, i) => (
                        <li key={i}>
                          {item.qty}× {item.name}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => move(order.id, col.next)}
                      className="mt-4 w-full rounded-lg bg-wine py-2 text-sm font-medium text-cream transition-colors hover:bg-wine-light"
                    >
                      {col.action}
                    </button>
                  </article>
                ))}
                {columnOrders.length === 0 && (
                  <p className="py-8 text-center text-sm text-mute">
                    Sin pedidos
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
