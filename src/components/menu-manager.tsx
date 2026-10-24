"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  moveCategory,
  setCategoryVisibility,
  setProductArchived,
  setProductAvailability,
  setProductVisibility,
  type ActionResult,
} from "@/app/app/menu/actions";
import { PageHeader } from "@/components/ui";
import { CategoryDialog, PricesDialog, ProductDialog, ghostBtn, inputClass, primaryBtn } from "@/components/menu-admin/dialogs";
import { DIGITAL_MENU_URL } from "@/lib/config";
import { TAG_LABELS, formatPrice, productMatches, type Category, type Product } from "@/modules/menu/domain/catalog";
import { canManageCatalog, type CatalogRole } from "@/modules/menu/domain/catalog-admin";
import type { CatalogMode } from "@/modules/menu/infrastructure/repository-factory";

type Filter = "todos" | "agotados" | "ocultos" | "archivados";

type Dialog =
  | { kind: "category"; category: Category | null }
  | { kind: "product"; product: Product | null; categoryId: string }
  | { kind: "prices"; product: Product; category: Category }
  | null;

const MODE_BANNER: Record<CatalogMode, { tone: string; title: string; text: string }> = {
  supabase: {
    tone: "border-emerald-300 bg-emerald-50 text-emerald-950",
    title: "Conectado a Supabase",
    text: "Los cambios se guardan de forma persistente y se reflejan en el menú público (/m).",
  },
  "supabase-readonly": {
    tone: "border-red-300 bg-red-50 text-red-950",
    title: "Solo lectura: falta la llave de servidor",
    text: "Supabase está configurado pero no existe SUPABASE_SERVICE_ROLE_KEY en el servidor. No se puede guardar.",
  },
  "demo-memory": {
    tone: "border-amber-300 bg-amber-50 text-amber-950",
    title: "Modo demo (sin base de datos)",
    text: "Los cambios viven solo en la memoria del servidor y se pierden al reiniciarlo. No son datos de producción.",
  },
  "demo-readonly": {
    tone: "border-red-300 bg-red-50 text-red-950",
    title: "Modo demo de solo lectura",
    text: "No hay Supabase configurado en este entorno, así que las escrituras están desactivadas.",
  },
};

const ROLE_NOTE: Partial<Record<CatalogRole, string>> = {
  cashier: "Perfil Caja: consulta de catálogo y disponibilidad. No puedes modificarlo.",
  waiter: "Perfil Mesero: solo consulta del catálogo.",
};

