import type { OrderStatus, DeliveryStatus } from "@/lib/types";
import { ORDER_STATUS_LABELS, DELIVERY_STATUS_LABELS } from "@/lib/types";

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-mute">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-paper p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-mute">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  preparando: "bg-blue-100 text-blue-800",
  listo: "bg-emerald-100 text-emerald-800",
  entregado: "bg-zinc-200 text-zinc-700",
  pagado: "bg-wine/10 text-wine",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${ORDER_STATUS_STYLES[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

const DELIVERY_STATUS_STYLES: Record<DeliveryStatus, string> = {
  nuevo: "bg-amber-100 text-amber-800",
  confirmado: "bg-blue-100 text-blue-800",
  en_camino: "bg-violet-100 text-violet-800",
  entregado: "bg-emerald-100 text-emerald-800",
  incidencia: "bg-red-100 text-red-700",
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${DELIVERY_STATUS_STYLES[status]}`}
    >
      {DELIVERY_STATUS_LABELS[status]}
    </span>
  );
}
