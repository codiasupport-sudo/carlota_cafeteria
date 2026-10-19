"use client";

/**
 * Contexto de estado compartido para el prototipo funcional de Cafetería Carlota (Fase 2).
 * Gestiona en memoria (con respaldo demostrativo en localStorage):
 * - Catálogo y disponibilidad temporal de productos
 * - Mesas configurables
 * - Cuentas abiertas y cerradas
 * - Comandas, estados operativos e impresiones simuladas
 * - Modificaciones y cobros
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import type {
  Account,
  Comanda,
  ComandaItem,
  ModificationDiffItem,
  ModificationRequest,
  OrderType,
  PaymentMethod,
  Role,
  Table,
} from "./types";
import type { CartItemDraft } from "./catalog-adapter";

const STORAGE_KEY = "carlota_cafeteria_pos_state_v2";

export interface PosContextType {
  tables: Table[];
  accounts: Account[];
  comandas: Comanda[];
  availabilityOverrides: Record<string, boolean>;
  pendingModifications: ModificationRequest[];
  isLoaded: boolean;

  // Acciones de catálogo y disponibilidad
  isProductAvailable: (productId: string) => boolean;
  toggleProductAvailability: (productId: string, role: Role) => void;

  // Creación y flujo de pedidos / comandas
  createComanda: (params: {
    type: OrderType;
    tableId?: string;
    tableLabel?: string;
    customer?: string;
    waiter: string;
    items: CartItemDraft[];
    observations?: string;
    simulatePrintError?: boolean;
  }) => { account: Account; comanda: Comanda };

  // Impresión simulada
  retryPrintComanda: (comandaId: string, simulateSuccess?: boolean) => boolean;

  // Confirmaciones exclusivas de Caja / Admin
  confirmComandaReady: (comandaId: string, role: Role) => void;
  confirmComandaDelivered: (comandaId: string, role: Role) => void;

  // Modificaciones autorizadas
  requestModification: (params: {
    comandaId: string;
    requestedBy: string;
    reason: string;
    diffItems: ModificationDiffItem[];
  }) => void;
  resolveModification: (params: {
    requestId: string;
    approved: boolean;
    authorizedBy: string;
    role: Role;
  }) => void;

  // Caja y Cobro
  canChargeAccount: (accountId: string) => { canCharge: boolean; reason?: string };
  chargeAccount: (accountId: string, method: PaymentMethod) => void;

  // Utilidades de consulta
  getAccountById: (accountId: string) => Account | undefined;
  getComandaById: (comandaId: string) => Comanda | undefined;
  getComandasByAccountId: (accountId: string) => Comanda[];
  getActiveAccountForTable: (tableId: string) => Account | undefined;

  // Restablecer demo
  resetToDemoData: () => void;
}

const PosContext = createContext<PosContextType | null>(null);

// Mesas iniciales de demostración (configuración por defecto de 5 mesas)
function getDefaultTables(): Table[] {
  return [
    { id: "mesa-1", number: 1, label: "Mesa 1", status: "libre", activeAccountId: null },
    { id: "mesa-2", number: 2, label: "Mesa 2", status: "libre", activeAccountId: null },
    { id: "mesa-3", number: 3, label: "Mesa 3", status: "libre", activeAccountId: null },
    { id: "mesa-4", number: 4, label: "Mesa 4", status: "libre", activeAccountId: null },
    { id: "mesa-5", number: 5, label: "Mesa 5", status: "libre", activeAccountId: null },
  ];
}

// Datos iniciales de demostración limpios y realistas
function getInitialData() {
  const tables = getDefaultTables();
  // Crearemos una cuenta inicial en Mesa 1 para demostración inmediata
  const table1 = tables[0];
  const accountId = "CTA-101";
  const comandaId = "COM-1001";

  const initialComanda: Comanda = {
    id: comandaId,
    accountId,
    orderNumber: 1,
    type: "mesa",
    tableLabel: "Mesa 1",
    items: [
      {
        id: "item-1",
        productId: "bf-americano",
        variantSize: "Grande",
        displayName: "Americano (Grande)",
        quantity: 1,
        unitPrice: 60,
        subtotal: 60,
        notes: "Sin azúcar",
      },
      {
        id: "item-2",
        productId: "pa-chocolatin",
        displayName: "Chocolatín",
        quantity: 1,
        unitPrice: 60,
        subtotal: 60,
      },
    ],
    operationalStatus: "enviado_preparacion",
    printStatus: "impreso",
    createdAt: "09:15",
    createdBy: "Camila",
    modificationStatus: "ninguna",
  };

  const initialAccount: Account = {
    id: accountId,
    type: "mesa",
    tableId: table1.id,
    tableLabel: table1.label,
    status: "abierta",
    comandaIds: [comandaId],
    total: 120,
    paymentStatus: "pendiente",
    openedAt: "09:15",
    waiter: "Camila",
  };

  table1.status = "ocupada";
  table1.activeAccountId = accountId;

  return {
    tables,
    accounts: [initialAccount],
    comandas: [initialComanda],
    availabilityOverrides: {},
    pendingModifications: [],
  };
}

function getSavedState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("No se pudo leer localStorage:", e);
  }
  return null;
}

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [initialState] = useState(() => {
    const saved = getSavedState();
    return saved ?? getInitialData();
  });

  const [tables, setTables] = useState<Table[]>(() => initialState.tables ?? getDefaultTables());
  const [accounts, setAccounts] = useState<Account[]>(() => initialState.accounts ?? []);
  const [comandas, setComandas] = useState<Comanda[]>(() => initialState.comandas ?? []);
  const [availabilityOverrides, setAvailabilityOverrides] = useState<Record<string, boolean>>(
    () => initialState.availabilityOverrides ?? {}
  );
  const [pendingModifications, setPendingModifications] = useState<ModificationRequest[]>(
    () => initialState.pendingModifications ?? []
  );
  const isLoaded = true;

  // Guardado automático en localStorage al cambiar el estado
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tables,
          accounts,
          comandas,
          availabilityOverrides,
          pendingModifications,
        })
      );
    } catch (e) {
      console.warn("No se pudo persistir en localStorage:", e);
    }
  }, [tables, accounts, comandas, availabilityOverrides, pendingModifications]);



  function isProductAvailable(productId: string): boolean {
    if (availabilityOverrides[productId] !== undefined) {
      return availabilityOverrides[productId];
    }
    return true;
  }

  function toggleProductAvailability(productId: string, role: Role) {
    if (role !== "admin" && role !== "caja") {
      throw new Error("El mesero no tiene permisos para modificar la disponibilidad de platillos.");
    }
    setAvailabilityOverrides((prev) => ({
      ...prev,
      [productId]: prev[productId] !== undefined ? !prev[productId] : false,
    }));
  }

  function resetToDemoData() {
    const initial = getInitialData();
    setTables(initial.tables);
    setAccounts(initial.accounts);
    setComandas(initial.comandas);
    setAvailabilityOverrides({});
    setPendingModifications([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  function getActiveAccountForTable(tableId: string): Account | undefined {
    return accounts.find(
      (a) => a.tableId === tableId && a.status === "abierta"
    );
  }

  function getAccountById(accountId: string): Account | undefined {
    return accounts.find((a) => a.id === accountId);
  }

  function getComandaById(comandaId: string): Comanda | undefined {
    return comandas.find((c) => c.id === comandaId);
  }

  function getComandasByAccountId(accountId: string): Comanda[] {
    return comandas.filter((c) => c.accountId === accountId);
  }

  /**
   * Creación de comanda y vinculación a cuenta abierta existente o apertura de nueva cuenta.
   * Regla: Una cuenta puede tener múltiples comandas, pero mantiene un solo saldo acumulado.
   * Guarda el precio de venta unitario capturado al confirmar.
   */
  function createComanda({
    type,
    tableId,
    tableLabel,
    customer,
    waiter,
    items,
    observations,
    simulatePrintError = false,
  }: {
    type: OrderType;
    tableId?: string;
    tableLabel?: string;
    customer?: string;
    waiter: string;
    items: CartItemDraft[];
    observations?: string;
    simulatePrintError?: boolean;
  }): { account: Account; comanda: Comanda } {
    if (!items || items.length === 0) {
      throw new Error("No es posible generar una comanda sin productos.");
    }

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);

    // Determinar si existe cuenta abierta para la mesa
    let targetAccount: Account | undefined;
    let assignedTableId = tableId;
    let assignedTableLabel = tableLabel;

    if (type === "mesa") {
      if (!tableId && tableLabel) {
        // Encontrar mesa por label
        const found = tables.find((t) => t.label.toLowerCase() === tableLabel.toLowerCase());
        if (found) {
          assignedTableId = found.id;
          assignedTableLabel = found.label;
        }
      }

      if (assignedTableId) {
        targetAccount = accounts.find(
          (a) => a.tableId === assignedTableId && a.status === "abierta"
        );
      }
    }

    const comandaSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

    let activeAccountId: string;
    let isNewAccount = false;
    let comandaOrderNumber = 1;

    if (targetAccount) {
      activeAccountId = targetAccount.id;
      comandaOrderNumber = targetAccount.comandaIds.length + 1;
    } else {
      isNewAccount = true;
      activeAccountId = `CTA-${100 + accounts.length + 1}`;
    }

    const comandaId = `COM-${1000 + comandas.length + 1}`;

    const comandaItems: ComandaItem[] = items.map((item, idx) => ({
      id: `${comandaId}-it-${idx + 1}`,
      productId: item.productId,
      variantSize: item.variantSize,
      displayName: item.displayName,
      quantity: item.qty,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      notes: item.notes,
    }));

    const newComanda: Comanda = {
      id: comandaId,
      accountId: activeAccountId,
      orderNumber: comandaOrderNumber,
      type,
      tableLabel: assignedTableLabel,
      customer: type === "llevar" ? (customer || "Cliente mostrador") : undefined,
      items: comandaItems,
      observations: observations?.trim() || undefined,
      operationalStatus: simulatePrintError ? "pendiente_impresion" : "enviado_preparacion",
      printStatus: simulatePrintError ? "error" : "impreso",
      printErrorReason: simulatePrintError
        ? "Error de conexión con la impresora de comandas (simulado)"
        : undefined,
      createdAt: timeStr,
      createdBy: waiter,
      modificationStatus: "ninguna",
    };

    let updatedAccount: Account;

    if (isNewAccount) {
      updatedAccount = {
        id: activeAccountId,
        type,
        tableId: assignedTableId ?? null,
        tableLabel: assignedTableLabel ?? null,
        customer: type === "llevar" ? (customer || "Cliente mostrador") : undefined,
        status: "abierta",
        comandaIds: [comandaId],
        total: comandaSubtotal,
        paymentStatus: "pendiente",
        openedAt: timeStr,
        waiter,
      };

      setAccounts((prev) => [updatedAccount, ...prev]);

      // Si es mesa, marcar la mesa como ocupada con esta cuenta activa
      if (type === "mesa" && assignedTableId) {
        setTables((prev) =>
          prev.map((t) =>
            t.id === assignedTableId
              ? { ...t, status: "ocupada", activeAccountId: activeAccountId }
              : t
          )
        );
      }
    } else {
      updatedAccount = {
        ...targetAccount!,
        comandaIds: [...targetAccount!.comandaIds, comandaId],
        total: targetAccount!.total + comandaSubtotal,
      };

      setAccounts((prev) =>
        prev.map((a) => (a.id === targetAccount!.id ? updatedAccount : a))
      );
    }

    setComandas((prev) => [newComanda, ...prev]);

    return { account: updatedAccount, comanda: newComanda };
  }

  /**
   * Reintento de impresión simulada sin duplicar la comanda.
   */
  function retryPrintComanda(comandaId: string, simulateSuccess = true): boolean {
    const target = comandas.find((c) => c.id === comandaId);
    if (!target) return false;

    if (simulateSuccess) {
      setComandas((prev) =>
        prev.map((c) =>
          c.id === comandaId
            ? {
                ...c,
                printStatus: "impreso",
                printErrorReason: undefined,
                operationalStatus: "enviado_preparacion",
              }
            : c
        )
      );
      return true;
    } else {
      setComandas((prev) =>
        prev.map((c) =>
          c.id === comandaId
            ? {
                ...c,
                printStatus: "error",
                printErrorReason: "Reintento fallido: impresora fuera de línea (simulado)",
              }
            : c
        )
      );
      return false;
    }
  }

  /**
   * Confirmación exclusiva de Caja / Admin: Listo para entrega
   */
  function confirmComandaReady(comandaId: string, role: Role) {
    if (role === "mesero") {
      throw new Error("Acción no autorizada: sólo Caja o Administrador pueden confirmar que un pedido está listo.");
    }
    const now = new Date().toTimeString().slice(0, 5);
    setComandas((prev) =>
      prev.map((c) =>
        c.id === comandaId
          ? { ...c, operationalStatus: "listo_entrega", readyAt: now }
          : c
      )
    );
  }

  /**
   * Confirmación exclusiva de Caja / Admin: Entregado al cliente
   */
  function confirmComandaDelivered(comandaId: string, role: Role) {
    if (role === "mesero") {
      throw new Error("Acción no autorizada: sólo Caja o Administrador pueden confirmar la entrega al cliente.");
    }
    const now = new Date().toTimeString().slice(0, 5);
    setComandas((prev) =>
      prev.map((c) =>
        c.id === comandaId
          ? { ...c, operationalStatus: "entregado", deliveredAt: now }
          : c
      )
    );
  }

  /**
   * Solicitud de modificación enviada por Mesero
   */
  function requestModification({
    comandaId,
    requestedBy,
    reason,
    diffItems,
  }: {
    comandaId: string;
    requestedBy: string;
    reason: string;
    diffItems: ModificationDiffItem[];
  }) {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) throw new Error("Comanda no encontrada.");

    const account = accounts.find((a) => a.id === comanda.accountId);
    if (account?.status === "cerrada" || account?.paymentStatus === "pagado") {
      throw new Error("No es posible modificar comandas de una cuenta cerrada o cobrada.");
    }

    const reqId = `MOD-${Date.now().toString().slice(-4)}`;
    const modReq: ModificationRequest = {
      id: reqId,
      comandaId,
      requestedBy,
      requestedAt: new Date().toTimeString().slice(0, 5),
      reason,
      diffItems,
      status: "pendiente",
    };

    setPendingModifications((prev) => [modReq, ...prev]);
    setComandas((prev) =>
      prev.map((c) =>
        c.id === comandaId
          ? { ...c, modificationStatus: "solicitada", modificationRequest: modReq }
          : c
      )
    );
  }

  /**
   * Resolución de modificación por Caja / Admin
   */
  function resolveModification({
    requestId,
    approved,
    authorizedBy,
    role,
  }: {
    requestId: string;
    approved: boolean;
    authorizedBy: string;
    role: Role;
  }) {
    if (role === "mesero") {
      throw new Error("Solo Caja o Administrador pueden autorizar modificaciones de comandas.");
    }

    const targetReq = pendingModifications.find((m) => m.id === requestId);
    if (!targetReq) return;

    const timeStr = new Date().toTimeString().slice(0, 5);

    setPendingModifications((prev) =>
      prev.map((m) =>
        m.id === requestId
          ? {
              ...m,
              status: approved ? "aprobada" : "rechazada",
              authorizedBy,
              authorizedAt: timeStr,
            }
          : m
      )
    );

    setComandas((prev) =>
      prev.map((c) => {
        if (c.id !== targetReq.comandaId) return c;
        if (!approved) {
          return {
            ...c,
            modificationStatus: "rechazada",
            modificationRequest: {
              ...targetReq,
              status: "rechazada",
              authorizedBy,
              authorizedAt: timeStr,
            },
          };
        }

        // Aplicar cambios autorizados
        let updatedItems = [...c.items];
        for (const diff of targetReq.diffItems) {
          if (diff.action === "quitar") {
            updatedItems = updatedItems
              .map((it) => {
                if (it.displayName === diff.name || it.productId === diff.name) {
                  const newQty = it.quantity - diff.qtyDiff;
                  return newQty > 0
                    ? { ...it, quantity: newQty, subtotal: it.unitPrice * newQty }
                    : null;
                }
                return it;
              })
              .filter(Boolean) as ComandaItem[];
          } else if (diff.action === "modificar") {
            updatedItems = updatedItems.map((it) => {
              if (it.displayName === diff.name || it.productId === diff.name) {
                return {
                  ...it,
                  notes: diff.notes ? `${it.notes ? `${it.notes}, ` : ""}${diff.notes}` : it.notes,
                };
              }
              return it;
            });
          }
        }

        return {
          ...c,
          items: updatedItems,
          modificationStatus: "aprobada",
          modificationRequest: {
            ...targetReq,
            status: "aprobada",
            authorizedBy,
            authorizedAt: timeStr,
          },
        };
      })
    );

    // Recalcular saldo total de la cuenta si fue aprobada
    if (approved) {
      setTimeout(() => {
        setAccounts((prevAccounts) => {
          return prevAccounts.map((acc) => {
            if (!acc.comandaIds.includes(targetReq.comandaId)) return acc;
            const relatedComandas = comandas.filter((c) => acc.comandaIds.includes(c.id));
            const newTotal = relatedComandas.reduce(
              (sum, c) =>
                sum +
                c.items.reduce((itemSum, item) => itemSum + item.subtotal, 0),
              0
            );
            return { ...acc, total: newTotal };
          });
        });
      }, 50);
    }
  }

  /**
   * Validación estricta de cobro en Caja:
   * Solo se cobra cuando TODAS las comandas de la cuenta están entregadas.
   */
  function canChargeAccount(accountId: string): { canCharge: boolean; reason?: string } {
    const account = accounts.find((a) => a.id === accountId);
    if (!account) return { canCharge: false, reason: "Cuenta no encontrada." };
    if (account.status === "cerrada" || account.paymentStatus === "pagado") {
      return { canCharge: false, reason: "La cuenta ya ha sido pagada y cerrada." };
    }

    const accountComandas = comandas.filter((c) => c.accountId === accountId);
    if (accountComandas.length === 0) {
      return { canCharge: false, reason: "La cuenta no tiene comandas asociadas." };
    }

    const pendingDeliveries = accountComandas.filter((c) => c.operationalStatus !== "entregado");
    if (pendingDeliveries.length > 0) {
      const pendingNames = pendingDeliveries
        .map((c) => `${c.id} (${c.operationalStatus === "pendiente_impresion" ? "Pendiente de impresión" : c.operationalStatus === "enviado_preparacion" ? "En preparación" : "Listo para entrega"})`)
        .join(", ");
      return {
        canCharge: false,
        reason: `Bloqueo de cobro: La(s) comanda(s) [${pendingNames}] aún no han sido confirmadas como entregadas al cliente. Solo se permite cobrar cuando todas las comandas están entregadas.`,
      };
    }

    return { canCharge: true };
  }

  /**
   * Cobro final de la cuenta:
   * Valida entregas, registra pago simulado, cierra cuenta y libera la mesa.
   */
  function chargeAccount(accountId: string, method: PaymentMethod) {
    const check = canChargeAccount(accountId);
    if (!check.canCharge) {
      throw new Error(check.reason);
    }

    const targetAccount = accounts.find((a) => a.id === accountId)!;
    const now = new Date().toTimeString().slice(0, 5);

    // Cerrar cuenta y marcar como pagada
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              status: "cerrada",
              paymentStatus: "pagado",
              paymentMethod: method,
              closedAt: now,
            }
          : a
      )
    );

    // Si tiene mesa asignada, liberar la mesa
    if (targetAccount.tableId) {
      setTables((prev) =>
        prev.map((t) =>
          t.id === targetAccount.tableId
            ? { ...t, status: "libre", activeAccountId: null }
            : t
        )
      );
    }
  }

  return (
    <PosContext.Provider
      value={{
        tables,
        accounts,
        comandas,
        availabilityOverrides,
        pendingModifications,
        isLoaded,
        isProductAvailable,
        toggleProductAvailability,
        createComanda,
        retryPrintComanda,
        confirmComandaReady,
        confirmComandaDelivered,
        requestModification,
        resolveModification,
        canChargeAccount,
        chargeAccount,
        getAccountById,
        getComandaById,
        getComandasByAccountId,
        getActiveAccountForTable,
        resetToDemoData,
      }}
    >
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) {
    throw new Error("usePos debe ser utilizado dentro de un <PosProvider>");
  }
  return ctx;
}
