"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getCategories,
  getProducts,
  type CatalogProduct,
  type CartItemDraft,
} from "@/lib/catalog-adapter";
import {
  formatMoney,
  OPERATIONAL_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PRINT_STATUS_LABELS,
  type Comanda,
  type ModificationDiffItem,
  type OperationalStatus,
  type OrderType,
  type Role,
} from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { usePos } from "@/lib/pos-context";
import { DIGITAL_MENU_URL } from "@/lib/config";

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
  const {
    tables,
    accounts,
    comandas,
    retryPrintComanda,
    confirmComandaReady,
    confirmComandaDelivered,
  } = usePos();

  const [filter, setFilter] = useState<OperationalStatus | "todos" | "error">("todos");
  const [showNewOrderModal, setShowNewOrderModal] = useState(() => {
    return searchParams.get("nuevo") === "1" || searchParams.get("nuevo") === "true";
  });
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
  const [selectedForPhysicalComanda, setSelectedForPhysicalComanda] = useState<Comanda | null>(null);
  const [comandaForModification, setComandaForModification] = useState<Comanda | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtrado de comandas
  const visibleComandas = useMemo(() => {
    if (filter === "todos") return comandas;
    if (filter === "error") return comandas.filter((c) => c.printStatus === "error");
    return comandas.filter((c) => c.operationalStatus === filter);
  }, [comandas, filter]);

  const listos = useMemo(
    () => comandas.filter((c) => c.operationalStatus === "listo_entrega"),
    [comandas]
  );
  const erroresImpresion = useMemo(
    () => comandas.filter((c) => c.printStatus === "error"),
    [comandas]
  );

  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  function handleRetryPrint(comandaId: string, simulateSuccess = true) {
    const ok = retryPrintComanda(comandaId, simulateSuccess);
    if (ok) {
      triggerToast(`✓ Impresión exitosa para comanda ${comandaId}. Enviada a preparación.`);
      if (selectedComanda?.id === comandaId) {
        setSelectedComanda(null);
      }
    } else {
      triggerToast(`✕ Fallo en la reimpresión simulada de ${comandaId}. Sigue en cola.`);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toast de notificación */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-cream shadow-2xl transition-all"
        >
          {toastMessage}
        </div>
      )}

      {/* Cabecera optimizada */}
      <PageHeader
        title={role === "mesero" ? "Servicio de Salón" : "Gestión de Pedidos y Comandas"}
        subtitle={
          role === "mesero"
            ? `Atención en mesas · ${user} · Consulta de comandas y cuentas abiertas`
            : "Monitoreo general de cuentas, comandas y producción"
        }
      >
        <div className="flex items-center gap-2">
          <a
            href={DIGITAL_MENU_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[46px] items-center gap-2 rounded-xl border border-wine/20 bg-wine/10 px-4 py-2.5 text-sm font-semibold text-wine transition-all hover:bg-wine/20 active:scale-95"
            title="Abrir menú digital para comensales en pestaña nueva"
            aria-label="Abrir menú digital para comensales en pestaña nueva"
          >
            <span>📖</span>
            <span className="hidden sm:inline">Menú digital</span>
            <span className="text-xs" aria-hidden="true">↗</span>
          </a>
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="flex min-h-[46px] items-center gap-2 rounded-xl bg-wine px-5 py-2.5 text-sm font-semibold text-cream shadow-md transition-all hover:bg-wine-light active:scale-95"
          >
            <span className="text-lg leading-none">+</span>
            <span>Nuevo pedido</span>
          </button>
        </div>
      </PageHeader>

      {/* Banner informativo de reglas de confirmación */}
      {role === "mesero" && (
        <div className="rounded-xl border border-wine/15 bg-wine/5 p-3.5 text-xs text-ink/90 flex items-start gap-2.5">
          <span className="text-base">ℹ️</span>
          <div>
            <p className="font-bold text-wine">Reglas operativas del salón:</p>
            <p className="mt-0.5 text-mute">
              Como Mesero puedes registrar pedidos, añadir consumos a cuentas abiertas y consultar estados. Las confirmaciones de preparación terminada y de entrega son operadas exclusivamente por Caja.
            </p>
          </div>
        </div>
      )}

      {/* Banner de alerta: Comandas con error de impresión */}
      {erroresImpresion.length > 0 && (
        <div className="rounded-2xl border border-amber-400 bg-amber-50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-cream font-bold text-xs">
                ⚠️
              </span>
              <div>
                <p className="text-sm font-bold text-amber-950">
                  {erroresImpresion.length} comanda{erroresImpresion.length > 1 ? "s" : ""} con error de impresión simulada
                </p>
                <p className="text-xs text-amber-800">
                  La orden está guardada pero no se envió a preparación. Puedes reintentar la impresión sin duplicar la comanda.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilter("error")}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-cream hover:bg-amber-700 active:scale-95"
            >
              Ver errores
            </button>
          </div>
        </div>
      )}

      {/* Banner de pedidos listos para servir */}
      {listos.length > 0 && (
        <div
          onClick={() => setFilter("listo_entrega")}
          className="cursor-pointer rounded-2xl border border-emerald-300 bg-emerald-50/90 p-4 shadow-xs transition-colors hover:bg-emerald-100/80 active:scale-[0.99]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-cream font-bold text-sm">
                🔔
              </span>
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  {listos.length} comanda{listos.length > 1 ? "s" : ""} lista{listos.length > 1 ? "s" : ""} para servir
                </p>
                <p className="text-xs text-emerald-800">
                  Aviso físico recibido de barra/cocina. En espera de confirmación de entrega por Caja.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 hover:underline">
              Filtrar →
            </span>
          </div>
        </div>
      )}

      {/* Estado rápido de mesas de demostración */}
      <div className="rounded-2xl border border-ink/10 bg-paper p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-mute">
            Mesas del salón (Configuración Demo)
          </p>
          <span className="text-[11px] text-mute">
            {tables.filter((t) => t.status === "ocupada").length} ocupadas · {tables.filter((t) => t.status === "libre").length} libres
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {tables.map((table) => {
            const isOccupied = table.status === "ocupada";
            const account = isOccupied ? accounts.find((a) => a.id === table.activeAccountId) : null;
            return (
              <div
                key={table.id}
                className={`rounded-xl p-2.5 text-center border transition-all ${
                  isOccupied
                    ? "border-wine bg-wine/10 text-wine"
                    : "border-ink/10 bg-cream/40 text-ink/70"
                }`}
              >
                <p className="font-display font-bold text-sm">{table.label}</p>
                <p className="text-[10px] font-semibold mt-0.5">
                  {isOccupied ? `Ocupada (${account?.id ?? "Abierta"})` : "Libre"}
                </p>
                {account && (
                  <p className="text-[10px] font-bold text-ink mt-0.5 truncate">
                    {formatMoney(account.total)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra de filtros horizontales */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
        {(
          [
            { id: "todos", label: "Todas las comandas" },
            { id: "enviado_preparacion", label: "En preparación" },
            { id: "listo_entrega", label: "Listas para entrega" },
            { id: "entregado", label: "Entregadas" },
            { id: "error", label: "Errores de impresión" },
          ] as const
        ).map((f) => {
          const count =
            f.id === "todos"
              ? comandas.length
              : f.id === "error"
              ? comandas.filter((c) => c.printStatus === "error").length
              : comandas.filter((c) => c.operationalStatus === f.id).length;
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

      {/* Listado de comandas */}
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 xl:grid-cols-3">
        {visibleComandas.map((comanda) => {
          const totalQty = comanda.items.reduce((s, i) => s + i.quantity, 0);
          const summary = comanda.items
            .map((i) => `${i.quantity}× ${i.displayName}`)
            .join(", ");
          const parentAccount = accounts.find((a) => a.id === comanda.accountId);

          return (
            <article
              key={comanda.id}
              onClick={() => setSelectedComanda(comanda)}
              className={`cursor-pointer rounded-2xl border bg-paper p-4 shadow-xs transition-all hover:border-wine/30 active:scale-[0.99] flex flex-col justify-between ${
                comanda.printStatus === "error"
                  ? "border-amber-400 bg-amber-50/20"
                  : comanda.operationalStatus === "listo_entrega"
                  ? "border-emerald-300 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                  : "border-ink/10"
              }`}
            >
              <div>
                {/* Cabecera de tarjeta: Folio comanda, Cuenta, Ubicación */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-base text-ink">
                      {comanda.id}
                    </span>
                    <span className="rounded-lg bg-wine/10 px-2.5 py-0.5 text-xs font-bold text-wine">
                      {comanda.tableLabel ?? ORDER_TYPE_LABELS[comanda.type]}
                    </span>
                    {parentAccount && (
                      <span className="rounded-md bg-ink/5 px-2 py-0.5 text-[10px] font-semibold text-mute">
                        {parentAccount.id} · Ctd. #{comanda.orderNumber}
                      </span>
                    )}
                  </div>
                  <OperationalBadge status={comanda.operationalStatus} printStatus={comanda.printStatus} />
                </div>

                {/* Resumen de platillos */}
                <p className="mt-2 text-xs font-medium text-ink/80 line-clamp-2">
                  <span className="font-semibold text-ink">{totalQty} ítems:</span> {summary}
                </p>

                {comanda.observations && (
                  <p className="mt-1 text-[11px] text-wine/80 italic line-clamp-1">
                    Nota: {comanda.observations}
                  </p>
                )}

                {comanda.modificationStatus === "solicitada" && (
                  <div className="mt-2 rounded-lg bg-amber-100/70 px-2 py-1 text-[11px] font-bold text-amber-900">
                    ⏳ Modificación pendiente de aprobación en Caja
                  </div>
                )}
              </div>

              {/* Fila inferior de acciones */}
              <div className="mt-3.5 flex items-center justify-between border-t border-ink/10 pt-2.5 gap-2">
                <span className="text-[11px] text-mute">
                  {comanda.createdAt} · {comanda.createdBy}
                </span>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Botón de reintento si la impresión falló */}
                  {comanda.printStatus === "error" && (
                    <button
                      onClick={() => handleRetryPrint(comanda.id, true)}
                      className="flex min-h-[36px] items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-cream hover:bg-amber-700 active:scale-95"
                    >
                      <span>🔄</span>
                      <span>Reintentar impresión</span>
                    </button>
                  )}

                  {/* Ver formato de comanda física */}
                  <button
                    onClick={() => setSelectedForPhysicalComanda(comanda)}
                    className="min-h-[36px] rounded-lg border border-ink/15 bg-cream/70 px-2.5 py-1 text-xs font-medium text-ink hover:bg-sand"
                    title="Ver comanda sin precios para preparación"
                  >
                    📄 Comanda
                  </button>

                  {/* Acciones para Admin (simulación rápida de pruebas) */}
                  {role === "admin" && comanda.operationalStatus === "enviado_preparacion" && (
                    <button
                      onClick={() => {
                        confirmComandaReady(comanda.id, role);
                        triggerToast(`Comanda ${comanda.id} marcada como Lista`);
                      }}
                      className="min-h-[36px] rounded-lg bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-ink/10"
                    >
                      Avanzar a lista
                    </button>
                  )}
                  {role === "admin" && comanda.operationalStatus === "listo_entrega" && (
                    <button
                      onClick={() => {
                        confirmComandaDelivered(comanda.id, role);
                        triggerToast(`Comanda ${comanda.id} marcada como Entregada`);
                      }}
                      className="min-h-[36px] rounded-lg bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-ink/10"
                    >
                      Avanzar a entregada
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visibleComandas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink/20 p-12 text-center text-sm text-mute bg-paper/40">
          <p className="font-semibold text-base text-ink mb-1">
            No hay comandas en este estado
          </p>
          <p className="text-xs">
            Usa el botón &quot;+ Nuevo pedido&quot; para registrar un pedido en mesa o para llevar.
          </p>
        </div>
      )}

      {/* MODAL 1: Creador de Nuevo Pedido (Mobile-First) */}
      {showNewOrderModal && (
        <NewOrderMobileFlow
          waiterName={user}
          onClose={() => setShowNewOrderModal(false)}
          onSuccess={(newComanda) => {
            setShowNewOrderModal(false);
            if (newComanda.printStatus === "impreso") {
              triggerToast(`✓ ¡Comanda ${newComanda.id} enviada a preparación con éxito!`);
            } else {
              triggerToast(`⚠️ Comanda ${newComanda.id} creada con error de impresión simulado.`);
            }
          }}
        />
      )}

      {/* MODAL 2: Detalle de Comanda */}
      {selectedComanda && (
        <ComandaDetailModal
          comanda={selectedComanda}
          onClose={() => setSelectedComanda(null)}
          onOpenPhysical={() => setSelectedForPhysicalComanda(selectedComanda)}
          onRequestModification={() => {
            setComandaForModification(selectedComanda);
            setSelectedComanda(null);
          }}
          onRetryPrint={() => handleRetryPrint(selectedComanda.id, true)}
        />
      )}

      {/* MODAL 3: Comanda Física de Preparación (Estrictamente SIN precios) */}
      {selectedForPhysicalComanda && (
        <PhysicalComandaModal
          comanda={selectedForPhysicalComanda}
          onClose={() => setSelectedForPhysicalComanda(null)}
        />
      )}

      {/* MODAL 4: Solicitud de Modificación (Mesero) */}
      {comandaForModification && (
        <ModificationRequestModal
          comanda={comandaForModification}
          userName={user}
          onClose={() => setComandaForModification(null)}
          onSubmitSuccess={() => {
            setComandaForModification(null);
            triggerToast("✓ Solicitud de modificación enviada a Caja para autorización.");
          }}
        />
      )}
    </div>
  );
}

/**
 * Badge de estado operativo y de impresión
 */
function OperationalBadge({
  status,
  printStatus,
}: {
  status: OperationalStatus;
  printStatus: string;
}) {
  if (printStatus === "error") {
    return (
      <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-300">
        Error impresión
      </span>
    );
  }

  const styles: Record<OperationalStatus, string> = {
    pendiente_impresion: "bg-amber-100 text-amber-800",
    enviado_preparacion: "bg-blue-100 text-blue-800",
    listo_entrega: "bg-emerald-100 text-emerald-800",
    entregado: "bg-zinc-200 text-zinc-700",
  };

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {OPERATIONAL_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * MODAL FLUIDO MOBILE-FIRST DE NUEVO PEDIDO
 * Utiliza el catálogo oficial data/catalogo.json
 * Soporta variantes, notas, selección de mesas y vinculación a cuentas abiertas
 */
function NewOrderMobileFlow({
  waiterName,
  onClose,
  onSuccess,
}: {
  waiterName: string;
  onClose: () => void;
  onSuccess: (comanda: Comanda) => void;
}) {
  const { tables, accounts, isProductAvailable, createComanda } = usePos();

  const [type, setType] = useState<OrderType>("mesa");
  const [selectedTableId, setSelectedTableId] = useState<string>("mesa-1");
  const [customerName, setCustomerName] = useState("");
  const [category, setCategory] = useState("Todas");
  const [search, setSearch] = useState("");

  // Carrito de compras: draft de ítems
  const [cart, setCart] = useState<CartItemDraft[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [editingNotesItemIdx, setEditingNotesItemIdx] = useState<number | null>(null);

  // Selector de variantes cuando un producto tiene múltiples tamaños
  const [variantModalProduct, setVariantModalProduct] = useState<CatalogProduct | null>(null);

  // Simulación de error de impresora para pruebas
  const [simulatePrintError, setSimulatePrintError] = useState(false);

  const categories = useMemo(() => ["Todas", ...getCategories().map((c) => c.id)], []);
  const allProducts = useMemo(() => getProducts(), []);

  // Filtrado de productos disponibles
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allProducts.filter((p) => {
      const matchCat = category === "Todas" || p.categoryId === category;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [allProducts, category, search]);

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Información de cuenta abierta en la mesa seleccionada
  const activeAccountInSelectedTable = useMemo(() => {
    if (type !== "mesa") return null;
    return accounts.find((a) => a.tableId === selectedTableId && a.status === "abierta");
  }, [accounts, type, selectedTableId]);

  const selectedTableObj = tables.find((t) => t.id === selectedTableId);

  function handleProductTap(product: CatalogProduct) {
    if (!isProductAvailable(product.id)) return;

    if (product.variants && product.variants.length > 1) {
      // Requiere elegir tamaño/presentación obligatoriamente
      setVariantModalProduct(product);
    } else {
      // Producto con precio único o variante única
      const variantSize = product.variants?.[0]?.size;
      const price = product.variants?.[0]?.price ?? product.price ?? 0;
      const displayName =
        variantSize && variantSize !== "Única"
          ? `${product.name} (${variantSize})`
          : product.name;

      addDraftItem({
        productId: product.id,
        productName: product.name,
        variantSize,
        displayName,
        unitPrice: price,
        qty: 1,
        subtotal: price,
      });
    }
  }

  function addDraftItem(draft: CartItemDraft) {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (i) =>
          i.productId === draft.productId &&
          i.variantSize === draft.variantSize &&
          !i.notes
      );
      if (existingIdx >= 0) {
        const copy = [...prev];
        const updatedQty = copy[existingIdx].qty + draft.qty;
        copy[existingIdx] = {
          ...copy[existingIdx],
          qty: updatedQty,
          subtotal: copy[existingIdx].unitPrice * updatedQty,
        };
        return copy;
      }
      return [...prev, draft];
    });
  }

  function updateItemQty(index: number, delta: number) {
    setCart((prev) => {
      const item = prev[index];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }
      const copy = [...prev];
      copy[index] = {
        ...item,
        qty: newQty,
        subtotal: item.unitPrice * newQty,
      };
      return copy;
    });
  }

  function updateItemNotes(index: number, notes: string) {
    setCart((prev) => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], notes: notes.trim() || undefined };
      }
      return copy;
    });
  }

  function submitComanda() {
    if (cart.length === 0) return;

    const result = createComanda({
      type,
      tableId: type === "mesa" ? selectedTableId : undefined,
      tableLabel: type === "mesa" ? selectedTableObj?.label : undefined,
      customer: type === "llevar" ? (customerName.trim() || "Cliente mostrador") : undefined,
      waiter: waiterName,
      items: cart,
      simulatePrintError,
    });

    onSuccess(result.comanda);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-paper pb-[max(1rem,env(safe-area-inset-bottom))] overflow-hidden">
      {/* Barra superior del creador */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink/10 bg-wine px-4 text-cream">
        <div>
          <h2 className="font-display text-base font-bold">
            {reviewing ? "Revisar comanda" : "Nuevo pedido"}
          </h2>
          <p className="text-[11px] text-cream/75">
            {type === "mesa" ? selectedTableObj?.label : "Para llevar"} · {waiterName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-cream/80 hover:bg-cream/10 active:bg-cream/20 font-bold"
          aria-label="Cerrar creador de pedido"
        >
          ✕
        </button>
      </header>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!reviewing ? (
          <>
            {/* 1. Destino del pedido */}
            <div className="rounded-2xl border border-ink/10 bg-cream/40 p-3.5 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-mute">
                1. Destino y asignación de cuenta
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
                    Selecciona una mesa:
                  </p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {tables.map((t) => {
                      const hasAccount = accounts.some(
                        (a) => a.tableId === t.id && a.status === "abierta"
                      );
                      const isSelected = selectedTableId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTableId(t.id)}
                          className={`min-h-[44px] rounded-xl px-2 py-1 text-xs font-bold transition-all active:scale-95 flex flex-col items-center justify-center ${
                            isSelected
                              ? "bg-wine text-cream shadow-sm"
                              : hasAccount
                              ? "bg-wine/15 text-wine border border-wine/30"
                              : "bg-paper text-ink border border-ink/15"
                          }`}
                        >
                          <span>{t.label}</span>
                          <span className="text-[9px] font-normal opacity-85">
                            {hasAccount ? "Abierta" : "Libre"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {activeAccountInSelectedTable ? (
                    <div className="mt-2.5 rounded-xl border border-wine/20 bg-wine/5 p-2.5 text-xs text-wine">
                      <p className="font-bold">
                        ✓ {selectedTableObj?.label} tiene cuenta abierta ({activeAccountInSelectedTable.id})
                      </p>
                      <p className="text-[11px] text-ink/80 mt-0.5">
                        Saldo acumulado actual: <strong>{formatMoney(activeAccountInSelectedTable.total)}</strong>. Esta orden se agregará como una <em>nueva comanda (consumo adicional)</em> a la misma cuenta.
                      </p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-emerald-800 font-medium">
                      ✓ Mesa libre: Al confirmar se abrirá una nueva cuenta para {selectedTableObj?.label}.
                    </p>
                  )}
                </div>
              )}

              {type === "llevar" && (
                <div className="pt-2">
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre del cliente mostrador (opcional)…"
                    className="min-h-[44px] w-full rounded-xl border border-ink/15 bg-paper px-3.5 text-sm outline-none focus:border-wine"
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
                  placeholder="Buscar platillo (ej. Latte, Champipesto, Mostachón)…"
                  className="min-h-[44px] w-full rounded-xl border border-ink/15 bg-paper px-3.5 text-base sm:text-xs outline-none focus:border-wine shadow-xs"
                />
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {categories.map((c) => {
                  const catObj = getCategories().find((x) => x.id === c);
                  const label = c === "Todas" ? "Todas" : (catObj?.name ?? c);
                  return (
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
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Catálogo de productos táctil */}
            <div className="space-y-2 pb-24">
              {filteredProducts.map((product) => {
                const available = isProductAvailable(product.id);
                const hasVariants = product.variants && product.variants.length > 1;
                // Ítems de este producto en el carrito
                const inCartItems = cart.filter((i) => i.productId === product.id);
                const inCartQty = inCartItems.reduce((s, i) => s + i.qty, 0);

                return (
                  <div
                    key={product.id}
                    className={`rounded-2xl border p-3.5 transition-all flex items-center justify-between gap-3 ${
                      !available
                        ? "border-zinc-300 opacity-50 bg-zinc-50"
                        : inCartQty > 0
                        ? "border-wine bg-wine/5 shadow-xs"
                        : "border-ink/10 bg-paper"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="font-semibold text-sm text-ink truncate">
                          {product.name}
                        </p>
                        <span className="text-[10px] text-mute">{product.categoryName}</span>
                      </div>
                      {product.description && (
                        <p className="text-[11px] text-mute line-clamp-1 mt-0.5">
                          {product.description}
                        </p>
                      )}

                      {/* Muestra de precio o variantes */}
                      {hasVariants ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.variants!.map((v, i) => (
                            <span
                              key={i}
                              className="rounded bg-cream px-1.5 py-0.5 text-[10px] font-bold text-wine border border-ink/10"
                            >
                              {v.size}: {formatMoney(v.price)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-wine mt-1">
                          {formatMoney(product.variants?.[0]?.price ?? product.price ?? 0)}
                        </p>
                      )}

                      {inCartQty > 0 && (
                        <p className="text-[11px] font-semibold text-wine mt-1">
                          ✓ {inCartQty} en pedido
                        </p>
                      )}
                    </div>

                    {/* Botón táctil para agregar */}
                    <div className="shrink-0">
                      {available ? (
                        <button
                          type="button"
                          onClick={() => handleProductTap(product)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-wine px-3.5 py-2 font-bold text-cream text-xs shadow-xs transition-transform active:scale-90"
                        >
                          {hasVariants ? "+ Elegir tamaño" : "+ Agregar"}
                        </button>
                      ) : (
                        <span className="rounded-lg bg-zinc-200 px-2.5 py-1 text-[11px] font-bold text-zinc-600">
                          Agotado
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* PASO DE REVISIÓN Y CONFIRMACIÓN */
          <div className="space-y-4 pb-28">
            <div className="rounded-2xl border border-wine/20 bg-cream/40 p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-mute font-bold">Destino:</span>
                <span className="rounded-lg bg-wine text-cream px-3 py-1 font-bold text-xs">
                  {type === "mesa" ? selectedTableObj?.label : "Para llevar"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-mute">
                <span>Mesero:</span>
                <span className="font-semibold text-ink">{waiterName}</span>
              </div>
              {activeAccountInSelectedTable && (
                <div className="border-t border-ink/10 pt-2 text-xs text-wine">
                  <span>Cuenta abierta activa: <strong>{activeAccountInSelectedTable.id}</strong></span>
                  <p className="text-[11px] text-mute">
                    Esta comanda se vinculará a la cuenta activa de {selectedTableObj?.label}.
                  </p>
                </div>
              )}
            </div>

            {/* Desglose de ítems con selector de cantidades */}
            <div className="rounded-2xl border border-ink/10 bg-paper p-4">
              <h3 className="font-display text-sm font-bold text-ink mb-3">
                Resumen de comanda ({totalItems} ítems)
              </h3>
              <ul className="divide-y divide-ink/5 text-sm space-y-2.5">
                {cart.map((item, idx) => (
                  <li key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-ink">{item.displayName}</p>
                      <p className="text-xs text-mute">
                        Unitario: {formatMoney(item.unitPrice)}
                      </p>
                      {item.notes ? (
                        <p className="text-xs text-wine font-medium mt-0.5">
                          Obs: {item.notes}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingNotesItemIdx(idx)}
                          className="text-[11px] text-wine hover:underline mt-0.5"
                        >
                          + Agregar nota
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-cream rounded-xl border border-ink/15 p-0.5">
                        <button
                          type="button"
                          onClick={() => updateItemQty(idx, -1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-paper font-bold text-ink text-sm active:scale-90"
                        >
                          –
                        </button>
                        <span className="w-6 text-center font-bold text-xs text-ink">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(idx, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-wine text-cream font-bold text-sm active:scale-90"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-mono text-xs font-bold text-ink min-w-[50px] text-right">
                        {formatMoney(item.subtotal)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 pt-3 border-t border-ink/10 flex justify-between items-baseline">
                <span className="text-xs uppercase font-bold text-mute">Total de esta comanda:</span>
                <span className="font-display font-bold text-2xl text-wine">
                  {formatMoney(totalPrice)}
                </span>
              </div>
            </div>

            {/* Control para simulación de error de impresión (Prueba 5) */}
            <div className="rounded-2xl border border-dashed border-ink/25 bg-sand/20 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-ink">Simulación de impresora</p>
                  <p className="text-[11px] text-mute">
                    Control de pruebas de impresión de comanda
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={simulatePrintError}
                    onChange={(e) => setSimulatePrintError(e.target.checked)}
                    className="h-4 w-4 rounded accent-wine"
                  />
                  <span className="text-xs font-semibold text-amber-900">
                    Simular fallo
                  </span>
                </label>
              </div>
              <p className="text-[11px] text-ink/75 italic">
                {simulatePrintError
                  ? "⚠️ La comanda quedará en Pendiente de impresión / Error (Prueba 5). Podrás reintentar sin duplicar."
                  : "✓ Modo normal: Simulará impresión exitosa y avanzará a Enviado a preparación (Prueba 4)."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer sticky de acción */}
      <footer className="border-t border-ink/10 bg-paper p-4 shadow-xl shrink-0">
        {!reviewing ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-mute font-medium">
                {totalItems} {totalItems === 1 ? "ítem" : "ítems"}
              </p>
              <p className="font-display text-lg font-bold text-ink">
                {formatMoney(totalPrice)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReviewing(true)}
              disabled={cart.length === 0}
              className="flex min-h-[48px] items-center gap-2 rounded-xl bg-wine px-6 py-3 font-bold text-cream transition-all hover:bg-wine-light active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>Revisar comanda</span>
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
              onClick={submitComanda}
              className="min-h-[48px] rounded-xl bg-wine font-bold text-cream text-sm hover:bg-wine-light active:scale-95 shadow-md"
            >
              Confirmar orden ✓
            </button>
          </div>
        )}
      </footer>

      {/* SUB-MODAL: Selector obligatorio de Variante/Tamaño */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
          <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-paper p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-ink/10 pb-2">
              <div>
                <h4 className="font-display font-bold text-base text-ink">
                  Selecciona presentación
                </h4>
                <p className="text-xs text-mute">{variantModalProduct.name}</p>
              </div>
              <button
                onClick={() => setVariantModalProduct(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-mute hover:bg-cream"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {variantModalProduct.variants!.map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    addDraftItem({
                      productId: variantModalProduct.id,
                      productName: variantModalProduct.name,
                      variantSize: v.size,
                      displayName: `${variantModalProduct.name} (${v.size})`,
                      unitPrice: v.price,
                      qty: 1,
                      subtotal: v.price,
                    });
                    setVariantModalProduct(null);
                  }}
                  className="flex min-h-[50px] w-full items-center justify-between rounded-xl border border-ink/15 bg-cream/50 px-4 py-3 font-semibold text-ink hover:border-wine hover:bg-wine/5 active:scale-95"
                >
                  <div className="text-left">
                    <p className="text-sm font-bold">{v.size}</p>
                    {v.volumeMl && (
                      <p className="text-[11px] text-mute">{v.volumeMl} ml</p>
                    )}
                  </div>
                  <span className="font-display font-bold text-wine">
                    {formatMoney(v.price)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Editor de observaciones por producto */}
      {editingNotesItemIdx !== null && cart[editingNotesItemIdx] && (
        <ItemNotesSheet
          item={cart[editingNotesItemIdx]}
          onClose={() => setEditingNotesItemIdx(null)}
          onSave={(notes) => {
            updateItemNotes(editingNotesItemIdx, notes);
            setEditingNotesItemIdx(null);
          }}
        />
      )}
    </div>
  );
}

/**
 * Hoja de notas y observaciones rápidas de preparación
 */
function ItemNotesSheet({
  item,
  onClose,
  onSave,
}: {
  item: CartItemDraft;
  onClose: () => void;
  onSave: (notes: string) => void;
}) {
  const [text, setText] = useState(item.notes ?? "");

  const QUICK_NOTES = [
    "Sin azúcar",
    "Leche deslactosada",
    "Leche de almendra",
    "Leche de coco",
    "Muy caliente",
    "Con poco hielo",
    "Para después",
    "Término bien cocido",
  ];

  function addPreset(p: string) {
    if (!text) {
      setText(p);
    } else if (!text.includes(p)) {
      setText(`${text}, ${p}`);
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-paper p-5 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-ink/10 pb-2">
          <div>
            <h4 className="font-display font-bold text-base text-ink">
              Observaciones de preparación
            </h4>
            <p className="text-xs text-mute">{item.displayName}</p>
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

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe notas especiales de barra o cocina…"
          rows={3}
          className="w-full rounded-xl border border-ink/20 bg-cream p-3 text-sm outline-none focus:border-wine"
        />

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
            Guardar nota
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MODAL DE DETALLE DE COMANDA
 */
function ComandaDetailModal({
  comanda,
  onClose,
  onOpenPhysical,
  onRequestModification,
  onRetryPrint,
}: {
  comanda: Comanda;
  onClose: () => void;
  onOpenPhysical: () => void;
  onRequestModification: () => void;
  onRetryPrint: () => void;
}) {
  const { accounts } = usePos();
  const parentAccount = accounts.find((a) => a.id === comanda.accountId);
  const totalComanda = comanda.items.reduce((s, i) => s + i.subtotal, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6">
      <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-paper p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between border-b border-ink/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-xl text-ink">{comanda.id}</h3>
              <span className="rounded-lg bg-wine text-cream px-2.5 py-0.5 text-xs font-bold">
                {comanda.tableLabel ?? ORDER_TYPE_LABELS[comanda.type]}
              </span>
            </div>
            <p className="text-xs text-mute mt-0.5">
              Cuenta: <strong>{comanda.accountId}</strong> · Hora: {comanda.createdAt} · Atiende: {comanda.createdBy}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-mute hover:bg-cream"
          >
            ✕
          </button>
        </div>

        {/* Estado operativo y de impresión */}
        <div className="rounded-xl bg-cream/50 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-mute">Estado operativo:</span>
            <span className="font-bold text-ink">{OPERATIONAL_STATUS_LABELS[comanda.operationalStatus]}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-mute">Estado de impresión:</span>
            <span className="font-bold text-ink">{PRINT_STATUS_LABELS[comanda.printStatus]}</span>
          </div>
          {comanda.printErrorReason && (
            <p className="text-amber-800 font-semibold">{comanda.printErrorReason}</p>
          )}
        </div>

        {/* Desglose de productos de la comanda */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-mute mb-2">
            Productos en esta comanda
          </h4>
          <ul className="divide-y divide-ink/10 rounded-xl border border-ink/10 bg-cream/20 p-3 space-y-2 text-sm">
            {comanda.items.map((item, i) => (
              <li key={i} className="pt-2 first:pt-0 flex justify-between items-start">
                <div>
                  <span className="font-semibold text-ink">
                    {item.quantity}× {item.displayName}
                  </span>
                  {item.notes && (
                    <p className="text-xs text-wine font-medium mt-0.5 italic">
                      Obs: {item.notes}
                    </p>
                  )}
                </div>
                <span className="font-mono text-xs font-semibold text-ink">
                  {formatMoney(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-between items-baseline pt-2 border-t border-ink/10">
          <div>
            <span className="text-xs font-bold uppercase text-mute">Subtotal comanda:</span>
            {parentAccount && (
              <p className="text-[11px] text-mute">
                Total acumulado de la cuenta: <strong>{formatMoney(parentAccount.total)}</strong>
              </p>
            )}
          </div>
          <span className="font-display font-bold text-2xl text-ink">
            {formatMoney(totalComanda)}
          </span>
        </div>

        {/* Acciones */}
        <div className="space-y-2 pt-2">
          {comanda.printStatus === "error" && (
            <button
              onClick={onRetryPrint}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-amber-600 font-bold text-cream text-xs shadow-xs hover:bg-amber-700 active:scale-95"
            >
              🔄 Reintentar impresión simulada
            </button>
          )}

          <button
            onClick={onOpenPhysical}
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-ink/20 bg-cream font-semibold text-xs text-ink hover:bg-sand transition-colors"
          >
            📄 Ver comanda física de preparación (sin precios)
          </button>

          {/* Si la comanda ya fue enviada y la cuenta sigue abierta, permitir solicitar modificación */}
          {parentAccount?.status === "abierta" && comanda.modificationStatus !== "solicitada" && (
            <button
              onClick={onRequestModification}
              className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-wine/30 bg-wine/5 font-semibold text-xs text-wine hover:bg-wine/10"
            >
              ✏️ Solicitar modificación autorizada
            </button>
          )}

          <button
            onClick={onClose}
            className="min-h-[40px] w-full rounded-xl text-center text-xs font-semibold text-mute hover:bg-cream"
          >
            Cerrar detalle
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * MODAL DE COMANDA FÍSICA DE PREPARACIÓN
 * Destino: Barra & Cocina.
 * ESTRICTAMENTE SIN PRECIOS NI TOTALES.
 */
function PhysicalComandaModal({
  comanda,
  onClose,
}: {
  comanda: Comanda;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6">
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-paper p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-ink/10">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Comanda de preparación</h3>
            <p className="text-xs text-mute">Formato físico para barra y cocina · Sin precios</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-mute hover:bg-cream"
          >
            ✕
          </button>
        </div>

        {/* Formato de ticket físico */}
        <div className="rounded-xl border-2 border-dashed border-ink/35 bg-sand/20 p-4 font-mono text-xs">
          <div className="text-center border-b border-dashed border-ink/20 pb-2">
            <p className="font-bold text-sm tracking-wider">LA CARLOTA</p>
            <p className="font-bold text-sm tracking-wider">COMANDA: PREPARACIÓN</p>
            <p className="text-[11px] font-semibold text-wine">Barra & Cocina · Sin precios</p>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-ink/20 pb-2">
            <div>
              <p>Folio: <strong className="text-sm">{comanda.id}</strong></p>
              <p>Cuenta: <strong>{comanda.accountId}</strong></p>
              <p>Destino: <strong>{comanda.tableLabel ?? ORDER_TYPE_LABELS[comanda.type]}</strong></p>
            </div>
            <div className="text-right">
              <p>Hora: <strong>{comanda.createdAt}</strong></p>
              <p>Atiende: <strong>{comanda.createdBy}</strong></p>
              <p>Comanda #: <strong>{comanda.orderNumber}</strong></p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-mute font-bold">
              Productos a elaborar:
            </p>
            {comanda.items.map((item, i) => (
              <div key={i} className="bg-cream/90 rounded-lg p-2.5 border border-ink/10">
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-wine text-cream text-[11px]">
                    {item.quantity}
                  </span>
                  <span>{item.displayName}</span>
                </div>
                {item.notes ? (
                  <p className="mt-1 ml-7 text-[11px] text-wine font-medium">
                    Obs: {item.notes}
                  </p>
                ) : (
                  <p className="mt-0.5 ml-7 text-[10px] text-mute/70">
                    Sin observaciones especiales
                  </p>
                )}
              </div>
            ))}
          </div>

          {comanda.observations && (
            <div className="mt-3 rounded-lg border border-dashed border-ink/20 p-2 text-[11px]">
              <span className="font-bold">Observaciones generales:</span> {comanda.observations}
            </div>
          )}

          <div className="mt-4 border-t border-dashed border-ink/20 pt-2 text-center text-[10px] text-mute font-sans">
            Comprobante físico interno de producción · No fiscal · Estrictamente sin precios
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

/**
 * MODAL DE SOLICITUD DE MODIFICACIÓN DE COMANDA
 * Permite al Mesero solicitar cambios a una comanda ya enviada, que requerirá autorización de Caja
 */
function ModificationRequestModal({
  comanda,
  userName,
  onClose,
  onSubmitSuccess,
}: {
  comanda: Comanda;
  userName: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}) {
  const { requestModification } = usePos();
  const [reason, setReason] = useState("");
  const [selectedItemName, setSelectedItemName] = useState(comanda.items[0]?.displayName ?? "");
  const [actionType, setActionType] = useState<"modificar" | "quitar">("modificar");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;

    const diff: ModificationDiffItem[] = [
      {
        action: actionType,
        name: selectedItemName,
        qtyDiff: actionType === "quitar" ? 1 : 0,
        notes: actionType === "modificar" ? notes : undefined,
      },
    ];

    requestModification({
      comandaId: comanda.id,
      requestedBy: userName,
      reason: reason.trim(),
      diffItems: diff,
    });

    onSubmitSuccess();
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6">
      <div className="w-full max-w-md rounded-2xl bg-paper p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-ink/10 pb-2">
          <div>
            <h4 className="font-display font-bold text-base text-ink">
              Solicitar modificación de comanda
            </h4>
            <p className="text-xs text-mute">{comanda.id} · Requiere autorización de Caja</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-mute hover:bg-cream"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-mute block mb-1">
              Platillo a modificar:
            </label>
            <select
              value={selectedItemName}
              onChange={(e) => setSelectedItemName(e.target.value)}
              className="w-full rounded-xl border border-ink/20 bg-cream p-2.5 text-xs outline-none focus:border-wine"
            >
              {comanda.items.map((it, idx) => (
                <option key={idx} value={it.displayName}>
                  {it.quantity}× {it.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-mute block mb-1">
              Tipo de cambio:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActionType("modificar")}
                className={`py-2 px-3 rounded-lg font-bold border ${
                  actionType === "modificar"
                    ? "bg-wine text-cream border-wine"
                    : "bg-cream text-ink border-ink/15"
                }`}
              >
                Añadir instrucción
              </button>
              <button
                type="button"
                onClick={() => setActionType("quitar")}
                className={`py-2 px-3 rounded-lg font-bold border ${
                  actionType === "quitar"
                    ? "bg-wine text-cream border-wine"
                    : "bg-cream text-ink border-ink/15"
                }`}
              >
                Cancelar 1 unidad
              </button>
            </div>
          </div>

          {actionType === "modificar" && (
            <div>
              <label className="font-semibold text-mute block mb-1">
                Nueva instrucción de preparación:
              </label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Cambio a leche deslactosada…"
                className="w-full rounded-xl border border-ink/20 bg-cream p-2.5 text-xs outline-none focus:border-wine"
              />
            </div>
          )}

          <div>
            <label className="font-semibold text-mute block mb-1">
              Motivo de la modificación (obligatorio):
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. El comensal solicitó cambio de leche de último momento…"
              rows={2}
              required
              className="w-full rounded-xl border border-ink/20 bg-cream p-2.5 text-xs outline-none focus:border-wine"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-xl px-4 text-xs font-semibold text-mute"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="min-h-[40px] rounded-xl bg-wine px-5 font-bold text-cream text-xs shadow-xs active:scale-95 disabled:opacity-40"
            >
              Enviar a Caja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
