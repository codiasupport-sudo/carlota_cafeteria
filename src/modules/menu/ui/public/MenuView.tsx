"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SINGLE_PRICE_KEY,
  TAG_LABELS,
  centsToDecimal,
  formatPrice,
  productMatches,
  toCents,
  type Category,
  type Product,
} from "../../domain/catalog";
import { decorationFor, groupCategories } from "./decorations";

const sectionId = (id: string) => `cat-${id}`;
const STICKY_OFFSET = 76; // alto de la barra fija + aire

function Star({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={`inline-block shrink-0 fill-white ${className}`}>
      <path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.3l7.1-.7L12 2z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2.4" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

/** Columnas de precio de una categoría: sus tamaños, o una sola columna sin encabezado. */
function priceColumns(category: Category) {
  return category.sizes.length > 0
    ? category.sizes.map((s) => ({ key: s.key, label: s.label }))
    : [{ key: SINGLE_PRICE_KEY, label: "Precio" }];
}

function gridTemplate(columnCount: number) {
  return { gridTemplateColumns: `minmax(0,1fr) repeat(${columnCount}, 4.25rem)` };
}

function lowestPrice(product: Product): string | null {
  const cents = Object.values(product.prices)
    .map((p) => toCents(p))
    .filter((c): c is number => c !== null);
  return cents.length ? formatPrice(centsToDecimal(Math.min(...cents))) : null;
}

function ProductRow({ product, columns }: { product: Product; columns: { key: string; label: string }[] }) {
  return (
    <li
      className={`grid items-start gap-x-2 py-3 ${product.available ? "" : "opacity-45"}`}
      style={gridTemplate(columns.length)}
      data-testid="product"
      data-available={product.available}
    >
      <div className="min-w-0">
        <p className="break-words text-[15px] font-medium leading-snug">{product.name}</p>
        {product.description && <p className="mt-0.5 break-words text-[13px] leading-snug opacity-85">{product.description}</p>}
        {(product.tags.length > 0 || !product.available) && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {!product.available && (
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-carlota-wine">Agotado</span>
            )}
            {product.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-carlota-wine">
                {TAG_LABELS[tag]}
              </span>
            ))}
          </div>
        )}
      </div>
      {columns.map((col) => {
        const price = product.prices[col.key];
        // Sin precio en ese tamaño: el espacio queda vacío, igual que en el menú impreso.
        return (
          <span key={col.key} className="text-right text-[15px] font-medium tabular" data-price={col.key}>
            {price !== undefined && (
              <>
                {columns.length > 1 && <span className="sr-only">{col.label}: </span>}
                {formatPrice(price)}
              </>
            )}
          </span>
        );
      })}
    </li>
  );
}

function CategorySection({ category, products }: { category: Category; products: Product[] }) {
  const columns = priceColumns(category);
  const showSizes = category.sizes.length > 0;
  const deco = decorationFor(category.name);

  return (
    <section
      id={sectionId(category.id)}
      data-category={category.id}
      className="px-4 pb-8 pt-6"
      style={{ scrollMarginTop: STICKY_OFFSET }}
      aria-labelledby={`h-${category.id}`}
    >
      <div
        className="relative min-h-[3rem]"
        style={deco ? { paddingRight: deco.width * 0.75, minHeight: deco.width * 0.8 } : undefined}
      >
        <h2 id={`h-${category.id}`} className="font-script text-[32px] leading-[1.15]">
          {category.name}
        </h2>
        {category.subtitle && (
          <p className="mt-0.5 flex items-center gap-1.5 text-base font-bold">
            <Star />
            {category.subtitle}
          </p>
        )}
        {deco && (
          <Image
            src={deco.src}
            alt=""
            aria-hidden
            width={deco.width}
            height={deco.width}
            unoptimized
            loading="lazy"
            className="pointer-events-none absolute -top-1 right-0 h-auto drop-shadow-[0_4px_6px_rgba(0,0,0,.25)]"
            style={{ width: deco.width, transform: `rotate(${deco.rotate}deg)` }}
          />
        )}
      </div>

      <div className="mt-3 rounded-card border border-carlota-line bg-carlota-card px-3">
        {showSizes && (
          <div className="grid gap-x-2 border-b border-carlota-line pb-2 pt-3" style={gridTemplate(columns.length)}>
            <span />
            {category.sizes.map((s) => (
              <div key={s.id} className="text-right leading-tight">
                <p className="text-[13px] font-bold">{s.label}</p>
                {s.detail && <p className="text-[10px] opacity-85">({s.detail})</p>}
              </div>
            ))}
          </div>
        )}
        <ul className="divide-y divide-white/15">
          {products.map((p) => (
            <ProductRow key={p.id} product={p} columns={columns} />
          ))}
        </ul>
      </div>
      {category.note && <p className="mt-3 text-center text-[13px] italic opacity-90">{category.note}</p>}
    </section>
  );
}

