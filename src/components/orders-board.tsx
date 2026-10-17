"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MENU_ITEMS, ORDERS } from "@/lib/mock-data";
import {
  formatMoney,
  orderTotal,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  type Order,
  type OrderItem,
  type OrderStatus,
  type OrderType,
  type Role,
} from "@/lib/types";
import { OrderStatusBadge, PageHeader } from "@/components/ui";

const FILTERS: { id: OrderStatus | "todos"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "listo", label: "Listos para entrega" },
  { id: "preparando", label: "En preparación" },
  { id: "pendiente", label: "Pendientes" },
  { id: "entregado", label: "Entregados" },
];

export function OrdersBoard({
  role = "mesero",
  user = "Mesero",
}: {
  role?: Role;
  user?: string;
}) {
  return (
    <Suspense fallback={<div className="h-40" />}>
      <OrdersBoardContent role={role} user={user} />
    </Suspense>
  );
}

function OrdersBoardContent({
  role,
  user,
}: {
  role: Role;
  user: string;
}) {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>(ORDERS);
  const [filter, setFilter] = useState<OrderStatus | "todos">("todos");
  const [showNew, setShowNew] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedComanda, setSelectedComanda] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Abrir modal de nuevo pedido si la URL incluye ?nuevo=1 (desde botón central móvil)
  useEffect(() => {
    if (searchParams.get("nuevo") === "1" || searchParams.get("nuevo") === "true") {
      setShowNew(true);
    }
  }, [searchParams]);

  // Limpiar mensaje flotante después de 3.5 segundos
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const listos = orders.filter((o) => o.status === "listo");
  const visibles =
    filter === "todos" ? orders : orders.filter((o) => o.status === filter);

  // Acción del mesero: Confirmar entrega tras recibir aviso físico de barra/cocina
  function confirmDelivery(id: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "entregado" } : o))
    );
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: "entregado" } : null));
    }
    setToastMessage(`✓ Pedido ${id} marcado como entregado en mesa.`);
  }

  // Acción administrativa exclusiva para pruebas de avance
  function advanceAdmin(id: string, nextStatus: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o))
    );
  }

  function handleCreateOrder(newOrder: Order) {
    setOrders((prev) => [newOrder, ...prev]);
    setShowNew(false);
    setToastMessage(`✓ ¡Pedido ${newOrder.id} creado con éxito! Comanda enviada a preparación.`);
  }

  return (
    <div className="space-y-4">
      {/* Toast de confirmación accesible */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-cream shadow-2xl transition-all"
        >
          {toastMessage}
        </div>
      )}

      {/* Cabecera optimizada para móvil y tablet */}
      <PageHeader
        title={role === "mesero" ? "Servicio de Salón" : "Pedidos"}
        subtitle={
          role === "mesero"
            ? `Atención en mesas · ${user}`
            : "Monitoreo general de pedidos y comandas"
        }
      >
        <button
          onClick={() => setShowNew(true)}
          className="flex min-h-[46px] items-center gap-2 rounded-xl bg-wine px-5 py-2.5 text-sm font-semibold text-cream shadow-md transition-all hover:bg-wine-light active:scale-95"
        >
          <span className="text-lg leading-none">+</span>
          <span>Nuevo pedido</span>
        </button>
      </PageHeader>

      {/* Banner de alerta cuando hay pedidos listos para entrega inmediata */}
      {listos.length > 0 && (
        <div
          onClick={() => setFilter("listo")}
          className="cursor-pointer rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 shadow-xs transition-colors hover:bg-emerald-100/80 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-cream font-bold text-sm">
                🔔
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  {listos.length} pedido{listos.length > 1 ? "s" : ""} listo{listos.length > 1 ? "s" : ""} para servir
                </p>
                <p className="text-xs text-emerald-800">
                  Aviso físico recibido de barra/cocina. Toca para verlos y confirmar entrega.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 hover:underline">
              Ver →
            </span>
          </div>
        </div>
      )}

      {/* Barra de filtros táctiles horizontales */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
        {FILTERS.map((f) => {
          const count =
            f.id === "todos"
              ? orders.length
              : orders.filter((o) => o.status === f.id).length;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                active
                  ? "bg-wine text-cream shadow-xs"
                  : "bg-paper text-mute hover:bg-sand border border-ink/10"
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  active ? "bg-cream/20 text-cream" : "bg-ink/5 text-mute"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Lista de pedidos (Mobile-First: 1 columna compacta en smartphone, grid en iPad/Desktop) */}
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
        {visibles.map((order) => {
          const summary = order.items
            .map((i) => `${i.qty}× ${i.name}`)
            .join(", ");
          const totalQty = order.items.reduce((s, i) => s + i.qty, 0);

          return (
            <article
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`cursor-pointer rounded-2xl border bg-paper p-4 shadow-xs transition-all hover:border-wine/30 active:scale-[0.99] flex flex-col justify-between ${
                order.status === "listo"
                  ? "border-emerald-300 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                  : "border-ink/10"
              }`}
            >
              <div>
                {/* Fila superior: Folio, Ubicación y Estado */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base text-ink">
                      {order.id}
                    </span>
                    <span className="rounded-lg bg-wine/10 px-2.5 py-1 text-xs font-bold text-wine">
                      {order.table ?? ORDER_TYPE_LABELS[order.type]}
                    </span>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                {/* Fila intermedia: Resumen conciso de productos */}
                <p className="mt-2 text-xs font-medium text-ink/80 line-clamp-2">
                  <span className="font-semibold text-ink">{totalQty} ítems:</span>{" "}
                  {summary}
                </p>
              </div>

              {/* Fila inferior: Metadatos y Acción contextual */}
              <div className="mt-3.5 flex items-center justify-between border-t border-ink/10 pt-2.5 gap-2">
                <span className="text-[11px] text-mute">
                  {order.createdAt} · {order.waiter}
                </span>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Botón contextual prominente para Mesero cuando el pedido está listo */}
                  {order.status === "listo" ? (
                    <button
                      onClick={() => confirmDelivery(order.id)}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-cream shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
                    >
                      <span>✓</span>
                      <span>Confirmar entrega</span>
                    </button>
                  ) : order.status === "preparando" ? (
                    <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      En preparación
                    </span>
                  ) : order.status === "pendiente" ? (
                    <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg">
                      En cola
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-md">
                      {order.status === "entregado" ? "Entregado" : "Cobrado"}
                    </span>
                  )}

                  {/* Acciones de prueba para Administrador */}
                  {role === "admin" && order.status === "pendiente" && (
                    <button
                      onClick={() => advanceAdmin(order.id, "preparando")}
                      className="min-h-[36px] rounded-lg bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-ink/10"
                    >
                      Avanzar a prep.
                    </button>
                  )}
                  {role === "admin" && order.status === "preparando" && (
                    <button
                      onClick={() => advanceAdmin(order.id, "listo")}
                      className="min-h-[36px] rounded-lg bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-ink/10"
                    >
                      Avanzar a listo
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visibles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink/20 p-12 text-center text-sm text-mute bg-paper/40">
          <p className="font-semibold text-base text-ink mb-1">No hay pedidos en este estado</p>
          <p className="text-xs">Usa el botón "+ Nuevo pedido" para registrar una orden de salón o mostrador.</p>
        </div>
      )}

      {/* MODAL 1: Flujo Mobile-First de Nuevo Pedido */}
      {showNew && (
        <NewOrderMobileFlow
          waiterName={user}
          onClose={() => setShowNew(false)}
          onCreate={handleCreateOrder}
        />
      )}

      {/* MODAL 2: Detalle completo de pedido al pulsar una tarjeta */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          role={role}
          onClose={() => setSelectedOrder(null)}
          onConfirmDelivery={confirmDelivery}
          onOpenComanda={() => setSelectedComanda(selectedOrder)}
        />
      )}

      {/* MODAL 3: Comanda física de preparación (sin precios) */}
      {selectedComanda && (
        <ComandaModal
          order={selectedComanda}
          onClose={() => setSelectedComanda(null)}
        />
      )}
    </div>
  );
}

/**
 * FLUJO DE CREACIÓN DE PEDIDOS (Mobile-First)
 * 1. Seleccionar Mesa o Para llevar (chips rápidos de un toque).
 * 2. Categorías y catálogo de productos con selector de cantidad.
 * 3. Incorporación de observaciones/notas por producto.
 * 4. Barra de resumen y confirmación sin pedir datos personales obligatorios.
 */
function NewOrderMobileFlow({
  waiterName,
  onClose,
  onCreate,
}: {
  waiterName: string;
  onClose: () => void;
  onCreate: (order: Order) => void;
}) {
  const [type, setType] = useState<OrderType>("mesa");
  const [table, setTable] = useState("Mesa 1");
  const [customTable, setCustomTable] = useState("");
  const [category, setCategory] = useState("Todas");
  const [search, setSearch] = useState("");
  // Ítems seleccionados: id -> { qty, notes }
  const [cart, setCart] = useState<Record<string, { qty: number; notes: string }>>({});
  const [reviewing, setReviewing] = useState(false);
  const [editingItemNotes, setEditingItemNotes] = useState<string | null>(null);

  const available = MENU_ITEMS.filter((m) => m.available);
  const categories = ["Todas", ...Array.from(new Set(available.map((i) => i.category)))];

  const filteredItems = available.filter((item) => {
    const matchCat = category === "Todas" || item.category === category;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalItems = Object.values(cart).reduce((s, i) => s + i.qty, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, data]) => {
    const item = MENU_ITEMS.find((m) => m.id === id);
    return sum + (item ? item.price * data.qty : 0);
  }, 0);

  function addItem(id: string) {
    setCart((prev) => ({
      ...prev,
      [id]: {
        qty: (prev[id]?.qty ?? 0) + 1,
        notes: prev[id]?.notes ?? "",
      },
    }));
  }

  function removeItem(id: string) {
    setCart((prev) => {
      const current = prev[id];
      if (!current) return prev;
      if (current.qty <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return {
        ...prev,
        [id]: { ...current, qty: current.qty - 1 },
      };
    });
  }

  function updateNotes(id: string, notes: string) {
    setCart((prev) => {
      if (!prev[id]) return prev;
      return {
        ...prev,
        [id]: { ...prev[id], notes },
      };
    });
  }

  function submitOrder() {
    const items: OrderItem[] = Object.entries(cart).map(([id, data]) => {
      const m = MENU_ITEMS.find((x) => x.id === id)!;
      return {
        name: m.name,
        qty: data.qty,
        price: m.price,
        notes: data.notes.trim() || undefined,
      };
    });

    if (items.length === 0) return;

    const assignedTable =
      type === "mesa" ? (customTable.trim() ? customTable.trim() : table) : undefined;

    onCreate({
      id: `P-${1048 + Math.floor(Math.random() * 899)}`,
      type,
      table: assignedTable,
      customer: type === "llevar" ? "Cliente mostrador" : undefined,
      items,
      status: "pendiente",
      waiter: waiterName,
      createdAt: new Date().toTimeString().slice(0, 5),
    });
  }

  const QUICK_TABLES = ["Mesa 1", "Mesa 2", "Mesa 3", "Mesa 4", "Mesa 5", "Mesa 6", "Barra 1", "Barra 2"];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper pb-[max(1rem,env(safe-area-inset-bottom))] overflow-hidden">
      {/* Barra superior de creación */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink/10 bg-wine px-4 text-cream">
        <h2 className="font-display text-base font-bold">
          {reviewing ? "Revisar comanda" : "Nuevo pedido"}
        </h2>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-cream/80 hover:bg-cream/10 active:bg-cream/20 font-bold"
          aria-label="Cerrar creador de pedido"
        >
          ✕
        </button>
      </header>

      {/* Contenido principal con scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!reviewing ? (
          <>
            {/* 1. Selector de Ubicación / Destino */}
            <div className="rounded-2xl border border-ink/10 bg-cream/40 p-3.5 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-mute">
                1. Destino del pedido
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("mesa")}
                  className={`min-h-[46px] rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    type === "mesa"
                      ? "bg-wine text-cream shadow-xs"
                      : "bg-paper text-ink border border-ink/10 hover:border-wine/30"
                  }`}
                >
                  🍽️ En Mesa
                </button>
                <button
                  type="button"
                  onClick={() => setType("llevar")}
                  className={`min-h-[46px] rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    type === "llevar"
                      ? "bg-wine text-cream shadow-xs"
                      : "bg-paper text-ink border border-ink/10 hover:border-wine/30"
                  }`}
                >
                  🥡 Para llevar
                </button>
              </div>

              {type === "mesa" && (
                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-mute mb-1.5">
                    Selecciona mesa:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TABLES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTable(t);
                          setCustomTable("");
                        }}
                        className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                          table === t && !customTable
                            ? "bg-wine text-cream"
                            : "bg-paper text-ink border border-ink/15"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  <input
                    value={customTable}
                    onChange={(e) => setCustomTable(e.target.value)}
                    placeholder="Otra mesa (ej. Terraza 2)…"
                    className="mt-2 min-h-[42px] w-full rounded-xl border border-ink/15 bg-paper px-3 text-base sm:text-xs outline-none focus:border-wine"
                  />
                </div>
              )}
            </div>

            {/* 2. Categorías y búsqueda */}
            <div>
              <div className="mb-2.5">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar platillo (ej. flat white, croissant)…"
                  className="min-h-[44px] w-full rounded-xl border border-ink/15 bg-paper px-3.5 text-base sm:text-xs outline-none focus:border-wine shadow-xs"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`min-h-[38px] shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold transition-all active:scale-95 ${
                      category === c
                        ? "bg-wine text-cream shadow-xs"
                        : "bg-paper text-mute border border-ink/10"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Catálogo de productos táctil */}
            <div className="space-y-2 pb-24">
              {filteredItems.map((item) => {
                const inCart = cart[item.id];
                const qty = inCart?.qty ?? 0;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3.5 transition-all flex items-center justify-between gap-3 ${
                      qty > 0
                        ? "border-wine bg-wine/5 shadow-xs"
                        : "border-ink/10 bg-paper"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="font-semibold text-sm text-ink truncate">{item.name}</p>
                        <span className="text-[11px] text-mute">{item.category}</span>
                      </div>
                      <p className="text-xs font-bold text-wine mt-0.5">
                        {formatMoney(item.price)}
                      </p>
                      {inCart?.notes && (
                        <p className="text-[11px] text-wine/80 italic mt-1 truncate">
                          Nota: {inCart.notes}
                        </p>
                      )}
                    </div>

                    {/* Controles táctiles de cantidad */}
                    <div className="flex items-center gap-2 shrink-0">
                      {qty > 0 ? (
                        <div className="flex items-center gap-1.5 bg-paper rounded-xl border border-wine/30 p-1">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream font-bold text-ink text-base active:scale-90"
                            aria-label={`Reducir ${item.name}`}
                          >
                            –
                          </button>
                          <span className="w-6 text-center font-bold text-sm text-ink">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => addItem(item.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-wine text-cream font-bold text-base active:scale-90"
                            aria-label={`Aumentar ${item.name}`}
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemNotes(item.id)}
                            className="flex h-9 px-2 items-center justify-center rounded-lg bg-cream text-[11px] font-semibold text-wine hover:bg-wine/10"
                            title="Añadir nota de preparación"
                          >
                            ✏️
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addItem(item.id)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-wine px-4 py-2 font-bold text-cream text-sm shadow-xs transition-transform active:scale-90"
                        >
                          + Agregar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* PASO DE REVISIÓN Y CONFIRMACIÓN */
          <div className="space-y-4 pb-24">
            <div className="rounded-2xl border border-wine/20 bg-cream/40 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-mute font-bold">Destino:</span>
                <span className="rounded-lg bg-wine text-cream px-3 py-1 font-bold text-xs">
                  {type === "mesa" ? (customTable || table) : "Para llevar"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-mute">
                <span>Atiende:</span>
                <span className="font-semibold text-ink">{waiterName}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-ink/10 bg-paper p-4">
              <h3 className="font-display text-sm font-bold text-ink mb-3">
                Resumen de comanda ({totalItems} ítems)
              </h3>
              <ul className="divide-y divide-ink/5 text-sm space-y-2">
                {Object.entries(cart).map(([id, data]) => {
                  const item = MENU_ITEMS.find((m) => m.id === id);
                  if (!item) return null;
                  return (
                    <li key={id} className="pt-2 flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-ink">
                          {data.qty}× {item.name}
                        </p>
                        {data.notes && (
                          <p className="text-xs text-wine font-medium mt-0.5">
                            Obs: {data.notes}
                          </p>
                        )}
                      </div>
                      <span className="font-mono text-xs font-semibold text-ink">
                        {formatMoney(item.price * data.qty)}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 pt-3 border-t border-ink/10 flex justify-between items-baseline">
                <span className="text-xs uppercase font-bold text-mute">Total estimado:</span>
                <span className="font-display font-bold text-xl text-ink">
                  {formatMoney(totalPrice)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-mute text-center italic">
              Al confirmar, la comanda queda registrada en cola para su preparación física.
            </p>
          </div>
        )}
      </div>

      {/* Barra fija inferior de acción (Sticky Action Bar) */}
      <footer className="border-t border-ink/10 bg-paper p-4 shadow-xl">
        {!reviewing ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-mute font-medium">
                {totalItems} {totalItems === 1 ? "ítem" : "ítems"} seleccionados
              </p>
              <p className="font-display text-lg font-bold text-ink">
                {formatMoney(totalPrice)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReviewing(true)}
              disabled={totalItems === 0}
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-wine px-6 py-3 font-bold text-cream transition-all hover:bg-wine-light active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Revisar pedido</span>
              <span>→</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setReviewing(false)}
              className="min-h-[48px] rounded-xl border border-ink/20 bg-paper font-semibold text-ink text-sm hover:bg-cream active:scale-95"
            >
              ← Modificar
            </button>
            <button
              type="button"
              onClick={submitOrder}
              className="min-h-[48px] rounded-xl bg-wine font-bold text-cream text-sm hover:bg-wine-light active:scale-95 shadow-md"
            >
              Confirmar pedido ✓
            </button>
          </div>
        )}
      </footer>

      {/* Sub-modal para añadir o editar notas a un ítem */}
      {editingItemNotes && (
        <ItemNotesSheet
          itemId={editingItemNotes}
          currentNotes={cart[editingItemNotes]?.notes ?? ""}
          onClose={() => setEditingItemNotes(null)}
          onSave={(notes) => {
            updateNotes(editingItemNotes, notes);
            setEditingItemNotes(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Hoja de notas y observaciones rápidas para un producto
 */
function ItemNotesSheet({
  itemId,
  currentNotes,
  onClose,
  onSave,
}: {
  itemId: string;
  currentNotes: string;
  onClose: () => void;
  onSave: (notes: string) => void;
}) {
  const item = MENU_ITEMS.find((m) => m.id === itemId);
  const [text, setText] = useState(currentNotes);

  const QUICK_NOTES = [
    "Sin azúcar",
    "Leche deslactosada",
    "Leche de avena",
    "Muy caliente",
    "Para después",
    "Sin cebolla",
    "Bien cocido",
  ];

  function addPreset(preset: string) {
    if (!text) {
      setText(preset);
    } else if (!text.includes(preset)) {
      setText(`${text}, ${preset}`);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-paper p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-ink/10 pb-2.5">
          <div>
            <h4 className="font-display font-bold text-base text-ink">
              Observaciones de preparación
            </h4>
            <p className="text-xs text-mute">{item?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-mute hover:bg-cream"
          >
            ✕
          </button>
        </div>

        <div>
          <p className="text-xs font-semibold text-mute mb-1.5">Sugerencias rápidas:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_NOTES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => addPreset(preset)}
                className="rounded-lg bg-cream px-2.5 py-1 text-xs font-medium text-ink hover:bg-sand active:scale-95 border border-ink/10"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe detalles especiales (ej. término medio, sin hielo)…"
            rows={3}
            className="w-full rounded-xl border border-ink/20 bg-cream p-3 text-base sm:text-xs outline-none focus:border-wine"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-xl px-4 text-xs font-semibold text-mute"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(text)}
            className="min-h-[44px] rounded-xl bg-wine px-5 font-bold text-cream text-xs shadow-xs active:scale-95"
          >
            Guardar observación
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MODAL DE DETALLE DE PEDIDO (Al pulsar una tarjeta en la lista)
 */
function OrderDetailModal({
  order,
  role,
  onClose,
  onConfirmDelivery,
  onOpenComanda,
}: {
  order: Order;
  role: Role;
  onClose: () => void;
  onConfirmDelivery: (id: string) => void;
  onOpenComanda: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-paper p-5 sm:p-6 shadow-2xl space-y-4">
        {/* Cabecera */}
        <div className="flex items-start justify-between border-b border-ink/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-xl text-ink">{order.id}</h3>
              <span className="rounded-lg bg-wine text-cream px-2.5 py-0.5 text-xs font-bold">
                {order.table ?? ORDER_TYPE_LABELS[order.type]}
              </span>
            </div>
            <p className="text-xs text-mute mt-0.5">
              Hora: {order.createdAt} · Atiende: {order.waiter}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-mute hover:bg-cream"
          >
            ✕
          </button>
        </div>

        {/* Estado actual */}
        <div className="flex items-center justify-between rounded-xl bg-cream/50 p-3">
          <span className="text-xs font-semibold text-mute">Estado del pedido:</span>
          <OrderStatusBadge status={order.status} />
        </div>

        {/* Desglose de ítems */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-mute mb-2">
            Productos del pedido
          </h4>
          <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-cream/20 p-3 space-y-2 text-sm">
            {order.items.map((item, i) => (
              <li key={i} className="pt-2 first:pt-0 flex justify-between items-start">
                <div>
                  <span className="font-semibold text-ink">
                    {item.qty}× {item.name}
                  </span>
                  {item.notes && (
                    <p className="text-xs text-wine font-medium mt-0.5 italic">
                      Obs: {item.notes}
                    </p>
                  )}
                </div>
                <span className="font-mono text-xs font-semibold text-ink">
                  {formatMoney(item.price * item.qty)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-between items-baseline pt-2 border-t border-ink/10">
          <span className="text-xs font-bold uppercase text-mute">Total:</span>
          <span className="font-display font-bold text-2xl text-ink">
            {formatMoney(orderTotal(order))}
          </span>
        </div>

        {/* Acciones del mesero */}
        <div className="space-y-2 pt-2">
          {order.status === "listo" && (
            <button
              onClick={() => {
                onConfirmDelivery(order.id);
                onClose();
              }}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 font-bold text-cream shadow-xs transition-transform active:scale-95"
            >
              <span>✓ Confirmar entrega a mesa</span>
            </button>
          )}

          <button
            onClick={onOpenComanda}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-ink/20 bg-cream font-semibold text-xs text-ink hover:bg-sand transition-colors"
          >
            📄 Ver comanda física de preparación (sin precios)
          </button>

          <button
            onClick={onClose}
            className="min-h-[44px] w-full rounded-xl text-center text-xs font-semibold text-mute hover:bg-cream"
          >
            Cerrar detalle
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MODAL DE COMANDA FÍSICA DE PREPARACIÓN (Barra & Cocina)
 * Estrictamente sin precios ni totales.
 */
function ComandaModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-paper p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ink/10">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Comanda de preparación</h3>
            <p className="text-xs text-mute">Formato físico para barra y cocina</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-mute hover:bg-cream"
          >
            ✕
          </button>
        </div>

        {/* Voucher COMANDA: PREPARACIÓN */}
        <div className="rounded-xl border-2 border-dashed border-ink/35 bg-sand/20 p-4 font-mono text-xs">
          <div className="text-center border-b border-dashed border-ink/20 pb-2">
            <p className="font-bold text-sm tracking-wider">COMANDA: PREPARACIÓN</p>
            <p className="text-[11px] font-semibold text-wine">Barra & Cocina · Sin precios</p>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-ink/20 pb-2">
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
              <div key={i} className="bg-cream/90 rounded-lg p-2.5 border border-ink/10">
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

          <div className="mt-4 border-t border-dashed border-ink/20 pt-2 text-center text-[10px] text-mute font-sans">
            Comprobante físico de preparación · No fiscal · Sin precios
          </div>
        </div>

        <button
          onClick={onClose}
          className="min-h-[44px] w-full rounded-xl bg-wine px-5 py-2.5 text-sm font-semibold text-cream transition-all hover:bg-wine-light active:scale-95"
        >
          Cerrar vista
        </button>
      </div>
    </div>
  );
}
