"use client";

import { useState } from "react";
import { DELIVERY_ORDERS } from "@/lib/mock-data";
import {
  APP_LABELS,
  DELIVERY_STATUS_LABELS,
  formatMoney,
  type DeliveryApp,
  type DeliveryOrder,
  type DeliveryStatus,
} from "@/lib/types";
import { DeliveryStatusBadge, PageHeader, StatCard } from "@/components/ui";

const STATUSES = Object.keys(DELIVERY_STATUS_LABELS) as DeliveryStatus[];

const APP_STYLES: Record<DeliveryApp, string> = {
  rappi: "bg-orange-100 text-orange-700",
  didi: "bg-sky-100 text-sky-700",
};

export function DeliveryTracker() {
  const [orders, setOrders] = useState<DeliveryOrder[]>(DELIVERY_ORDERS);
  const [showForm, setShowForm] = useState(false);

  const rappi = orders.filter((o) => o.app === "rappi");
  const didi = orders.filter((o) => o.app === "didi");
  const abiertos = orders.filter(
    (o) => o.status !== "entregado" && o.status !== "incidencia"
  );

  function setStatus(id: string, status: DeliveryStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  }

  return (
    <>
      <PageHeader
        title="Delivery"
        subtitle="Registro manual de pedidos Rappi y DiDi — las cajeras capturan aquí lo que llega por las apps"
      >
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-wine px-4 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-wine-light"
        >
          + Registrar pedido
        </button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Rappi hoy"
          value={formatMoney(rappi.reduce((s, o) => s + o.total, 0))}
          hint={`${rappi.length} pedidos`}
        />
        <StatCard
          label="DiDi hoy"
          value={formatMoney(didi.reduce((s, o) => s + o.total, 0))}
          hint={`${didi.length} pedidos`}
        />
        <StatCard
          label="Abiertos"
          value={String(abiertos.length)}
          hint="Sin entregar o con seguimiento"
        />
      </div>

      {showForm && (
        <NewDeliveryForm
          onAdd={(order) => {
            setOrders((prev) => [order, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-ink/10 bg-paper">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wider text-mute">
              <th className="px-5 py-3 font-medium">App</th>
              <th className="px-5 py-3 font-medium">Pedido</th>
              <th className="px-5 py-3 font-medium">Cliente</th>
              <th className="px-5 py-3 font-medium">Detalle</th>
              <th className="px-5 py-3 font-medium">Hora</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-ink/5 last:border-0">
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${APP_STYLES[order.app]}`}
                  >
                    {APP_LABELS[order.app]}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium">{order.externalId}</td>
                <td className="px-5 py-3">{order.customer}</td>
                <td className="max-w-56 truncate px-5 py-3 text-mute">
                  {order.summary}
                </td>
                <td className="px-5 py-3">{order.receivedAt}</td>
                <td className="px-5 py-3 text-right font-medium">
                  {formatMoney(order.total)}
                </td>
                <td className="px-5 py-3">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      setStatus(order.id, e.target.value as DeliveryStatus)
                    }
                    className="rounded-lg border border-ink/15 bg-cream px-2 py-1.5 text-xs font-medium outline-none focus:border-wine"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {DELIVERY_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-mute">
        <DeliveryStatusBadge status="incidencia" />
        Marca incidencia cuando la app y el pedido real no coinciden — queda en
        el historial para revisar al cierre.
      </p>
    </>
  );
}

function NewDeliveryForm({ onAdd }: { onAdd: (o: DeliveryOrder) => void }) {
  const [app, setApp] = useState<DeliveryApp>("rappi");
  const [externalId, setExternalId] = useState("");
  const [customer, setCustomer] = useState("");
  const [summary, setSummary] = useState("");
  const [total, setTotal] = useState("");

  function submit() {
    if (!externalId || !total) return;
    onAdd({
      id: `D-${203 + Math.floor(Math.random() * 50)}`,
      app,
      externalId,
      customer: customer || "—",
      summary: summary || "—",
      total: Number(total),
      status: "nuevo",
      receivedAt: new Date().toTimeString().slice(0, 5),
    });
  }

  return (
    <div className="mb-6 rounded-xl border border-wine/20 bg-paper p-5">
      <h2 className="font-display text-lg font-semibold">
        Registrar pedido de app
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select
          value={app}
          onChange={(e) => setApp(e.target.value as DeliveryApp)}
          className="rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-wine"
        >
          <option value="rappi">Rappi</option>
          <option value="didi">DiDi Food</option>
        </select>
        <input
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          placeholder="Nº de pedido en la app"
          className="rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-wine"
        />
        <input
          value={customer}
          onChange={(e) => setCustomer(e.target.value)}
          placeholder="Cliente"
          className="rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-wine"
        />
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Detalle (ej. 2× latte)"
          className="rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-wine"
        />
        <div className="flex gap-2">
          <input
            value={total}
            onChange={(e) => setTotal(e.target.value.replace(/\D/g, ""))}
            placeholder="Total $"
            className="w-full rounded-lg border border-ink/15 bg-cream px-3 py-2.5 text-sm outline-none focus:border-wine"
          />
          <button
            onClick={submit}
            className="shrink-0 rounded-lg bg-wine px-4 py-2.5 text-sm font-medium text-cream hover:bg-wine-light"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