/** "Los más pedidos": productos marcados como Recomendado, en tarjetas deslizables. */
function Favorites({ items, onPick }: { items: { category: Category; product: Product }[]; onPick: (categoryId: string) => void }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="fav-title" className="pt-6">
      <h2 id="fav-title" className="flex items-center gap-2 px-4 font-script text-[30px] leading-tight">
        Los más pedidos <Star className="h-5 w-5" />
      </h2>
      <ul className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1">
        {items.map(({ category, product }) => (
          <li key={product.id} className="snap-start">
            <button
              type="button"
              onClick={() => onPick(category.id)}
              className="flex h-full min-h-[44px] w-[152px] flex-col rounded-card bg-white p-3 text-left text-carlota-wine shadow-md"
              data-testid="favorite"
            >
              <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">{category.name}</span>
              <span className="mt-1 text-[15px] font-bold leading-snug">{product.name}</span>
              <span className="mt-auto pt-2 text-[13px] font-medium tabular">
                {lowestPrice(product) && `Desde ${lowestPrice(product)}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategorySheet({
  categories,
  active,
  onPick,
  onClose,
}: {
  categories: Category[];
  active: string;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const groups = useMemo(() => groupCategories(categories), [categories]);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55" onClick={onClose} data-testid="category-sheet">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Categorías del menú"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-carlota-wine px-4 pb-8 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-script text-[28px]">Categorías</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-full border border-carlota-line px-4 text-sm font-bold"
          >
            Cerrar
          </button>
        </div>
        {groups.map((group) => (
          <div key={group.title} className="mt-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest opacity-80">{group.title}</p>
            <div className="grid grid-cols-2 gap-2">
              {group.items.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onPick(c.id)}
                  className={`min-h-[52px] rounded-card border px-3 py-2 text-left text-sm font-medium leading-snug ${
                    c.id === active ? "border-white bg-white text-carlota-wine" : "border-carlota-line"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MenuView({ categories }: { categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(categories[0]?.id ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(0);

  const searching = query.trim().length > 0;

  const visible = useMemo(
    () =>
      categories
        .map((c) => ({ category: c, products: c.products.filter((p) => productMatches(p, query)) }))
        .filter((entry) => entry.products.length > 0),
    [categories, query],
  );

  const favorites = useMemo(
    () =>
      categories.flatMap((category) =>
        category.products.filter((p) => p.available && p.tags.includes("recomendado")).map((product) => ({ category, product })),
      ),
    [categories],
  );

  const resultCount = useMemo(() => visible.reduce((n, v) => n + v.products.length, 0), [visible]);

  // Scroll-spy: resalta la categoría que cruza la franja bajo la barra fija.
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-category]"));
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockRef.current) return;
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive((hit.target as HTMLElement).dataset.category ?? "");
      },
      { rootMargin: `-${STICKY_OFFSET}px 0px -70% 0px` },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [visible]);

  // Mantiene el chip activo a la vista dentro de la barra horizontal.
  useEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector<HTMLElement>(`[data-chip="${active}"]`);
    if (!nav || !chip) return;
    nav.scrollTo({ left: chip.offsetLeft - nav.clientWidth / 2 + chip.clientWidth / 2, behavior: "smooth" });
  }, [active]);

  const goTo = useCallback((id: string) => {
    setSheetOpen(false);
    setQuery("");
    lockRef.current = Date.now() + 1000;
    setActive(id);
    // Espera a que desaparezca el filtro (si lo había) antes de desplazar.
    window.setTimeout(
      () => document.getElementById(sectionId(id))?.scrollIntoView({ behavior: "smooth", block: "start" }),
      60,
    );
  }, []);

  return (
    <>
      <div className="sticky top-0 z-30 bg-carlota-wine shadow-md">
        <div className="flex items-center gap-2 py-2 pl-4">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex min-h-[48px] shrink-0 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-carlota-wine"
            aria-haspopup="dialog"
          >
            <GridIcon />
            Categorías
          </button>
          <div className="relative min-w-0 flex-1">
            <div ref={navRef} role="tablist" aria-label="Categorías" className="no-scrollbar flex gap-2 overflow-x-auto pr-8">
              {visible.map(({ category }) => {
                const isActive = category.id === active;
                return (
                  <button
                    key={category.id}
                    data-chip={category.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => goTo(category.id)}
                    className={`min-h-[48px] shrink-0 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors ${
                      isActive ? "border-white bg-white text-carlota-wine" : "border-carlota-line text-white"
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-carlota-wine to-transparent" />
          </div>
        </div>
      </div>

      <div className="px-4 pt-5">
        <label htmlFor="search" className="mb-2 block text-base font-bold">
          ¿Qué se te antoja?
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-carlota-wine">
            <SearchIcon />
          </span>
          <input
            id="search"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            placeholder="Busca café, frappé, pan…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-14 w-full rounded-full border-2 border-white bg-white pl-12 pr-12 text-base font-medium text-carlota-wine shadow-md outline-none placeholder:text-carlota-wine/60 focus:ring-4 focus:ring-white/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Borrar búsqueda"
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-xl font-bold text-carlota-wine"
            >
              ×
            </button>
          )}
        </div>
        {searching && resultCount > 0 && (
          <p role="status" className="mt-2 text-center text-[13px] opacity-90">
            {resultCount} {resultCount === 1 ? "resultado" : "resultados"}
          </p>
        )}
      </div>

      {!searching && <Favorites items={favorites} onPick={goTo} />}

      {visible.length === 0 ? (
        <p role="status" className="px-4 py-16 text-center text-base">
          No encontramos ese producto
        </p>
      ) : (
        visible.map(({ category, products }) => <CategorySection key={category.id} category={category} products={products} />)
      )}

      {sheetOpen && <CategorySheet categories={categories} active={active} onPick={goTo} onClose={() => setSheetOpen(false)} />}
    </>
  );
}
