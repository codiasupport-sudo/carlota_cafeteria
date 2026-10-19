export type Role = "admin" | "caja" | "mesero";

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  caja: "Caja",
  mesero: "Mesero",
};

export type OrderType = "mesa" | "llevar" | "delivery";

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  mesa: "Mesa",
  llevar: "Para llevar",
  delivery: "Delivery",
};

/**
 * Estados operativos oficiales (Fase 2) desacoplados del estado financiero.
 */
export type OperationalStatus =
  | "pendiente_impresion"
  | "enviado_preparacion"
  | "listo_entrega"
  | "entregado";

export const OPERATIONAL_STATUS_LABELS: Record<OperationalStatus, string> = {
  pendiente_impresion: "Pendiente de impresión",
  enviado_preparacion: "Enviado a preparación",
  listo_entrega: "Listo para entrega",
  entregado: "Entregado al cliente",
};

export type PrintStatus = "pendiente" | "impreso" | "error";

export const PRINT_STATUS_LABELS: Record<PrintStatus, string> = {
  pendiente: "Pendiente",
  impreso: "Impreso (simulado)",
  error: "Error de impresión",
};

/**
 * Estado financiero de una cuenta
 */
export type PaymentStatus = "pendiente" | "pagado";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendiente: "Pendiente de cobro",
  pagado: "Pagado y cerrado",
};

export type PaymentMethod = "efectivo" | "tarjeta" | "transferencia";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

export type DeliveryApp = "rappi" | "didi";

export const APP_LABELS: Record<DeliveryApp, string> = {
  rappi: "Rappi",
  didi: "DiDi Food",
};

export type DeliveryStatus =
  | "nuevo"
  | "confirmado"
  | "en_camino"
  | "entregado"
  | "incidencia";

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  en_camino: "En camino",
  entregado: "Entregado",
  incidencia: "Incidencia",
};

/**
 * ENTIDADES PRINCIPALES FASE 2
 */

export interface Table {
  id: string; // ej. "mesa-1"
  number: number; // 1, 2, 3, 4, 5...
  label: string; // "Mesa 1"
  status: "libre" | "ocupada";
  activeAccountId?: string | null;
}

export interface ComandaItem {
  id: string;
  productId: string;
  variantId?: string;
  variantSize?: string;
  displayName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface ModificationDiffItem {
  action: "agregar" | "quitar" | "modificar";
  name: string;
  qtyDiff: number;
  notes?: string;
}

export interface ModificationRequest {
  id: string;
  comandaId: string;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  diffItems: ModificationDiffItem[];
  status: "pendiente" | "aprobada" | "rechazada";
  authorizedBy?: string;
  authorizedAt?: string;
}

export interface Comanda {
  id: string; // ej. "COM-1001"
  accountId: string; // ej. "CTA-101"
  orderNumber: number; // 1, 2, 3...
  type: OrderType;
  tableLabel?: string;
  customer?: string;
  items: ComandaItem[];
  observations?: string;
  operationalStatus: OperationalStatus;
  printStatus: PrintStatus;
  printErrorReason?: string;
  createdAt: string;
  createdBy: string;
  readyAt?: string;
  deliveredAt?: string;
  modificationStatus?: "ninguna" | "solicitada" | "aprobada" | "rechazada";
  modificationRequest?: ModificationRequest;
}

export interface Account {
  id: string; // ej. "CTA-101"
  type: OrderType;
  tableId?: string | null;
  tableLabel?: string | null;
  customer?: string;
  status: "abierta" | "cerrada";
  comandaIds: string[];
  total: number; // Acumulado de todas sus comandas
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  openedAt: string;
  closedAt?: string;
  waiter: string;
}

/**
 * TIPOS Y HELPERS DE COMPATIBILIDAD CON VISTAS ANTERIORES
 */
export type OrderStatus =
  | "pendiente"
  | "preparando"
  | "listo"
  | "entregado"
  | "pagado";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pendiente: "Pendiente",
  preparando: "En preparación",
  listo: "Listo para entrega",
  entregado: "Entregado a mesa / cliente",
  pagado: "Cobrado en caja",
};

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  available: boolean;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  notes?: string;
}

export interface Order {
  id: string;
  type: OrderType;
  table?: string;
  customer?: string;
  items: OrderItem[];
  status: OrderStatus;
  waiter: string;
  createdAt: string;
  paymentMethod?: PaymentMethod;
}

export interface DeliveryOrder {
  id: string;
  app: DeliveryApp;
  externalId: string;
  customer: string;
  summary: string;
  total: number;
  status: DeliveryStatus;
  receivedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  min: number;
}

export interface StaffUser {
  name: string;
  role: Role;
}

export function orderTotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

/**
 * Formateador de moneda en pesos mexicanos (MXN) con es-MX.
 * Ejemplo de salida: "$260.00"
 */
const mxnFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number): string {
  return mxnFormatter.format(value);
}