export function MenuManager({
  role,
  mode,
  categories,
  loadError,
}: {
  role: CatalogRole;
  mode: CatalogMode;
  categories: Category[];
  loadError: string | null;
}) {
  const canEdit = canManageCatalog(role);
  const writable = canEdit && (mode === "supabase" || mode === "demo-memory");
  const banner = MODE_BANNER[mode];

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const sorted = useMemo(() => [...categories].sort((a, b) => a.sort - b.sort), [categories]);
  const archivedCount = categories.reduce((n, c) => n + c.products.filter((p) => p.archivedAt).length, 0);

  const report = (result: ActionResult) => setNotice({ ok: result.ok, text: result.ok ? result.message : result.error });
  const run = (action: () => Promise<ActionResult>) => start(async () => report(await action()));

  function visibleProducts(c: Category): Product[] {
    return c.products
      .filter((p) => {
        if (filter === "archivados") return Boolean(p.archivedAt);
        if (p.archivedAt) return false;
        if (filter === "agotados") return !p.available;
        if (filter === "ocultos") return !p.showInMenu || !c.showInMenu;
        return true;
      })
      .filter((p) => productMatches(p, query))
      .sort((a, b) => a.sort - b.sort);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(DIGITAL_MENU_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setNotice({ ok: false, text: "No se pudo copiar el enlace. Cópialo manualmente." });
    }
  }

  const filters: { id: Filter; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "agotados", label: "Agotados" },
    { id: "ocultos", label: "Ocultos" },
    ...(canEdit ? [{ id: "archivados" as const, label: `Archivados (${archivedCount})` }] : []),
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Menú y catálogo" subtitle="Categorías, productos, precios y disponibilidad del menú público.">
        {writable && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={ghostBtn} onClick={() => setDialog({ kind: "category", category: null })}>
              + Categoría
            </button>
            <button
              type="button"
              className={primaryBtn}
              disabled={sorted.length === 0}
              onClick={() => setDialog({ kind: "product", product: null, categoryId: sorted[0]?.id ?? "" })}
            >
              + Producto
            </button>
          </div>
        )}
      </PageHeader>

      <div className={`rounded-xl border p-3 text-sm ${banner.tone}`} role="status">
        <p className="font-semibold">{banner.title}</p>
        <p className="mt-0.5 text-xs leading-relaxed">{banner.text}</p>
      </div>
      {ROLE_NOTE[role] && <p className="rounded-xl border border-ink/10 bg-paper px-3 py-2 text-xs text-mute">{ROLE_NOTE[role]}</p>}
      {loadError && (
        <p role="alert" className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">
          {loadError}
        </p>
      )}
      <div aria-live="polite" className="min-h-0">
        {notice && (
          <p className={`rounded-xl border px-3 py-2 text-sm ${notice.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-900"}`}>
            {notice.text}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 bg-paper p-3 text-sm">
        <span className="text-mute">Menú público:</span>
        <Link href="/m" target="_blank" className="font-semibold text-wine underline-offset-2 hover:underline">
          Ver /m ↗
        </Link>
        <a href={DIGITAL_MENU_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-wine underline-offset-2 hover:underline">
          Sitio publicado ↗
        </a>
        <button type="button" onClick={copyLink} className="ml-auto min-h-[44px] rounded-lg px-3 text-xs font-semibold text-ink hover:bg-cream">
          {copied ? "✓ Enlace copiado" : "Copiar enlace"}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          className={`${inputClass} sm:max-w-xs`}
          placeholder="Buscar producto…"
          aria-label="Buscar producto"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar productos">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`min-h-[44px] rounded-full border px-4 text-sm font-medium ${filter === f.id ? "border-wine bg-wine text-cream" : "border-ink/20 bg-paper text-ink"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 && !loadError && <p className="rounded-xl border border-ink/10 bg-paper p-6 text-center text-sm text-mute">Todavía no hay categorías.</p>}

      <div className={`space-y-5 ${pending ? "opacity-70" : ""}`} aria-busy={pending}>
        {sorted.map((category, index) => {
          const products = visibleProducts(category);
          const filtering = filter !== "todos" || query.trim() !== "";
          if (filtering && products.length === 0) return null;
          return (
            <section key={category.id} className="overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-sm">
              <header className="flex flex-wrap items-center gap-2 border-b border-ink/10 bg-cream/60 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold text-ink">
                    {category.name}
                    {!category.showInMenu && <span className="ml-2 rounded-full bg-zinc-200 px-2 py-0.5 align-middle text-xs font-medium text-zinc-700">Oculta</span>}
                  </h2>
                  <p className="text-xs text-mute">
                    {category.products.filter((p) => !p.archivedAt).length} productos
                    {category.sizes.length > 0 && ` · Tallas: ${category.sizes.map((s) => s.label).join(", ")}`}
                  </p>
                </div>
                {writable && (
                  <div className="flex flex-wrap gap-1.5">
                    <IconBtn label={`Subir ${category.name}`} disabled={index === 0 || pending} onClick={() => run(() => moveCategory(category.id, "up"))}>
                      ↑
                    </IconBtn>
                    <IconBtn label={`Bajar ${category.name}`} disabled={index === sorted.length - 1 || pending} onClick={() => run(() => moveCategory(category.id, "down"))}>
                      ↓
                    </IconBtn>
                    <button type="button" className={ghostBtn} disabled={pending} onClick={() => run(() => setCategoryVisibility(category.id, !category.showInMenu))}>
                      {category.showInMenu ? "Ocultar" : "Mostrar"}
                    </button>
                    <button type="button" className={ghostBtn} onClick={() => setDialog({ kind: "category", category })}>
                      Editar
                    </button>
                    <button type="button" className={ghostBtn} onClick={() => setDialog({ kind: "product", product: null, categoryId: category.id })}>
                      + Producto
                    </button>
                  </div>
                )}
              </header>

              {products.length === 0 ? (
                <p className="px-4 py-4 text-sm text-mute">Sin productos en esta categoría.</p>
              ) : (
                <ul className="divide-y divide-ink/10">
                  {products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      category={category}
                      writable={writable}
                      pending={pending}
                      onEdit={() => setDialog({ kind: "product", product, categoryId: category.id })}
                      onPrices={() => setDialog({ kind: "prices", product, category })}
                      onAvailability={() => run(() => setProductAvailability(product.id, !product.available))}
                      onVisibility={() => run(() => setProductVisibility(product.id, !product.showInMenu))}
                      onArchive={() => run(() => setProductArchived(product.id, !product.archivedAt))}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      {dialog?.kind === "category" && <CategoryDialog category={dialog.category} onClose={() => setDialog(null)} done={report} />}
      {dialog?.kind === "product" && (
        <ProductDialog categories={sorted} product={dialog.product} defaultCategoryId={dialog.categoryId} onClose={() => setDialog(null)} done={report} />
      )}
      {dialog?.kind === "prices" && <PricesDialog category={dialog.category} product={dialog.product} onClose={() => setDialog(null)} done={report} />}
    </div>
  );
}

function IconBtn({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={`${ghostBtn} min-w-[44px] px-0`}>
      {children}
    </button>
  );
}

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>{children}</span>;
}

function ProductRow({
  product,
  category,
  writable,
  pending,
  onEdit,
  onPrices,
  onAvailability,
  onVisibility,
  onArchive,
}: {
  product: Product;
  category: Category;
  writable: boolean;
  pending: boolean;
  onEdit: () => void;
  onPrices: () => void;
  onAvailability: () => void;
  onVisibility: () => void;
  onArchive: () => void;
}) {
  const priceSlots = category.sizes.length
    ? category.sizes.map((s) => ({ label: s.label, price: product.prices[s.key] }))
    : [{ label: "", price: product.prices.unico }];

  return (
    <li className={`px-4 py-3 ${product.archivedAt ? "bg-zinc-50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink">{product.name}</p>
          {product.description && <p className="mt-0.5 line-clamp-2 text-xs text-mute">{product.description}</p>}
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {product.archivedAt && <Chip tone="bg-zinc-200 text-zinc-700">Archivado</Chip>}
            {!product.available && <Chip tone="bg-red-100 text-red-800">Agotado</Chip>}
            {product.available && !product.archivedAt && <Chip tone="bg-emerald-100 text-emerald-800">Disponible</Chip>}
            {!product.showInMenu && <Chip tone="bg-zinc-200 text-zinc-700">Oculto del menú</Chip>}
            {product.tags.map((t) => (
              <Chip key={t} tone="bg-wine/10 text-wine">
                {TAG_LABELS[t]}
              </Chip>
            ))}
          </div>
        </div>
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-right text-sm tabular-nums">
          {priceSlots.map((slot, i) => (
            <div key={slot.label || i}>
              {slot.label && <dt className="text-xs text-mute">{slot.label}</dt>}
              <dd className="font-semibold text-ink">{formatPrice(slot.price)}</dd>
            </div>
          ))}
        </dl>
      </div>

      {writable && (
        <div className="mt-3 flex flex-wrap gap-2">
          {product.archivedAt ? (
            <button type="button" className={ghostBtn} disabled={pending} onClick={onArchive}>
              Restaurar
            </button>
          ) : (
            <>
              <button type="button" className={ghostBtn} disabled={pending} onClick={onAvailability}>
                {product.available ? "Marcar agotado" : "Marcar disponible"}
              </button>
              <button type="button" className={ghostBtn} disabled={pending} onClick={onVisibility}>
                {product.showInMenu ? "Ocultar del menú" : "Mostrar en menú"}
              </button>
              <button type="button" className={ghostBtn} onClick={onPrices}>
                Precios
              </button>
              <button type="button" className={ghostBtn} onClick={onEdit}>
                Editar
              </button>
              <button type="button" className={ghostBtn} disabled={pending} onClick={onArchive}>
                Archivar
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
