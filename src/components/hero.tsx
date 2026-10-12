export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--color-latte),transparent_60%),radial-gradient(ellipse_at_bottom_left,var(--color-sand),transparent_50%)]"
      />
      <div className="mx-auto max-w-5xl px-6 pt-24 pb-16 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-caramel">
          Café de especialidad
        </p>
        <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Un buen café
          <br />
          <span className="italic text-caramel">cambia el día</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-mocha">
          En Carlota Cafetería tostamos, preparamos y servimos cada taza con
          cariño. Acompáñala de nuestra repostería artesanal hecha cada mañana.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#menu"
            className="w-full rounded-full bg-espresso px-8 py-3 text-base font-medium text-cream transition-colors hover:bg-caramel-dark sm:w-auto"
          >
            Ver el menú
          </a>
          <a
            href="#nosotros"
            className="w-full rounded-full border border-espresso/20 px-8 py-3 text-base font-medium transition-colors hover:border-caramel hover:text-caramel sm:w-auto"
          >
            Nuestra historia
          </a>
        </div>
      </div>
    </section>
  );
}
