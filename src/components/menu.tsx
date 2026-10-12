type MenuItem = {
  name: string;
  description: string;
  price: string;
};

type MenuCategory = {
  title: string;
  items: MenuItem[];
};

const categories: MenuCategory[] = [
  {
    title: "Café",
    items: [
      {
        name: "Espresso",
        description: "Doble shot de nuestro blend de la casa",
        price: "$2.50",
      },
      {
        name: "Cortado",
        description: "Espresso con un toque de leche vaporizada",
        price: "$3.00",
      },
      {
        name: "Flat white",
        description: "Doble ristretto con microespuma de leche",
        price: "$3.80",
      },
      {
        name: "V60 filtrado",
        description: "Origen único de temporada, preparado al momento",
        price: "$4.00",
      },
    ],
  },
  {
    title: "Repostería",
    items: [
      {
        name: "Croissant de mantequilla",
        description: "Hojaldre artesanal horneado cada mañana",
        price: "$3.20",
      },
      {
        name: "Rol de canela",
        description: "Con glaseado de queso crema y canela de Ceylán",
        price: "$3.80",
      },
      {
        name: "Banana bread",
        description: "Receta de la abuela Carlota, con nuez",
        price: "$3.50",
      },
      {
        name: "Galleta de chocolate",
        description: "Chocolate 70% y flor de sal",
        price: "$2.80",
      },
    ],
  },
  {
    title: "Brunch",
    items: [
      {
        name: "Tostada de aguacate",
        description: "Pan de masa madre, aguacate, huevo poché",
        price: "$7.50",
      },
      {
        name: "Bowl de yogur",
        description: "Granola casera, fruta de temporada y miel",
        price: "$6.00",
      },
      {
        name: "Sándwich de jamón y queso",
        description: "Pan brioche, jamón serrano, queso brie",
        price: "$8.00",
      },
      {
        name: "Chilaquiles Carlota",
        description: "Salsa verde, crema, queso fresco y aguacate",
        price: "$8.50",
      },
    ],
  },
];

export function Menu() {
  return (
    <section id="menu" className="bg-latte/60 py-24">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-caramel">
            Nuestro menú
          </p>
          <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Hecho en casa, todos los días
          </h2>
        </div>
        <div className="grid gap-12 md:grid-cols-3">
          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="mb-6 border-b border-espresso/15 pb-3 font-display text-2xl font-semibold text-caramel-dark">
                {category.title}
              </h3>
              <ul className="space-y-5">
                {category.items.map((item) => (
                  <li key={item.name}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium">{item.name}</span>
                      <span className="shrink-0 text-sm font-medium text-caramel">
                        {item.price}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-mocha">
                      {item.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
