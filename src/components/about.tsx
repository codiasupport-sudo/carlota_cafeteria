const values = [
  {
    title: "Origen",
    description:
      "Trabajamos directamente con pequeños productores y tostamos en lotes pequeños para resaltar cada origen.",
  },
  {
    title: "Artesanía",
    description:
      "Cada bebida y cada pieza de repostería se prepara a mano, con ingredientes locales y de temporada.",
  },
  {
    title: "Comunidad",
    description:
      "Un espacio abierto para quedarse: trabajar, leer, conversar o simplemente disfrutar el momento.",
  },
];

export function About() {
  return (
    <section id="nosotros" className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-caramel">
              Nosotros
            </p>
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              La historia detrás de cada taza
            </h2>
            <p className="mt-6 text-lg leading-8 text-mocha">
              Carlota Cafetería nació de la cocina de nuestra abuela Carlota,
              donde el café siempre estaba recién hecho y la mesa siempre tenía
              un lugar más. Hoy honramos esa tradición: café de especialidad,
              repostería artesanal y hospitalidad sin prisas.
            </p>
          </div>
          <ul className="space-y-8">
            {values.map((value) => (
              <li key={value.title} className="border-l-2 border-caramel pl-6">
                <h3 className="font-display text-xl font-semibold">
                  {value.title}
                </h3>
                <p className="mt-2 leading-7 text-mocha">{value.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
