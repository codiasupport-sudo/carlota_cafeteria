"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createProduct,
  loadPriceHistory,
  saveCategory,
  saveProductPrices,
  updateProduct,
  type ActionResult,
} from "@/app/app/menu/actions";
import { SINGLE_PRICE_KEY, TAG_LABELS, formatPrice, type Category, type Product, type ProductTag } from "@/modules/menu/domain/catalog";
import { parsePriceInput } from "@/modules/menu/domain/catalog-admin";
import type { PriceHistoryEntry } from "@/modules/menu/ports/catalog-admin-repository";

export const inputClass =
  "w-full min-h-[44px] rounded-xl border border-ink/20 bg-cream/60 px-3 py-2 text-sm text-ink placeholder:text-mute/70 focus:border-wine/50 focus:outline-hidden focus:ring-3 focus:ring-wine/20";
export const primaryBtn =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-wine px-5 py-2.5 text-sm font-semibold text-cream shadow-sm transition-all hover:bg-wine-light active:scale-95 disabled:opacity-60 focus:outline-hidden focus:ring-3 focus:ring-wine/40";
export const ghostBtn =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-ink/20 bg-cream/60 px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-cream active:scale-95 disabled:opacity-60 focus:outline-hidden focus:ring-3 focus:ring-wine/20";

type Done = (result: ActionResult) => void;

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-paper p-5 shadow-2xl sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="min-h-[44px] min-w-[44px] rounded-lg text-xl text-mute hover:bg-cream">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-mute">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex min-h-[44px] cursor-pointer items-center gap-3 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-wine" />
      {label}
    </label>
  );
}

function ErrorLine({ message }: { message: string | null }) {
  return message ? (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  ) : null;
}

function FormActions({ pending, onClose, submit }: { pending: boolean; onClose: () => void; submit: string }) {
  return (
    <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
      <button type="button" onClick={onClose} className={ghostBtn}>
        Cancelar
      </button>
      <button type="submit" disabled={pending} className={primaryBtn}>
        {pending ? "Guardando…" : submit}
      </button>
    </div>
  );
}

/** Corre una acción; cierra el diálogo si salió bien y deja el error en pantalla si no. */
function useSubmit(done: Done, onClose: () => void) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const submit = (action: () => Promise<ActionResult>) => {
    setError(null);
    start(async () => {
      const result = await action();
      if (result.ok) {
        done(result);
        onClose();
      } else {
        setError(result.error);
      }
    });
  };
  return { pending, error, submit };
}

// ───────────────────────── Categoría ─────────────────────────

interface SizeRow {
  key?: string;
  label: string;
  detail: string;
}

export function CategoryDialog({ category, onClose, done }: { category: Category | null; onClose: () => void; done: Done }) {
  const [name, setName] = useState(category?.name ?? "");
  const [subtitle, setSubtitle] = useState(category?.subtitle ?? "");
  const [note, setNote] = useState(category?.note ?? "");
  const [showInMenu, setShowInMenu] = useState(category?.showInMenu ?? true);
  const [sizes, setSizes] = useState<SizeRow[]>(
    category?.sizes.map((s) => ({ key: s.key, label: s.label, detail: s.detail ?? "" })) ?? [],
  );
  const { pending, error, submit } = useSubmit(done, onClose);

  const patchSize = (i: number, patch: Partial<SizeRow>) => setSizes((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <Modal title={category ? "Editar categoría" : "Nueva categoría"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(() => saveCategory(category?.id ?? null, { name, subtitle, note, showInMenu, sizes }));
        }}
      >
        <Field label="Nombre">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required autoFocus />
        </Field>
        <Field label="Subtítulo (opcional)">
          <input className={inputClass} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Nota (opcional)" hint="Se muestra bajo el nombre en el menú público.">
          <textarea className={inputClass} rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </Field>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-mute">Tallas (opcional)</legend>
          <p className="text-xs text-mute">Sin tallas, los productos llevan precio único. Con tallas, un precio por talla.</p>
          {sizes.map((s, i) => (
            <div key={s.key ?? `new-${i}`} className="flex items-center gap-2">
              <input
                aria-label={`Nombre de talla ${i + 1}`}
                className={inputClass}
                placeholder="Grande"
                value={s.label}
                maxLength={30}
                onChange={(e) => patchSize(i, { label: e.target.value })}
              />
              <input
                aria-label={`Detalle de talla ${i + 1}`}
                className={inputClass}
                placeholder="470 ml"
                value={s.detail}
                maxLength={30}
                onChange={(e) => patchSize(i, { detail: e.target.value })}
              />
              <button
                type="button"
                aria-label={`Quitar talla ${s.label || i + 1}`}
                onClick={() => setSizes((rows) => rows.filter((_, j) => j !== i))}
                className="min-h-[44px] min-w-[44px] rounded-xl border border-ink/15 text-mute hover:bg-cream"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setSizes((rows) => [...rows, { label: "", detail: "" }])} className={ghostBtn}>
            + Agregar talla
          </button>
        </fieldset>

        <Check label="Visible en el menú público" checked={showInMenu} onChange={setShowInMenu} />
        <ErrorLine message={error} />
        <FormActions pending={pending} onClose={onClose} submit={category ? "Guardar cambios" : "Crear categoría"} />
      </form>
    </Modal>
  );
}

// ───────────────────────── Precios ─────────────────────────

function PriceInputs({ category, values, onChange }: { category: Category; values: Record<string, string>; onChange: (key: string, v: string) => void }) {
  const slots = category.sizes.length
    ? category.sizes.map((s) => ({ key: s.key, label: s.detail ? `${s.label} · ${s.detail}` : s.label }))
    : [{ key: SINGLE_PRICE_KEY, label: "Precio único" }];
  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const parsed = parsePriceInput(values[slot.key] ?? "");
        return (
          <Field key={slot.key} label={`${slot.label} (MXN)`} hint={parsed ? `Se guardará como ${formatPrice(parsed)}` : "Ej. 85.00 o 1,250.50. Déjalo vacío si no aplica."}>
            <input
              className={inputClass}
              inputMode="decimal"
              placeholder="85.00"
              value={values[slot.key] ?? ""}
              onChange={(e) => onChange(slot.key, e.target.value)}
            />
          </Field>
        );
      })}
    </div>
  );
}

