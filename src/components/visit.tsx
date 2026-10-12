const schedule = [
  { days: "Lunes a viernes", hours: "7:00 — 19:00" },
  { days: "Sábado", hours: "8:00 — 20:00" },
  { days: "Domingo", hours: "8:00 — 15:00" },
];

export function Visit() {
  return (
    <section id="visitanos" className="bg-espresso py-24 text-cream">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-caramel">
              Visítanos
            </p>
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Te esperamos con el café listo
            </h2>
            <address className="mt-8 space-y-3 text-lg not-italic leading-8 text-cream/80">
              <p>Calle de los Aromas 123</p>
              <p>Colonia Centro</p>
              <p>
                <a
                  href="tel:+15551234567"
                  className="transition-colors hover:text-caramel"
                >
                  +1 (555) 123-4567
                </a>
              </p>
              <p>
                <a
                  href="mailto:hola@carlotacafeteria.com"
                  className="transition-colors hover:text-caramel"
                >
                  hola@carlotacafeteria.com
                </a>
              </p>
            </address>
          </div>
          <div>
            <h3 className="font-display text-2xl font-semibold">Horario</h3>
            <ul className="mt-6 divide-y divide-cream/15">
              {schedule.map((row) => (
                <li
                  key={row.days}
                  className="flex items-center justify-between py-4"
                >
                  <span className="text-cream/80">{row.days}</span>
                  <span className="font-medium">{row.hours}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm leading-6 text-cream/60">
              Wi-Fi gratuito · Pet friendly en terraza · Para llevar disponible
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
