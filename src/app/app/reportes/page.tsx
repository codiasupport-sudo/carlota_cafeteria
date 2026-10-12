import {
  DELIVERY_ORDERS,
  MENU_ITEMS,
  ORDERS,
} from "@/lib/mock-data";
import {
  formatMoney,
  orderTotal,
  ORDER_TYPE_LABELS,
  PAYMENT_LABELS,
  type OrderType,
  type PaymentMethod,
} from "@/lib/types";
import { PageHeader, StatCard } from "@/components/ui";

export default function ReportesPage() {
  const cobrados = ORDERS.filter((o) => o.status === "pagado");

  const porCanal = (Object.keys(ORDER_TYPE_LABELS) as OrderType[]).map((t) => ({
    canal: ORDER_TYPE_LABELS[t],
    total: cobrados
      .filter((o) => o.type === t)
      .reduce((s, o) => s + orderTotal(o), 0),
  }));

  const porMetodo = (Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map(
    (m) => ({
      metodo: PAYMENT_LABELS[m],
      total: cobrados
        .filter((o) => o.paymentMethod === m)
        .reduce((s, o) => s + orderTotal(o), 0),
    })
  );

  const ventasDelivery = DELIVERY_ORDERS.reduce((s, o) => s + o.total, 0);

  const conteo = new Map<string, number>();
  for (const o of ORDERS)
    for (const i of o.items)
      conteo.set(i.name, (conteo.get(i.name) ?? 0) + i.qty);
  const top = [...conteo.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const maxCanal = Math.max(...porCanal.map((c) => c.total), 1);
  const maxTop = top[0]?.[1] ?? 1;

  return (
    <>
      <PageHeader title="Reportes" subtitle="Corte del día y ventas por canal" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ventas del local"
          value={formatMoney(cobrados.reduce((s, o) => s + orderTotal(o), 0))}
        />
        <StatCard
          label="Ventas delivery"
          value={formatMoney(ventasDelivery)}
          hint="Registradas de Rappi + DiDi"
        />
        <StatCard
          label="Platillos en menú"
          value={String(MENU_ITEMS.length)}
          hint={`${MENU_ITEMS.filter((m) => m.available).length} disponibles`}
        />
        <StatCard
          label="Ticket promedio"
          value={formatMoney(
            cobrados.length
              ? Math.round(
                  cobrados.reduce((s, o) => s + orderTotal(o), 0) /
                    cobrados.length
                )
              : 0
          )}
        />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-ink/10 bg-paper p-5">
          <h2 className="font-display text-lg font-semibold">
            Ventas por canal
          </h2>
          <ul className="mt-4 space-y-3">
            {porCanal.map((c) => (
              <li key={c.canal}>
                <div className="flex justify-between text-sm">
                  <span>{c.canal}</span>
                  <span className="font-medium">{formatMoney(c.total)}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-cream">
                  <div
                    className="h-2 rounded-full bg-wine"
                    style={{ width: `${(c.total / maxCanal) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-ink/10 bg-paper p-5">
          <h2 className="font-display text-lg font-semibold">
            Cobros por método
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {porMetodo.map((m) => (
              <li key={m.metodo} className="flex justify-between">
                <span className="text-mute">{m.metodo}</span>
                <span className="font-medium">{formatMoney(m.total)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-ink/10 bg-paper p-5">
          <h2 className="font-display text-lg font-semibold">Más vendidos</h2>
          <ul className="mt-4 space-y-3">
            {top.map(([name, qty]) => (
              <li key={name}>
                <div className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-medium">{qty}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-cream">
                  <div
                    className="h-2 rounded-full bg-gold"
                    style={{ width: `${(qty / maxTop) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