export function PricesDialog({ category, product, onClose, done }: { category: Category; product: Product; onClose: () => void; done: Done }) {
  const [values, setValues] = useState<Record<string, string>>({ ...product.prices });
  const [history, setHistory] = useState<PriceHistoryEntry[] | null>(null);
  const { pending, error, submit } = useSubmit(done, onClose);

  useEffect(() => {
    let alive = true;
    loadPriceHistory(product.id).then((h) => alive && setHistory(h));
    return () => {
      alive = false;
    };
  }, [product.id]);

  const labelOf = (key: string) => category.sizes.find((s) => s.key === key)?.label ?? "Único";

  return (
    <Modal title={`Precios · ${product.name}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(() => saveProductPrices(product.id, values));
        }}
      >
        <PriceInputs category={category} values={values} onChange={(k, v) => setValues((cur) => ({ ...cur, [k]: v }))} />
        <ErrorLine message={error} />

        <div className="rounded-xl border border-ink/10 bg-cream/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-mute">Historial de cambios</p>
          {history === null ? (
            <p className="mt-1 text-xs text-mute">Cargando…</p>
          ) : history.length === 0 ? (
            <p className="mt-1 text-xs text-mute">Sin cambios registrados todavía.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-xs text-ink">
              {history.map((h) => (
                <li key={h.id}>
                  {labelOf(h.priceKey)}: {formatPrice(h.oldPrice)} → {formatPrice(h.newPrice)}{" "}
                  <span className="text-mute">
                    · {h.changedBy} · {new Date(h.changedAt).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <FormActions pending={pending} onClose={onClose} submit="Guardar precios" />
      </form>
    </Modal>
  );
}

// ───────────────────────── Producto ─────────────────────────

export function ProductDialog({
  categories,
  product,
  defaultCategoryId,
  onClose,
  done,
}: {
  categories: Category[];
  product: Product | null;
  defaultCategoryId: string;
  onClose: () => void;
  done: Done;
}) {
  const currentCategoryId = product ? (categories.find((c) => c.products.some((p) => p.id === product.id))?.id ?? defaultCategoryId) : defaultCategoryId;
  const [categoryId, setCategoryId] = useState(currentCategoryId);
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [tags, setTags] = useState<ProductTag[]>(product?.tags ?? []);
  const [showInMenu, setShowInMenu] = useState(product?.showInMenu ?? true);
  const [available, setAvailable] = useState(product?.available ?? true);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const { pending, error, submit } = useSubmit(done, onClose);

  const category = categories.find((c) => c.id === categoryId);
  const toggleTag = (tag: ProductTag) => setTags((cur) => (cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag]));

  return (
    <Modal title={product ? "Editar producto" : "Nuevo producto"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const base = { categoryId, name, description, tags, showInMenu, available };
          submit(() => (product ? updateProduct(product.id, base) : createProduct({ ...base, prices })));
        }}
      >
        <Field label="Categoría">
          <select
            className={inputClass}
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPrices({});
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nombre">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoFocus />
        </Field>
        <Field label="Descripción (opcional)">
          <textarea className={inputClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
        </Field>

        <fieldset>
          <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-mute">Etiquetas</legend>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(TAG_LABELS) as ProductTag[]).map((tag) => (
              <button
                key={tag}
                type="button"
                aria-pressed={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
                className={`min-h-[44px] rounded-full border px-4 text-sm font-medium ${tags.includes(tag) ? "border-wine bg-wine text-cream" : "border-ink/20 bg-cream/60 text-ink"}`}
              >
                {TAG_LABELS[tag]}
              </button>
            ))}
          </div>
        </fieldset>

        {!product && category && <PriceInputs category={category} values={prices} onChange={(k, v) => setPrices((cur) => ({ ...cur, [k]: v }))} />}
        {product && <p className="text-xs text-mute">Los precios se cambian con el botón «Precios» del producto, para dejar registro del cambio.</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2">
          <Check label="Disponible (no agotado)" checked={available} onChange={setAvailable} />
          <Check label="Visible en el menú público" checked={showInMenu} onChange={setShowInMenu} />
        </div>
        <ErrorLine message={error} />
        <FormActions pending={pending} onClose={onClose} submit={product ? "Guardar cambios" : "Crear producto"} />
      </form>
    </Modal>
  );
}
