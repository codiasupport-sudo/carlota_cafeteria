"use client";

import { useState } from "react";
import { MENU_ITEMS, ORDERS } from "@/lib/mock-data";
import {
  formatMoney,
  orderTotal,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  type Order,
  type OrderStatus,
  type OrderType,
} from "@/lib/types";
import { OrderStatusBadge, PageHeader } from "@/components/ui";

const FILTERS: (OrderStatus | "todos")[] = [
  "todos",
  "pendiente",
  "preparando",
  "listo",
  "entregado",
  "pagado",
];

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pendiente: "preparando",
  preparando: "listo",
  listo: "entregado",
};

export function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [showNew, setShowNew] = useState(false);

  const visible =
    filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  function advance(id: string) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id && NEXT_STATUS[o.status]
          ? { ...o, status: NEXT_STATUS[o.status]! }
          : o
      )
    );
  }

  return (
    <>
      <PageHeader title="Pedidos" subtitle="Seguimiento de pedidos del salón, para llevar y delivery">
        <button
          onClick={() => setShowNew(true)}
          className="rounded-lg bg-wine px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-wine-light"
        >
          + Nuevo pedido
        </button>
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-wine text-cream"
                : "bg-paper text-mute hover:bg-sand"
            }`}
          >
            {f === "todos" ? "Todos" : ORDER_STATUS_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((order) => (
          <article
            key={order.id}
            className="rounded-xl border border-ink/10 bg-paper p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{order.id}</p>
                <p className="text-xs text-mute">
                  {ORDER_TYPE_LABELS[order.type]}
                  {order.table ? ` · ${order.table}` : ""}
                  {order.customer ? ` · ${order.customer}` : ""} ·{" "}
                  {order.createdAt} · {order.waiter}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <ul className="mt-4 space-y-1.5 border-t border-ink/10 pt-3 text-sm">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>
                    {item.qty}× {item.name}
                  </span>
                  <span className="text-mute">
                    {formatMoney(item.price * item.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-ink/10 pt-3">
              <span className="font-semibold">
                {formatMoney(orderTotal(order))}
              </span>
              {NEXT_STATUS[order.status] && (
                <button
                  onClick={() => advance(order.id)}
                  className="rounded-lg bg-wine/10 px-3 py-1.5 text-xs font-medium text-wine transition-colors hover:bg-wine hover:text-cream"
                >
                  → {ORDER_STATUS_LABELS[NEXT_STATUS[order.status]!]}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink/20 p-10 text-center text-sm text-mute">
          No hay pedidos con este estado.
        </p>
      )}

      {showNew && (
        <NewOrderModal
          onClose={() => setShowNew(false)}
          onCreate={(order) => {
            setOrders((prev) => [order, ...prev]);
            setShowNew(false);
          }}
        />
      )}
    </>
  );
}

function NewOrderModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (order: Order) => void;
}) {
  const [type, setType] = useState<OrderType>("mesa");
  const [table, setTable] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const available = MENU_ITEMS.filter((m) => m.available);

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  function submit() {
    const items = Object.entries(selected).map(([id, qty]) => {
      const m = MENU_ITEMS.find((x) => x.id === id)!;
      return { name: m.name, qty, price: m.price };
    });
    if (items.length === 0) return;
    onCreate({
      id: `P-${1048 + Math.floor(Math.random() * 100)}`,
      type,
      table: type === "mesa" ? table || "Sin mesa" : undefined,
      customer: type === "llevar" ? "Cliente mostrador" : undefined,
      items,
      status: "pendiente",
      waiter: "Tú",
      createdAt: new Date().toTimeString().slice(0, 5),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-paper p-6 shadow-2xl">
        <h2 className="font-display text-xl font-semibold">Nuevo pedido</h2>

        <div className="mt-4 flex gap-2">
          {(Object.keys(ORDER_TYPE_LABELS) as OrderType[])
            .filter((t) => t !== "delivery")
            .map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  type === t ? "bg-wine text-cream" : "bg-cream text-mute"
                }`}
              >
                {ORDER_TYPE_LABELS[t]}
              </button>
            ))}
        </div>

        {type === "mesa" && (
          <input
            value={table}
            onChange={(e) => setTable(e.target.value)}
            placeholder="Número de mesa (ej. Mesa 4)"
            className="mt-4 w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-wine"
          />
        )}

        <div className="mt-4 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-ink/10 p-2">
          {available.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-cream"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!selected[item.id]}
                  onChange={() => toggleItem(item.id)}
                  className="accent-wine"
                />
                {item.name}
                <span className="text-xs text-mute">· {item.category}</span>
              </span>
              <span className="flex items-center gap-2">
                {selected[item.id] && (
                  <input
                    type="number"
                    min={1}
                    value={selected[item.id]}
                    onChange={(e) =>
                      setSelected((prev) => ({
                        ...prev,
                        [item.id]: Math.max(1, Number(e.target.value)),
                      }))
                    }
                    className="w-14 rounded border border-ink/15 px-1.5 py-0.5 text-center text-xs"
                  />
                )}
                {formatMoney(item.price)}
              </span>
            </label>
          ))}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-mute hover:bg-cream"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={Object.keys(selected).length === 0}
            className="rounded-lg bg-wine px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-wine-light disabled:opacity-40"
          >
            Crear pedido
          </button>
        </div>
      </div>
    </div>
  );
}
