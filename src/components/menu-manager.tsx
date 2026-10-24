"use client";

import { useState } from "react";
import { DIGITAL_MENU_URL } from "@/lib/config";
import type { Role } from "@/lib/types";
import { PageHeader } from "@/components/ui";

export function MenuManager({ role = "admin" }: { role?: Role }) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(DIGITAL_MENU_URL);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = DIGITAL_MENU_URL;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Error al copiar enlace:", err);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menú digital"
        subtitle="Acceso al catálogo público de comensales disponible para consulta y escaneo por QR."
      />

      {/* Tarjeta principal de acceso y compartición */}
      <div className="rounded-2xl border border-ink/10 bg-paper p-6 sm:p-8 shadow-sm">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-wine/20 bg-wine/10 px-3.5 py-1 text-xs font-semibold text-wine mb-4">
            <span>🌐</span>
            <span>Aplicación Web Independiente</span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Catálogo y Menú Digital La Carlota
          </h2>

          <p className="mt-2 text-sm sm:text-base text-mute leading-relaxed">
            Los comensales acceden a este menú desde sus dispositivos móviles escaneando los códigos QR de las mesas o mediante el enlace web directo.
          </p>

          {/* Acciones principales */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={DIGITAL_MENU_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-wine px-6 py-3 text-sm font-semibold text-cream shadow-md transition-all hover:bg-wine-light active:scale-95 focus:outline-hidden focus:ring-3 focus:ring-wine/40"
              aria-label="Abrir menú digital en pestaña nueva"
            >
              <span>Abrir menú digital</span>
              <span className="text-base" aria-hidden="true">↗</span>
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-ink/20 bg-cream/60 px-5 py-3 text-sm font-semibold text-ink transition-all hover:bg-cream hover:border-ink/30 active:scale-95 focus:outline-hidden focus:ring-3 focus:ring-wine/20"
              aria-label="Copiar enlace del menú digital al portapapeles"
            >
              <span>{copied ? "✓" : "📋"}</span>
              <span>{copied ? "¡Enlace copiado!" : "Copiar enlace"}</span>
            </button>
          </div>

          {/* Enlace en texto para mayor transparencia */}
          <div className="mt-4 flex items-center gap-2 text-xs text-mute font-mono break-all bg-cream/40 p-2.5 rounded-lg border border-ink/5">
            <span className="font-sans text-ink/70 shrink-0 font-medium">URL:</span>
            <span className="select-all">{DIGITAL_MENU_URL}</span>
          </div>

          {/* Nota regulatoria y arquitectónica */}
          <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950">
            <p className="font-semibold flex items-center gap-1.5">
              <span>ℹ️</span>
              <span>Nota de operación:</span>
            </p>
            <p className="mt-1 text-amber-900/90 leading-relaxed">
              El menú se administra y publica desde una aplicación independiente. Los cambios de disponibilidad inmediata en el POS no alteran la versión pública hasta su sincronización formal.
            </p>
          </div>
        </div>
      </div>

      {/* Vista previa visual no interactiva */}
      <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-ink mb-3">
          Vista previa del menú para comensal
        </h3>
        <p className="text-xs text-mute mb-5">
          Diseño optimizado para pantallas táctiles de celulares (desde 320 px hasta iPad).
        </p>

        <div className="mx-auto max-w-sm rounded-2xl border-4 border-wine/30 bg-[#62110D] p-4 text-white shadow-lg">
          <div className="text-center pb-3 border-b border-white/20">
            <p className="text-xs uppercase tracking-widest text-white/80 font-medium">
              La Carlota · Menú
            </p>
            <p className="font-serif italic text-lg text-cream mt-0.5">
              Sabores que se quedan contigo
            </p>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
              <span className="font-medium">☕ Bebidas calientes y frías</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">15 Categorías</span>
            </div>
            <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
              <span className="font-medium">⭐ Los más pedidos</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Destacados</span>
            </div>
            <div className="flex justify-between items-center bg-white/10 p-2 rounded-lg">
              <span className="font-medium">🔍 Búsqueda rápida de platillos</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Filtros</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/20 text-center">
            <a
              href={DIGITAL_MENU_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full py-2 bg-white text-[#62110D] text-xs font-bold rounded-lg hover:bg-cream transition-colors text-center"
            >
              Ver en vivo en Vercel ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
