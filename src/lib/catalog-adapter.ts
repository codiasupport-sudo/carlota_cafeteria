/**
 * Adaptador oficial del catálogo JSON de Cafetería Carlota.
 * Lee directamente data/catalogo.json sin modificar el archivo original.
 * Fuente única de verdad para productos, categorías, variantes y precios base.
 */

import rawCatalog from "../../data/catalogo.json";

export interface CatalogVariant {
  size: string;
  volumeMl?: number;
  price: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description?: string;
  price?: number;
  variants?: CatalogVariant[];
  categoryId: string;
  categoryName: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  sourcePage?: number;
  derivedCategory?: boolean;
  productCount: number;
}

// Procesar categorías y aplanar productos manteniendo referencias estables
const categoriesMap: CatalogCategory[] = rawCatalog.categories.map((c) => ({
  id: c.id,
  name: c.name,
  sourcePage: c.sourcePage,
  derivedCategory: c.derivedCategory,
  productCount: c.products.length,
}));

const productsMap: CatalogProduct[] = rawCatalog.categories.flatMap((cat) =>
  cat.products.map((p) => ({
    id: p.id,
    name: p.name,
    description: "description" in p ? (p.description as string) : undefined,
    price: "price" in p ? (p.price as number) : undefined,
    variants: "variants" in p ? (p.variants as CatalogVariant[]) : undefined,
    categoryId: cat.id,
    categoryName: cat.name,
  }))
);

export function getCatalogMetadata() {
  return {
    version: rawCatalog.catalogVersion,
    business: rawCatalog.business,
    currency: rawCatalog.currency,
    source: rawCatalog.source,
  };
}

export function getCategories(): CatalogCategory[] {
  return categoriesMap;
}

export function getProducts(categoryId?: string): CatalogProduct[] {
  if (!categoryId || categoryId === "Todas") {
    return productsMap;
  }
  return productsMap.filter((p) => p.categoryId === categoryId);
}

export function getProductById(id: string): CatalogProduct | undefined {
  return productsMap.find((p) => p.id === id);
}

export function searchProducts(
  query: string,
  categoryId?: string
): CatalogProduct[] {
  const q = query.trim().toLowerCase();
  const base = getProducts(categoryId);
  if (!q) return base;
  return base.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
  );
}

/**
 * Obtiene el precio real de un producto según su variante o precio base.
 * Valida que no existan precios indefinidos, negativos o nulos.
 */
export function getProductPrice(
  product: CatalogProduct,
  variantSize?: string
): number {
  if (product.variants && product.variants.length > 0) {
    if (variantSize) {
      const found = product.variants.find((v) => v.size === variantSize);
      if (found) return found.price;
    }
    // Si no se especifica variante, devuelve el precio de la primera variante como referencia
    return product.variants[0].price;
  }
  if (typeof product.price === "number") {
    return product.price;
  }
  throw new Error(`El producto ${product.id} (${product.name}) no tiene precio válido.`);
}

/**
 * Verifica si un producto requiere selección obligatoria de variante (tamaño).
 */
export function requiresVariantSelection(product: CatalogProduct): boolean {
  return Boolean(
    product.variants &&
      product.variants.length > 1
  );
}

/**
 * Construye una línea válida para carrito/comanda a partir del catálogo
 */
export interface CartItemDraft {
  productId: string;
  productName: string;
  variantSize?: string;
  displayName: string;
  unitPrice: number;
  qty: number;
  notes?: string;
  subtotal: number;
}

export function buildCartItem(
  productId: string,
  variantSize?: string,
  qty = 1,
  notes?: string
): CartItemDraft {
  const product = getProductById(productId);
  if (!product) {
    throw new Error(`Producto ${productId} no encontrado en catalogo.json`);
  }

  if (qty <= 0) {
    throw new Error(`Cantidad inválida: ${qty}`);
  }

  let finalVariant: string | undefined = variantSize;
  let price: number;

  if (product.variants && product.variants.length > 0) {
    if (!finalVariant) {
      // Si tiene una sola variante (ej. "Única" o "Chico"), usarla por defecto
      finalVariant = product.variants[0].size;
    }
    const variantObj = product.variants.find((v) => v.size === finalVariant);
    if (!variantObj) {
      throw new Error(`Variante ${finalVariant} no existe para el producto ${product.name}`);
    }
    price = variantObj.price;
  } else if (typeof product.price === "number") {
    price = product.price;
    finalVariant = undefined;
  } else {
    throw new Error(`El producto ${product.name} no cuenta con precio en catalogo.json`);
  }

  const displayName =
    finalVariant && finalVariant !== "Única"
      ? `${product.name} (${finalVariant})`
      : product.name;

  return {
    productId: product.id,
    productName: product.name,
    variantSize: finalVariant,
    displayName,
    unitPrice: price,
    qty,
    notes: notes?.trim() || undefined,
    subtotal: price * qty,
  };
}
