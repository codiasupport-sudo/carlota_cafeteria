"use client";

import { useMemo, useState } from "react";
import {
  formatMoney,
  OPERATIONAL_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  type Account,
  type Comanda,
  type PaymentMethod,
} from "@/lib/types";
import { PageHeader, StatCard } from "@/components/ui";
import { usePos } from "@/lib/pos-context";

const PAYMENT_METHODS: PaymentMethod[] = ["efectivo", "tarjeta", "transferencia"];

export function CashierPanel() {
  const {
    accounts,
    comandas,
    pendingModifications,
    confirmComandaReady,
    confirmComandaDelivered,
    resolveModification,
    canChargeAccount,
    chargeAccount,
    resetToDemoData,
  } = usePos();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("efectivo");
  const [showVouchers, setShowVouchers] = useState(false);
  const [voucherAccount, setVoucherAccount] = useState<Account | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function triggerToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  // Cuentas abiertas (activas) y cerradas (cobradas hoy)
  const openAccounts = useMemo(
    () => accounts.filter((a) => a.status === "abierta"),
    [accounts]
  );
  const closedAccounts = useMemo(
    () => accounts.filter((a) => a.status === "cerrada"),
    [accounts]
  );

  const totalCorte = useMemo(
    () => closedAccounts.reduce((sum, a) => sum + a.total, 0),
    [closedAccounts]
  );

  // Cuenta actualmente seleccionada
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) ?? openAccounts[0] ?? null,
    [accounts, selectedAccountId, openAccounts]
  );

  // Comandas asociadas a la cuenta seleccionada
  const accountComandas = useMemo(() => {
    if (!selectedAccount) return [];
    return comandas.filter((c) => c.accountId === selectedAccount.id);
  }, [comandas, selectedAccount]);

  // Validación de cobro
  const chargeValidation = useMemo(() => {
    if (!selectedAccount) return { canCharge: false };
    return canChargeAccount(selectedAccount.id);
  }, [selectedAccount, canChargeAccount]);

  // Solicitudes de modificación pendientes
  const activeModRequests = useMemo(
    () => pendingModifications.filter((m) => m.status === "pendiente"),
    [pendingModifications]
  );

  function handleConfirmReady(comandaId: string) {
    confirmComandaReady(comandaId, "caja");
    triggerToast(`✓ Comanda ${comandaId} confirmada como: Lista para entrega.`);
  }

  function handleConfirmDelivered(comandaId: string) {
    confirmComandaDelivered(comandaId, "caja");
    triggerToast(`✓ Comanda ${comandaId} confirmada como: Entregada al cliente.`);
  }

  function handleProcessPayment() {
    if (!selectedAccount) return;
    try {
      chargeAccount(selectedAccount.id, selectedMethod);
      const paidAccount = accounts.find((a) => a.id === selectedAccount.id);
      setVoucherAccount(paidAccount ?? selectedAccount);
      setShowVouchers(true);
      triggerToast(
        `✓ Cobro de ${formatMoney(selectedAccount.total)} registrado exitosamente. Mesa liberada.`
      );
    } catch (e: unknown) {
      triggerToast(e instanceof Error ? e.message : "Error al procesar cobro");
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast accesible */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-cream shadow-2xl transition-all"
        >
          {toastMessage}
        </div>
      )}

      <PageHeader
        title="Módulo de Caja"
        subtitle="Confirmaciones operativas exclusivas, control de cuentas abiertas y cobro final"
      >
        <button
          onClick={() => {
            if (confirm("¿Restablecer los datos de demostración al estado inicial?")) {
              resetToDemoData();
              setSelectedAccountId(null);
              triggerToast("Datos de demostración restablecidos.");
            }
          }}
          className="rounded-xl border border-ink/20 bg-paper px-3.5 py-2 text-xs font-semibold text-mute hover:text-ink active:scale-95"
          title="Restablecer datos demo"
        >
          🔄 Restablecer demo
        </button>
      </PageHeader>

      {/* Métricas del turno */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Cuentas abiertas"
          value={String(openAccounts.length)}
          hint="Mesas y pedidos por liquidar"
        />
        <StatCard
          label="Cuentas cobradas"
          value={String(closedAccounts.length)}
          hint="Tickets emitidos en turno"
        />
        <StatCard
          label="Corte parcial"
          value={formatMoney(totalCorte)}
          hint="Total cobrado en caja hoy (MXN)"
        />
      </div>

      {/* SECCIÓN 1: Solicitudes de modificación pendientes de autorizar */}
      {activeModRequests.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50/70 p-4 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-600 text-cream text-xs font-bold">
              !
            </span>
            <h3 className="font-display font-bold text-sm text-amber-950">
              Solicitudes de modificación pendientes ({activeModRequests.length})
            </h3>
          </div>
          <div className="space-y-2">
            {activeModRequests.map((mod) => (
              <div
                key={mod.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-paper p-3 border border-amber-200"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-ink">{mod.comandaId}</span>
                    <span className="text-xs text-mute">
                      Solicitado por {mod.requestedBy} a las {mod.requestedAt}
                    </span>
                  </div>
                  <p className="text-xs text-ink/90 mt-1">
                    <strong>Motivo:</strong> {mod.reason}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {mod.diffItems.map((diff, i) => (
                      <span
                        key={i}
                        className="rounded bg-sand/30 px-2 py-0.5 text-[11px] font-semibold text-wine"
                      >
                        {diff.action === "quitar" ? "Cancelar:" : "Modificar:"} {diff.name}
                        {diff.notes ? ` (${diff.notes})` : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      resolveModification({
                        requestId: mod.id,
                        approved: false,
                        authorizedBy: "Caja",
                        role: "caja",
                      });
                      triggerToast(`✕ Solicitud ${mod.id} rechazada.`);
                    }}
                    className="min-h-[36px] rounded-xl border border-ink/20 px-3 py-1.5 text-xs font-bold text-mute hover:text-ink active:scale-95"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => {
                      resolveModification({
                        requestId: mod.id,
                        approved: true,
                        authorizedBy: "Caja",
                        role: "caja",
                      });
                      triggerToast(`✓ Solicitud ${mod.id} aprobada y aplicada.`);
                    }}
                    className="min-h-[36px] rounded-xl bg-wine px-4 py-1.5 text-xs font-bold text-cream hover:bg-wine-light active:scale-95 shadow-xs"
                  >
                    Aprobar cambio
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECCIÓN 2: Panel principal de cuentas y cobro */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* COLUMNA IZQUIERDA: Cuentas abiertas y mesas */}
        <section className="rounded-2xl border border-ink/10 bg-paper shadow-xs overflow-hidden flex flex-col">
          <header className="border-b border-ink/10 px-5 py-4 bg-cream/30">
            <h2 className="font-display text-lg font-semibold text-ink">
              Cuentas abiertas ({openAccounts.length})
            </h2>
            <p className="text-xs text-mute">
              Mesas ocupadas y pedidos para llevar activos con comandas acumuladas
            </p>
          </header>

          <ul className="divide-y divide-ink/5 max-h-[620px] overflow-y-auto">
            {openAccounts.map((account) => {
              const isSelected = selectedAccount?.id === account.id;
              const relatedComandas = comandas.filter((c) => c.accountId === account.id);
              const pendingCount = relatedComandas.filter((c) => c.operationalStatus !== "entregado").length;

              return (
                <li key={account.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAccountId(account.id);
                      setShowVouchers(false);
                    }}
                    className={`flex min-h-[64px] w-full items-center justify-between px-5 py-4 text-left transition-colors active:bg-cream/40 ${
                      isSelected
                        ? "bg-wine/10 border-l-4 border-wine"
                        : "hover:bg-cream/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-ink">{account.id}</p>
                        <span className="rounded-md bg-wine text-cream px-2 py-0.5 text-xs font-bold">
                          {account.tableLabel ?? ORDER_TYPE_LABELS[account.type]}
                        </span>
                        {pendingCount > 0 ? (
                          <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
                            {pendingCount} por entregar
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                            ✓ Todo entregado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-mute mt-1">
                        Apertura: {account.openedAt} · Mesero: {account.waiter} · {relatedComandas.length} comanda{relatedComandas.length > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-display text-base font-bold text-ink">
                        {formatMoney(account.total)}
                      </span>
                      <p className="text-[10px] font-semibold text-wine">
                        Saldo acumulado
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}

            {openAccounts.length === 0 && (
              <li className="px-5 py-16 text-center text-sm text-mute">
                <p className="font-semibold text-ink mb-1">No hay cuentas abiertas</p>
                <p className="text-xs">Todas las mesas están libres y no hay pedidos activos.</p>
              </li>
            )}
          </ul>
        </section>

        {/* COLUMNA DERECHA: Detalle de cuenta, confirmaciones operativas y cobro */}
        <section className="rounded-2xl border border-ink/10 bg-paper p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          {!selectedAccount ? (
            <div className="py-24 text-center text-sm text-mute">
              Selecciona una cuenta de la lista para gestionar entregas y procesar el cobro.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Encabezado de la cuenta */}
              <div className="flex items-start justify-between border-b border-ink/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-ink">
                      {selectedAccount.id}
                    </h2>
                    <span className="rounded-lg bg-wine text-cream px-2.5 py-0.5 text-xs font-bold">
                      {selectedAccount.tableLabel ?? ORDER_TYPE_LABELS[selectedAccount.type]}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        selectedAccount.status === "abierta"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {selectedAccount.status === "abierta" ? "Cuenta abierta" : "Cerrada / Pagada"}
                    </span>
                  </div>
                  <p className="text-xs text-mute mt-1">
                    Abierta: {selectedAccount.openedAt} · Atiende: {selectedAccount.waiter}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase font-bold text-mute">Total cuenta</span>
                  <p className="font-display text-2xl font-bold text-wine">
                    {formatMoney(selectedAccount.total)}
                  </p>
                </div>
              </div>

              {/* LISTA DE COMANDAS DE ESTA CUENTA CON CONFIRMACIONES EXCLUSIVAS DE CAJA */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-mute mb-2.5">
                  Comandas asociadas a esta cuenta ({accountComandas.length})
                </h3>

                <div className="space-y-3">
                  {accountComandas.map((comanda) => {
                    const isReady = comanda.operationalStatus === "listo_entrega";
                    const isDelivered = comanda.operationalStatus === "entregado";
                    const isPreparing = comanda.operationalStatus === "enviado_preparacion";

                    return (
                      <div
                        key={comanda.id}
                        className={`rounded-xl border p-3.5 text-xs transition-all ${
                          isDelivered
                            ? "border-emerald-200 bg-emerald-50/30"
                            : isReady
                            ? "border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-400"
                            : "border-ink/10 bg-cream/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-ink/10 pb-2">
                          <div>
                            <span className="font-bold text-ink text-sm">
                              {comanda.id} (Comanda #{comanda.orderNumber})
                            </span>
                            <span className="text-mute ml-2">
                              Hora: {comanda.createdAt} · Por: {comanda.createdBy}
                            </span>
                          </div>
                          <div>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                isDelivered
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isReady
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-900"
                              }`}
                            >
                              {OPERATIONAL_STATUS_LABELS[comanda.operationalStatus]}
                            </span>
                          </div>
                        </div>

                        {/* Ítems de la comanda */}
                        <ul className="mt-2 space-y-1">
                          {comanda.items.map((it, idx) => (
                            <li key={idx} className="flex justify-between items-start text-ink">
                              <span>
                                {it.quantity}× {it.displayName}
                                {it.notes && (
                                  <span className="text-wine font-medium ml-1.5 italic">
                                    ({it.notes})
                                  </span>
                                )}
                              </span>
                              <span className="font-mono font-medium text-mute">
                                {formatMoney(it.subtotal)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* ACCIONES EXCLUSIVAS DE CAJA (ETAPA G) */}
                        <div className="mt-3 pt-2.5 border-t border-ink/10 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-mute font-medium">
                            Confirmación operativa de Caja:
                          </span>

                          <div className="flex items-center gap-2">
                            {/* Acción 1: Confirmar Listo para entrega */}
                            {isPreparing && (
                              <button
                                type="button"
                                onClick={() => handleConfirmReady(comanda.id)}
                                className="min-h-[34px] rounded-lg bg-blue-600 px-3 py-1 text-xs font-bold text-cream hover:bg-blue-700 active:scale-95 shadow-xs"
                              >
                                ✓ Confirmar Listo para entrega
                              </button>
                            )}

                            {/* Acción 2: Confirmar Entregado al cliente */}
                            {isReady && (
                              <button
                                type="button"
                                onClick={() => handleConfirmDelivered(comanda.id)}
                                className="min-h-[34px] rounded-lg bg-emerald-600 px-3.5 py-1 text-xs font-bold text-cream hover:bg-emerald-700 active:scale-95 shadow-xs"
                              >
                                ✓ Confirmar Entregado al cliente
                              </button>
                            )}

                            {isDelivered && (
                              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                <span>✓</span>
                                <span>Entregada a comensal</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECCIÓN DE COBRO FINAL Y VALIDACIÓN ESTRICTA (ETAPA I) */}
              <div className="border-t border-ink/10 pt-4 space-y-3">
                {selectedAccount.status === "abierta" ? (
                  <>
                    {/* Alerta si el cobro está bloqueado */}
                    {!chargeValidation.canCharge && (
                      <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 text-xs text-red-950">
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-bold">⛔</span>
                          <div>
                            <p className="font-bold">Bloqueo de cobro activo:</p>
                            <p className="mt-0.5 text-red-900 leading-relaxed">
                              {chargeValidation.reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {chargeValidation.canCharge && (
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 flex items-center gap-2">
                        <span>✓</span>
                        <p className="font-bold">
                          Todas las comandas han sido entregadas. Cuenta lista para cobro.
                        </p>
                      </div>
                    )}

                    {/* Selector de método de pago */}
                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-mute mb-2">
                        Selecciona método de pago:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSelectedMethod(m)}
                            className={`min-h-[46px] rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95 ${
                              selectedMethod === m
                                ? "border-wine bg-wine text-cream shadow-xs"
                                : "border-ink/15 bg-cream hover:border-wine/40 text-ink"
                            }`}
                          >
                            {PAYMENT_LABELS[m]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Botón de cobro */}
                    <button
                      type="button"
                      onClick={handleProcessPayment}
                      disabled={!chargeValidation.canCharge}
                      className="min-h-[52px] w-full rounded-xl bg-wine py-3 font-display font-bold text-cream text-base transition-all hover:bg-wine-light active:scale-95 shadow-md disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {chargeValidation.canCharge
                        ? `Cobrar ${formatMoney(selectedAccount.total)} y cerrar cuenta`
                        : "Cobro bloqueado (faltan entregas)"}
                    </button>
                  </>
                ) : (
                  /* Cuenta ya cobrada */
                  <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900">
                    <p className="font-bold text-sm">✓ Cuenta liquidada y cerrada</p>
                    <p className="mt-1">
                      Método de pago: <strong>{PAYMENT_LABELS[selectedAccount.paymentMethod!]}</strong> · Hora: {selectedAccount.closedAt}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setVoucherAccount(selectedAccount);
                        setShowVouchers(true);
                      }}
                      className="mt-3 inline-block rounded-lg bg-wine px-4 py-2 font-bold text-cream text-xs hover:bg-wine-light active:scale-95"
                    >
                      Ver comprobantes emitidos (3)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* MODAL DE COMPROBANTES DE LA CUENTA (ETAPA J) */}
      {showVouchers && voucherAccount && (
        <VouchersModal
          account={voucherAccount}
          comandas={comandas.filter((c) => c.accountId === voucherAccount.id)}
          onClose={() => setShowVouchers(false)}
        />
      )}
    </div>
  );
}

/**
 * MODAL DE COMPROBANTES OFICIALES DE CAFETERÍA CARLOTA (ETAPA J)
 * 1. COMANDA: PREPARACIÓN (Barra/Cocina · Sin precios)
 * 2. ORIGINAL: CAFETERÍA (Control administrativo y de caja · Con desglose, subtotales, total y método)
 * 3. COPIA: CLIENTE (Comprobante al comensal · Con cantidades y total pagado)
 */
function VouchersModal({
  account,
  comandas,
  onClose,
}: {
  account: Account;
  comandas: Comanda[];
  onClose: () => void;
}) {
  const [selectedDoc, setSelectedDoc] = useState<"todos" | "original" | "copia" | "comanda">("todos");

  // Aplanar todos los ítems de las diferentes comandas de la cuenta
  const allAccountItems = useMemo(() => {
    return comandas.flatMap((c) => c.items);
  }, [comandas]);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6">
      <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-paper p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-ink/10 pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">
              Comprobantes oficiales de la cuenta {account.id}
            </h3>
            <p className="text-xs text-mute">
              {account.tableLabel ?? ORDER_TYPE_LABELS[account.type]} · Total: {formatMoney(account.total)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-mute hover:bg-cream"
          >
            ✕
          </button>
        </div>

        {/* Pestañas de comprobantes */}
        <div className="flex flex-wrap gap-1.5 border-b border-ink/10 pb-2">
          {(
            [
              { id: "todos", label: "Ver los 3 formatos" },
              { id: "original", label: "1. Original (Cafetería)" },
              { id: "copia", label: "2. Copia (Cliente)" },
              { id: "comanda", label: "3. Comanda (Preparación)" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelectedDoc(t.id)}
              className={`min-h-[36px] rounded-xl px-3 py-1 text-xs font-semibold transition-colors ${
                selectedDoc === t.id
                  ? "bg-wine text-cream shadow-xs"
                  : "bg-cream text-mute hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid de comprobantes */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* 1. ORIGINAL: CAFETERÍA (Control administrativo) */}
          {(selectedDoc === "todos" || selectedDoc === "original") && (
            <div className="rounded-xl border border-dashed border-ink/30 bg-cream/70 p-4 font-mono text-xs shadow-xs">
              <div className="text-center border-b border-dashed border-ink/20 pb-2">
                <p className="font-bold text-sm tracking-wide">LA CARLOTA</p>
                <p className="font-semibold text-[11px] text-wine">ORIGINAL: CAFETERÍA</p>
                <p className="text-[10px] text-mute">Control interno de venta y caja</p>
              </div>

              <div className="mt-2 text-[11px] space-y-0.5 border-b border-dashed border-ink/20 pb-2">
                <p className="flex justify-between">
                  <span>Cuenta: <strong>{account.id}</strong></span>
                  <span>Hora: {account.closedAt ?? account.openedAt}</span>
                </p>
                <p>Ubicación: <strong>{account.tableLabel ?? ORDER_TYPE_LABELS[account.type]}</strong></p>
                <p>Mesero: {account.waiter}</p>
                <p>Comandas acumuladas: {comandas.length}</p>
              </div>

              <div className="mt-2.5 space-y-1 border-b border-dashed border-ink/20 pb-2">
                <p className="text-[10px] font-bold text-mute uppercase">Desglose de artículos:</p>
                {allAccountItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <span>{item.quantity}× {item.displayName}</span>
                    <span className="font-semibold">{formatMoney(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-1 text-[11px] space-y-1">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL COBRADO</span>
                  <span>{formatMoney(account.total)}</span>
                </div>
                <p className="text-[10px] text-mute">
                  Método de pago: <strong>{account.paymentMethod ? PAYMENT_LABELS[account.paymentMethod] : "Liquidado"}</strong>
                </p>
                <p className="text-[10px] text-mute">
                  Estado: PAGADO Y CUENTA CERRADA
                </p>
              </div>
            </div>
          )}

          {/* 2. COPIA: CLIENTE (Comprobante de compra al comensal) */}
          {(selectedDoc === "todos" || selectedDoc === "copia") && (
            <div className="rounded-xl border border-dashed border-ink/30 bg-cream/70 p-4 font-mono text-xs shadow-xs">
              <div className="text-center border-b border-dashed border-ink/20 pb-2">
                <p className="font-bold text-sm tracking-wide">LA CARLOTA</p>
                <p className="font-semibold text-[11px] text-zinc-700">COPIA: CLIENTE</p>
                <p className="text-[10px] text-mute">Comprobante de consumo</p>
              </div>

              <div className="mt-2 text-[11px] space-y-0.5 border-b border-dashed border-ink/20 pb-2">
                <p className="flex justify-between">
                  <span>Ticket: <strong>{account.id}</strong></span>
                  <span>Hora: {account.closedAt ?? account.openedAt}</span>
                </p>
                <p>{account.tableLabel ?? ORDER_TYPE_LABELS[account.type]}</p>
                <p>Atendió: {account.waiter}</p>
              </div>

              <div className="mt-2.5 space-y-1 border-b border-dashed border-ink/20 pb-2">
                {allAccountItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <span>{item.quantity}× {item.displayName}</span>
                    <span>{formatMoney(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-1 text-[11px] space-y-1 text-center">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOTAL PAGADO</span>
                  <span>{formatMoney(account.total)}</span>
                </div>
                <p className="text-[10px] text-mute text-left">
                  Pago: {account.paymentMethod ? PAYMENT_LABELS[account.paymentMethod] : "Efectivo"}
                </p>
                <p className="mt-2 text-[10px] text-mute italic">
                  ¡Gracias por su visita a Cafetería Carlota!
                </p>
              </div>
            </div>
          )}

          {/* 3. COMANDA: PREPARACIÓN (Barra / Cocina · Estrictamente SIN PRECIOS) */}
          {(selectedDoc === "todos" || selectedDoc === "comanda") && (
            <div className="rounded-xl border-2 border-dashed border-ink/40 bg-sand/30 p-4 font-mono text-xs shadow-xs sm:col-span-2">
              <div className="text-center border-b border-dashed border-ink/20 pb-2">
                <p className="font-bold text-sm tracking-wider">LA CARLOTA</p>
                <p className="font-bold text-sm tracking-wider">COMANDA: PREPARACIÓN (HISTÓRICO)</p>
                <p className="text-[11px] font-semibold text-wine">Barra & Cocina · Sin precios</p>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-ink/20 pb-2">
                <div>
                  <p>Cuenta: <strong className="text-sm">{account.id}</strong></p>
                  <p>Destino: <strong>{account.tableLabel ?? ORDER_TYPE_LABELS[account.type]}</strong></p>
                </div>
                <div className="text-right">
                  <p>Apertura: <strong>{account.openedAt}</strong></p>
                  <p>Mesero: <strong>{account.waiter}</strong></p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-mute font-bold">
                  Resumen de elaboración física de la cuenta:
                </p>
                {allAccountItems.map((item, idx) => (
                  <div key={idx} className="bg-cream/90 rounded-lg p-2 border border-ink/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-ink">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-wine text-cream text-[11px]">
                        {item.quantity}
                      </span>
                      <span>{item.displayName}</span>
                    </div>
                    {item.notes ? (
                      <span className="text-[11px] text-wine font-medium italic">
                        Obs: {item.notes}
                      </span>
                    ) : (
                      <span className="text-[10px] text-mute">Normal</span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-dashed border-ink/20 pt-2 text-center text-[10px] text-mute font-sans">
                Comprobante interno de producción física · No fiscal · Estrictamente sin precios
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-3 border-t border-ink/10">
          <button
            onClick={onClose}
            className="min-h-[44px] rounded-xl bg-wine px-6 font-bold text-cream text-xs hover:bg-wine-light active:scale-95"
          >
            Cerrar comprobantes
          </button>
        </div>
      </div>
    </div>
  );
}
