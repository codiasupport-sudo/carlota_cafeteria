import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import {
  DELIVERY_ORDERS,
  INVENTORY,
  ORDERS,
} from "@/lib/mock-data";
import {
  formatMoney,
  orderTotal,
  ORDER_TYPE_LABELS,
  ROLE_LABELS,
  type Role,
} from "@/lib/types";
import { OrderStatusBadge, PageHeader, StatCard } from "@/components/ui";

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-40" />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const store = await cookies();
  const role = (store.get("carlota-role")?.value ?? "mesero") as Role;
  const user = decodeURIComponent(store.get("carlota-user")?.value ?? "");

  const ventasHoy = ORDERS.filter((o) => o.status === "pagado").reduce(
    (sum, o) => sum + orderTotal(o),
    0
  );
  const activos = ORDERS.filter(
    (o) => o.status !== "pagado" && o.status !== "entregado"
  ).length;
  const deliveryPendientes = DELIVERY_ORDERS.filter(
    (d) => d.status === "nuevo" || d.status === "confirmado"
  ).length;
  const alertasStock = INVENTORY.filter((i) => i.stock <= i.min).length;

  const recientes = [...ORDERS].slice(-5).reverse();

  return (
    <>
      <PageHeader
        title={`Hola, ${user}`}
        subtitle={`${ROLE_LABELS[role]} · Resumen de hoy`}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ventas cobradas" value={formatMoney(ventasHoy)} />
        <StatCard
          label="Pedidos activos"
          value={String(activos)}
          hint="Pendientes + en preparación + listos"
        />
        <StatCard
          label="Delivery por gestionar"
          value={String(deliveryPendientes)}
          hint="Rappi y DiDi sin cerrar"
        />
        <StatCard
          label="Alertas de inventario"
          value={String(alertasStock)}
          hint="Insumos en o bajo el mínimo"
        />
      </div>

      <div className="mt-8 rounded-xl border border-ink/10 bg-paper">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="font-display text-lg font-semibold">
            Pedidos recientes
          </h2>
          <Link
            href="/app/pedidos"
            className="text-sm font-medium text-wine hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-mute">
              <th className="px-5 py-3 font-medium">Pedido</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Mesero</th>
              <th className="px-5 py-3 font-medium">Hora</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {recientes.map((order) => (
              <tr key={order.id} className="border-b border-ink/5 last:border-0">
                <td className="px-5 py-3 font-medium">{order.id}</td>
                <td className="px-5 py-3">
                  {ORDER_TYPE_LABELS[order.type]}
                  {order.table ? ` · ${order.table}` : ""}
                </td>
                <td className="px-5 py-3">{order.waiter}</td>
                <td className="px-5 py-3">{order.createdAt}</td>
                <td className="px-5 py-3 text-right font-medium">
                  {formatMoney(orderTotal(order))}
                </td>
                <td className="px-5 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
