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
 * Estados de pedido actuales del prototipo (Fase 1).
 * 
 * NOTA ARQUITECTÓNICA PARA FASE 2:
 * Actualmente OrderStatus mezcla el estado operativo de preparación y entrega
 * con el estado financiero ("pagado").
 * En la Fase 2 esto se desacoplará formalmente en:
 * 1. OperationalStatus: "pendiente" | "preparando" | "listo" | "entregado" | "cancelado"
 * 2. PaymentStatus: "pendiente" | "pagado" | "anulado"
 * Esto permitirá que una orden pueda estar "entregada" pero pendiente de pago,
 * o "pagada" de inmediato en mostrador mientras continúa "en preparación".
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

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  /** Costo de elaboración */
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

export function formatMoney(value: number): string {
  return `$${value.toLocaleString("es-CO")}`;
}
