const links = [
  { href: "#menu", label: "Menú" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#visitanos", label: "Visítanos" },
];

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-espresso/10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <a href="#" className="font-display text-xl font-semibold tracking-tight">
          Carlota <span className="text-caramel">Cafetería</span>
        </a>
        <ul className="flex items-center gap-6 text-sm font-medium">
          {links.map((link) => (
            <li key={link.href} className="hidden sm:block">
              <a
                href={link.href}
                className="text-coffee transition-colors hover:text-caramel"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#visitanos"
              className="rounded-full bg-espresso px-4 py-2 text-cream transition-colors hover:bg-caramel-dark"
            >
              Encuéntranos
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
