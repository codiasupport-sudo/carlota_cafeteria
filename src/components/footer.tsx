export async function Footer() {
  "use cache";

  return (
    <footer className="bg-espresso border-t border-cream/10 py-8 text-cream/60">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 text-sm sm:flex-row">
        <p className="font-display text-base font-semibold text-cream">
          Carlota <span className="text-caramel">Cafetería</span>
        </p>
        <p>
          © {new Date().getFullYear()} Carlota Cafetería. Hecho con café.
        </p>
      </div>
    </footer>
  );
}
