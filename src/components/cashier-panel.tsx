"use client";

import { useState } from "react";
import { ORDERS } from "@/lib/mock-data";
import {
  formatMoney,
  orderTotal,
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  type Order,
  type PaymentMethod,
} from "@/lib/types";
import { OrderStatusBadge, PageHeader, StatCard } from "@/components/ui";

const METHODS: PaymentMethod[] = ["efectivo", "tarjeta", "transferencia"];

export function CashierPanel() {
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [showTicket, setShowTicket] = useState(false);

  const porCobrar = orders.filter((o) => o.status === "listo");
  const cobrados = orders.filter((o) => o.status === "pagado");
  const totalCorte = cobrados.reduce((sum, o) => sum + orderTotal(o), 0);
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  function charge() {
    if (!selected) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selected.id
          ? { ...o, status: "pagado", paymentMethod: method }
          : o
      )
    );
    setShowTicket(true);
  }

  return (
    <>
      <PageHeader
        title="Caja"
        subtitle="Cobros directos: efectivo, tarjeta y transferencia"
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Por cobrar" value={String(porCobrar.length)} />
        <StatCard label="Cobrados hoy" value={String(cobrados.length)} />
        <StatCard label="Corte parcial" value={formatMoney(totalCorte)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-ink/10 bg-paper">
          <header className="border-b border-ink/10 px-5 py-4">
            <h2 className="font-display text-lg font-semibold">
              Pedidos por cobrar
            </h2>
          </header>
          <ul className="divide-y divide-ink/5">
            {porCobrar.map((order) => (
              <li key={order.id}>
                <button
                  onClick={() => {
                    setSelectedId(order.id);
                    setShowTicket(false);
                  }}
                  className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
                    selectedId === order.id ? "bg-wine/5" : "hover:bg-cream"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">{order.id}</p>
                    <p className="text-xs text-mute">
                      {ORDER_TYPE_LABELS[order.type]}
                      {order.table ? ` · ${order.table}` : ""} ·{" "}
                      {order.items.length} ítems
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatMoney(orderTotal(order))}
                  </span>
                </button>
              </li>
            ))}
            {porCobrar.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-mute">
                No hay pedidos por cobrar.
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-ink/10 bg-paper p-5">
          {!selected ? (
            <p className="py-16 text-center text-sm text-mute">
              Selecciona un pedido para cobrar.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  {selected.id}
                </h2>
                <OrderStatusBadge status={selected.status} />
              </div>
              <ul className="mt-4 space-y-1.5 border-t border-ink/10 pt-3 text-sm">
                {selected.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {item.qty}× {item.name}
                    </span>
                    <span>{formatMoney(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 border-t border-ink/10 pt-3 text-right font-display text-2xl font-semibold">
                {formatMoney(orderTotal(selected))}
              </p>

              {selected.status !== "pagado" ? (
                <>
                  <span className="mt-4 mb-2 block text-xs font-medium uppercase tracking-wider text-mute">
                    Método de pago
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {METHODS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors ${
                          method === m
                            ? "border-wine bg-wine text-cream"
                            : "border-ink/15 hover:border-wine/40"
                        }`}
                      >
                        {PAYMENT_LABELS[m]}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={charge}
                    className="mt-4 w-full rounded-lg bg-wine py-3 font-medium text-cream transition-colors hover:bg-wine-light"
                  >
                    Cobrar {formatMoney(orderTotal(selected))}
                  </button>
                </>
              ) : (
                <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Cobrado con {PAYMENT_LABELS[selected.paymentMethod!]}.
                </p>
              )}

              {showTicket && <Ticket order={selected} />}
            </>
          )}
        </section>
      </div>
    </>
  );
}

function Ticket({ order }: { order: Order }) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {(["ORIGINAL — CLIENTE", "COPIA — CAJA"] as const).map((label) => (
        <div
          key={label}
          className="rounded-lg border border-dashed border-ink/25 bg-cream p-4 font-mono text-xs"
        >
          <p className="text-center font-semibold">LA CARLOTA</p>
          <p className="text-center">Ticket de venta · {label}</p>
          <p className="mt-2 border-t border-dashed border-ink/20 pt-2">
            {order.id} · {order.createdAt}
          </p>
          {order.items.map((item, i) => (
            <p key={i} className="flex justify-between">
              <span>
                {item.qty}× {item.name}
              </span>
              <span>{formatMoney(item.price * item.qty)}</span>
            </p>
          ))}
          <p className="mt-2 flex justify-between border-t border-dashed border-ink/20 pt-2 font-semibold">
            <span>TOTAL</span>
            <span>{formatMoney(orderTotal(order))}</span>
          </p>
          <p className="mt-1">
            Pago: {PAYMENT_LABELS[order.paymentMethod ?? "efectivo"]}
          </p>
        </div>
      ))}
    </div>
  );
}
