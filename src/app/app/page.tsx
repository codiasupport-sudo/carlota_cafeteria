import { Suspense } from "react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
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

  // El mesero no requiere dashboard financiero ni administrativo; inicia directamente en Pedidos
  if (role === "mesero") {
    redirect("/app/pedidos");
  }

  const pedidosPorCobrar = ORDERS.filter((o) => o.status === "listo");
  const pedidosCobrados = ORDERS.filter((o) => o.status === "pagado");
  const totalCobrado = pedidosCobrados.reduce(
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

  const recientes = [...ORDERS].slice(-6).reverse();

  return (
    <>
      <PageHeader
        title={`Hola, ${user}`}
        subtitle={`${ROLE_LABELS[role]} · ${role === "caja" ? "Panel de control de caja" : "Visión general del negocio"}`}
      >
        {role === "caja" && (
          <Link
            href="/app/caja"
            className="flex min-h-[44px] items-center rounded-xl bg-wine px-4 py-2.5 text-sm font-semibold text-cream shadow-xs transition-colors hover:bg-wine-light active:scale-95"
          >
            Ir a cobrar ($)
          </Link>
        )}
      </PageHeader>

      {/* Aviso de datos demostrativos para evitar confusiones financieras */}
      <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/80 px-4 py-3 text-xs text-amber-900">
        <p className="font-semibold">Entorno de prototipo funcional (Fase 1)</p>
        <p className="mt-0.5 text-amber-800/90">
          Los montos y registros mostrados son datos demostrativos simulados para validación de flujos. No representan estados de cuenta contables reales.
        </p>
      </div>

      {role === "admin" ? (
        // Visión general para Administrador
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Ventas registradas hoy"
            value={formatMoney(totalCobrado)}
            hint="Suma de pedidos pagados (demostración)"
          />
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
      ) : (
        // Visión operativa para Caja
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pedidos por cobrar"
            value={String(pedidosPorCobrar.length)}
            hint="Listos en salón y mostrador"
          />
          <StatCard
            label="Cobrados en turno"
            value={String(pedidosCobrados.length)}
            hint="Comprobantes emitidos"
          />
          <StatCard
            label="Corte parcial"
            value={formatMoney(totalCobrado)}
            hint="Total cobrado en caja hoy"
          />
          <StatCard
            label="Delivery por gestionar"
            value={String(deliveryPendientes)}
            hint="Pedidos de apps externos"
          />
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-ink/10 bg-paper overflow-hidden shadow-xs">
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">
              {role === "caja" ? "Últimos pedidos del turno" : "Pedidos recientes"}
            </h2>
            <p className="text-xs text-mute">
              {role === "caja" ? "Consulta rápida de estado y totales" : "Actividad reciente del salón y mostrador"}
            </p>
          </div>
          <Link
            href="/app/pedidos"
            className="flex min-h-[36px] items-center text-sm font-semibold text-wine hover:underline"
          >
            Ver todos los pedidos →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-mute bg-cream/40">
                <th className="px-5 py-3 font-medium">Pedido</th>
                <th className="px-5 py-3 font-medium">Tipo</th>
                <th className="px-5 py-3 font-medium">Mesero</th>
                <th className="px-5 py-3 font-medium">Hora</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Estado</th>
                {role === "caja" && <th className="px-5 py-3 text-right font-medium">Acción</th>}
              </tr>
            </thead>
            <tbody>
              {recientes.map((order) => (
                <tr key={order.id} className="border-b border-ink/5 last:border-0 hover:bg-cream/20">
                  <td className="px-5 py-3.5 font-semibold text-ink">{order.id}</td>
                  <td className="px-5 py-3.5">
                    {ORDER_TYPE_LABELS[order.type]}
                    {order.table ? ` · ${order.table}` : ""}
                  </td>
                  <td className="px-5 py-3.5 text-mute">{order.waiter}</td>
                  <td className="px-5 py-3.5 text-mute">{order.createdAt}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-ink">
                    {formatMoney(orderTotal(order))}
                  </td>
                  <td className="px-5 py-3.5">
                    <OrderStatusBadge status={order.status} />
                  </td>
                  {role === "caja" && (
                    <td className="px-5 py-3.5 text-right">
                      {order.status === "listo" ? (
                        <Link
                          href="/app/caja"
                          className="inline-block rounded-lg bg-wine px-3 py-1.5 text-xs font-medium text-cream hover:bg-wine-light"
                        >
                          Cobrar
                        </Link>
                      ) : (
                        <span className="text-xs text-mute">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
