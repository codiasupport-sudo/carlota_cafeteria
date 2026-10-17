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

  const porCobrar = orders.filter((o) => o.status !== "pagado");
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

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink/10 bg-paper shadow-xs overflow-hidden">
          <header className="border-b border-ink/10 px-5 py-4 bg-cream/30">
            <h2 className="font-display text-lg font-semibold">
              Pedidos pendientes de cobro ({porCobrar.length})
            </h2>
            <p className="text-xs text-mute">Pedidos activos en salón y mostrador sin liquidar</p>
          </header>
          <ul className="divide-y divide-ink/5 max-h-[600px] overflow-y-auto">
            {porCobrar.map((order) => (
              <li key={order.id}>
                <button
                  onClick={() => {
                    setSelectedId(order.id);
                    setShowTicket(false);
                  }}
                  className={`flex min-h-[56px] w-full items-center justify-between px-5 py-4 text-left transition-colors active:bg-cream/40 ${
                    selectedId === order.id ? "bg-wine/10 border-l-4 border-wine" : "hover:bg-cream/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{order.id}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-mute mt-0.5">
                      {ORDER_TYPE_LABELS[order.type]}
                      {order.table ? ` · ${order.table}` : ""} ·{" "}
                      {order.items.length} ítems · {order.waiter}
                    </p>
                  </div>
                  <span className="font-semibold text-ink">
                    {formatMoney(orderTotal(order))}
                  </span>
                </button>
              </li>
            ))}
            {porCobrar.length === 0 && (
              <li className="px-5 py-12 text-center text-sm text-mute">
                No hay pedidos pendientes de cobro en este momento.
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-paper p-5 sm:p-6 shadow-xs">
          {!selected ? (
            <div className="py-20 text-center text-sm text-mute">
              Selecciona un pedido de la lista para procesar el cobro.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-semibold text-ink">
                    {selected.id}
                  </h2>
                  <p className="text-xs text-mute mt-0.5">
                    {ORDER_TYPE_LABELS[selected.type]}
                    {selected.table ? ` · ${selected.table}` : ""} · Mesero: {selected.waiter}
                  </p>
                </div>
                <OrderStatusBadge status={selected.status} />
              </div>

              <ul className="mt-4 space-y-2 border-t border-ink/10 pt-3 text-sm">
                {selected.items.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <div>
                      <span>{item.qty}× {item.name}</span>
                      {item.notes && (
                        <p className="text-xs text-mute italic">Obs: {item.notes}</p>
                      )}
                    </div>
                    <span className="font-mono text-xs">{formatMoney(item.price * item.qty)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-ink/10 pt-3 flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-wider text-mute font-medium">Total a pagar</span>
                <span className="font-display text-2xl font-bold text-ink">
                  {formatMoney(orderTotal(selected))}
                </span>
              </div>

              {selected.status !== "pagado" ? (
                <>
                  <span className="mt-5 mb-2 block text-xs font-semibold uppercase tracking-wider text-mute">
                    Método de pago
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {METHODS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMethod(m)}
                        className={`min-h-[48px] rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                          method === m
                            ? "border-wine bg-wine text-cream shadow-xs"
                            : "border-ink/15 bg-cream hover:border-wine/40 text-ink"
                        }`}
                      >
                        {PAYMENT_LABELS[m]}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={charge}
                    className="mt-5 min-h-[50px] w-full rounded-xl bg-wine py-3 font-semibold text-cream transition-all hover:bg-wine-light active:scale-95 shadow-xs"
                  >
                    Registrar cobro de {formatMoney(orderTotal(selected))}
                  </button>
                </>
              ) : (
                <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-900">
                  <p className="font-semibold">Cobro registrado exitosamente</p>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Método: <strong>{PAYMENT_LABELS[selected.paymentMethod!]}</strong>. Comprobantes disponibles a continuación.
                  </p>
                </div>
              )}

              <div className="mt-6 border-t border-ink/10 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-mute">
                    Comprobantes asociados al pedido
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTicket((v) => !v)}
                    className="text-xs font-semibold text-wine hover:underline"
                  >
                    {showTicket ? "Ocultar comprobantes" : "Ver comprobantes (3)"}
                  </button>
                </div>
                {showTicket && <Vouchers order={selected} />}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

/**
 * Comprobantes aprobados de Cafetería Carlota:
 * 1. ORIGINAL: CAFETERÍA (Control administrativo y de caja)
 * 2. COPIA: CLIENTE (Comprobante de venta entregado al comensal)
 * 3. COMANDA: PREPARACIÓN (Barra / Cocina: productos, cantidades y observaciones SIN PRECIOS)
 */
function Vouchers({ order }: { order: Order }) {
  const [selectedDoc, setSelectedDoc] = useState<"todos" | "original" | "copia" | "comanda">("todos");

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5 border-b border-ink/10 pb-2">
        {(
          [
            { id: "todos", label: "Ver los 3" },
            { id: "original", label: "Original (Cafetería)" },
            { id: "copia", label: "Copia (Cliente)" },
            { id: "comanda", label: "Comanda (Preparación)" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedDoc(t.id)}
            className={`min-h-[32px] rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              selectedDoc === t.id
                ? "bg-wine text-cream"
                : "bg-cream text-mute hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* 1. ORIGINAL: CAFETERÍA */}
        {(selectedDoc === "todos" || selectedDoc === "original") && (
          <div className="rounded-xl border border-dashed border-ink/25 bg-cream/70 p-4 font-mono text-xs shadow-xs">
            <div className="text-center border-b border-dashed border-ink/20 pb-2">
              <p className="font-bold text-sm tracking-wide">LA CARLOTA</p>
              <p className="font-semibold text-[11px] text-wine">ORIGINAL: CAFETERÍA</p>
              <p className="text-[10px] text-mute">Control interno de venta</p>
            </div>
            <div className="mt-2 text-[11px] space-y-0.5">
              <p className="flex justify-between">
                <span>Pedido: <strong>{order.id}</strong></span>
                <span>Hora: {order.createdAt}</span>
              </p>
              <p>Destino: {ORDER_TYPE_LABELS[order.type]} {order.table ? `· ${order.table}` : ""}</p>
              <p>Atiende: {order.waiter}</p>
            </div>
            <div className="mt-2.5 border-t border-dashed border-ink/20 pt-2 space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start text-[11px]">
                  <span>{item.qty}× {item.name}</span>
                  <span className="font-semibold">{formatMoney(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-dashed border-ink/20 pt-2 text-[11px]">
              <p className="flex justify-between font-bold text-xs">
                <span>TOTAL</span>
                <span>{formatMoney(orderTotal(order))}</span>
              </p>
              <p className="mt-1 text-[10px] text-mute">
                Forma de pago: {order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] : "Por liquidar"}
              </p>
            </div>
          </div>
        )}

        {/* 2. COPIA: CLIENTE */}
        {(selectedDoc === "todos" || selectedDoc === "copia") && (
          <div className="rounded-xl border border-dashed border-ink/25 bg-cream/70 p-4 font-mono text-xs shadow-xs">
            <div className="text-center border-b border-dashed border-ink/20 pb-2">
              <p className="font-bold text-sm tracking-wide">LA CARLOTA</p>
              <p className="font-semibold text-[11px] text-zinc-700">COPIA: CLIENTE</p>
              <p className="text-[10px] text-mute">Comprobante de compra</p>
            </div>
            <div className="mt-2 text-[11px] space-y-0.5">
              <p className="flex justify-between">
                <span>Pedido: <strong>{order.id}</strong></span>
                <span>Hora: {order.createdAt}</span>
              </p>
              <p>{ORDER_TYPE_LABELS[order.type]} {order.table ? `· ${order.table}` : ""}</p>
              <p>Mesero: {order.waiter}</p>
            </div>
            <div className="mt-2.5 border-t border-dashed border-ink/20 pt-2 space-y-1">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start text-[11px]">
                  <span>{item.qty}× {item.name}</span>
                  <span>{formatMoney(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-dashed border-ink/20 pt-2 text-[11px]">
              <p className="flex justify-between font-bold text-xs">
                <span>TOTAL</span>
                <span>{formatMoney(orderTotal(order))}</span>
              </p>
              <p className="mt-1 text-[10px] text-mute">
                Pago: {order.paymentMethod ? PAYMENT_LABELS[order.paymentMethod] : "Pendiente"}
              </p>
              <p className="mt-2 text-center text-[10px] text-mute/80 italic">
                ¡Gracias por su visita!
              </p>
            </div>
          </div>
        )}

        {/* 3. COMANDA: PREPARACIÓN (SIN PRECIOS) */}
        {(selectedDoc === "todos" || selectedDoc === "comanda") && (
          <div className="rounded-xl border-2 border-dashed border-ink/40 bg-sand/30 p-4 font-mono text-xs shadow-xs sm:col-span-2">
            <div className="text-center border-b border-dashed border-ink/20 pb-2">
              <p className="font-bold text-sm tracking-wider">COMANDA: PREPARACIÓN</p>
              <p className="text-[11px] font-semibold text-wine">Barra & Cocina · Sin precios</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-ink/20 pb-2">
              <div>
                <p>Pedido: <strong className="text-sm">{order.id}</strong></p>
                <p>Ubicación: <strong>{order.table ?? ORDER_TYPE_LABELS[order.type]}</strong></p>
              </div>
              <div className="text-right">
                <p>Hora: <strong>{order.createdAt}</strong></p>
                <p>Mesero: <strong>{order.waiter}</strong></p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-mute font-bold">
                Ítems para elaborar:
              </p>
              {order.items.map((item, i) => (
                <div key={i} className="bg-cream/90 rounded-lg p-2 border border-ink/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-wine text-cream text-[11px]">
                      {item.qty}
                    </span>
                    <span>{item.name}</span>
                  </div>
                  {item.notes ? (
                    <p className="mt-1 ml-7 text-[11px] text-wine font-medium">
                      Obs: {item.notes}
                    </p>
                  ) : (
                    <p className="mt-0.5 ml-7 text-[10px] text-mute/70">
                      Sin observaciones
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-dashed border-ink/20 pt-2 text-center text-[10px] text-mute font-sans">
              Comanda interna para preparación física (no fiscal)
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
