"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/roles";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { DIGITAL_MENU_URL } from "@/lib/config";

export function Sidebar({ role, user }: { role: Role; user: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  function logout() {
    document.cookie = "carlota-role=; path=/; max-age=0";
    document.cookie = "carlota-user=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <>
      {/* Barra superior para iPad y móviles */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-wine-dark px-4 py-3 text-cream lg:hidden">
        <div className="flex items-center gap-3">
          {role !== "mesero" ? (
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú de navegación"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-wine-light/50 text-xl transition-colors hover:bg-wine-light active:bg-wine-light"
            >
              ☰
            </button>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-light text-base font-bold shadow-xs">
              LC
            </div>
          )}
          <div>
            <h1 className="font-display text-base font-semibold tracking-wide">
              La Carlota
            </h1>
            <p className="text-[11px] text-cream/75">
              {role === "mesero" ? "Servicio de Salón" : ROLE_LABELS[role]} · <span className="text-cream font-medium">{user}</span>
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="min-h-[36px] rounded-lg border border-cream/25 px-3 py-1.5 text-xs font-semibold text-cream/90 hover:bg-cream/10 active:bg-cream/20"
        >
          Salir
        </button>
      </header>

      {/* Barra de navegación inferior Mobile-First para Mesero */}
      {role === "mesero" && (
        <nav
          aria-label="Navegación inferior para mesero"
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-ink/10 bg-paper/95 px-6 py-2 shadow-2xl backdrop-blur-md pb-[max(0.6rem,env(safe-area-inset-bottom))] lg:hidden"
        >
          {/* 1. Pedidos activos */}
          <Link
            href="/app/pedidos"
            className={`flex flex-col items-center justify-center min-h-[46px] min-w-[64px] rounded-xl px-2 py-1 text-xs font-semibold transition-all active:scale-95 ${
              pathname === "/app/pedidos"
                ? "text-wine"
                : "text-mute hover:text-ink"
            }`}
          >
            <span className="text-xl leading-none">≡</span>
            <span className="mt-1 text-[11px]">Pedidos</span>
          </Link>

          {/* 2. Botón de acción principal: + Nuevo pedido */}
          <Link
            href="/app/pedidos?nuevo=1"
            className="relative -top-3 flex h-14 w-14 items-center justify-center rounded-full bg-wine text-cream shadow-xl ring-4 ring-paper transition-all hover:bg-wine-light active:scale-90"
            aria-label="Crear nuevo pedido"
          >
            <span className="text-2xl font-bold leading-none">+</span>
          </Link>

          {/* 3. Menú de consulta */}
          <Link
            href="/app/menu"
            className={`flex flex-col items-center justify-center min-h-[46px] min-w-[64px] rounded-xl px-2 py-1 text-xs font-semibold transition-all active:scale-95 ${
              pathname === "/app/menu"
                ? "text-wine"
                : "text-mute hover:text-ink"
            }`}
          >
            <span className="text-xl leading-none">❏</span>
            <span className="mt-1 text-[11px]">Menú</span>
          </Link>
        </nav>
      )}

      {/* Drawer móvil / iPad */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop con desenfoque */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="relative flex w-72 max-w-[80vw] flex-col bg-wine-dark text-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-cream/10 p-4">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-lg">La Carlota</span>
                <span className="rounded-full bg-cream/15 px-2 py-0.5 text-[11px] font-medium">
                  {ROLE_LABELS[role]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-cream/70 hover:bg-cream/10 hover:text-cream"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto p-3">
              {items.map((item) => {
                const active =
                  item.href === "/app"
                    ? pathname === "/app"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex min-h-[48px] items-center gap-3.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-wine-light text-cream shadow-xs"
                        : "text-cream/70 hover:bg-cream/10 hover:text-cream"
                    }`}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cream/10 text-base">
                      {item.icon}
                    </span>
                    <div>
                      <div>{item.label}</div>
                      {item.description && (
                        <div className="text-[11px] font-normal opacity-60">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Acceso directo a Menú Digital comensal */}
              <div className="pt-2">
                <a
                  href={DIGITAL_MENU_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[46px] items-center justify-between rounded-xl border border-cream/25 bg-cream/10 px-4 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-cream/20 active:scale-95"
                >
                  <span className="flex items-center gap-2.5">
                    <span>📖</span>
                    <span>Menú digital comensal</span>
                  </span>
                  <span className="text-sm font-bold" aria-hidden="true">↗</span>
                </a>
              </div>
            </nav>

            <div className="border-t border-cream/10 p-4">
              <p className="text-sm font-semibold">{user}</p>
              <p className="text-xs text-cream/60">{ROLE_LABELS[role]}</p>
              <button
                onClick={logout}
                className="mt-3 flex min-h-[44px] w-full items-center justify-center rounded-xl border border-cream/25 py-2.5 text-xs font-semibold text-cream/90 transition-colors hover:bg-cream/10 active:bg-cream/20"
              >
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Sidebar fijo para escritorio y pantallas grandes */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-wine-dark text-cream lg:flex">
        <div className="border-b border-cream/10 p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="La Carlota" className="w-full rounded-xl shadow-xs" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-wine-light text-cream shadow-xs"
                    : "text-cream/65 hover:bg-cream/10 hover:text-cream"
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cream/10 text-base">
                  {item.icon}
                </span>
                <div>
                  <div className="leading-tight">{item.label}</div>
                  {item.description && (
                    <div className="text-[11px] font-normal opacity-60 leading-tight">
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Acceso directo a Menú Digital comensal en desktop */}
          <div className="pt-3 px-0.5">
            <a
              href={DIGITAL_MENU_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center justify-between rounded-xl border border-cream/20 bg-cream/10 px-3.5 py-2.5 text-xs font-semibold text-cream transition-colors hover:bg-cream/20 active:scale-95"
              title="Abrir menú digital para comensales en pestaña nueva"
            >
              <span className="flex items-center gap-2">
                <span>📖</span>
                <span>Menú digital</span>
              </span>
              <span className="text-sm font-bold" aria-hidden="true">↗</span>
            </a>
          </div>
        </nav>

        <div className="border-t border-cream/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-cream">{user}</p>
              <p className="text-xs text-cream/60">{ROLE_LABELS[role]}</p>
            </div>
            <span className="rounded-full bg-cream/15 px-2 py-0.5 text-[10px] font-medium uppercase">
              {role}
            </span>
          </div>
          <button
            onClick={logout}
            className="mt-3 flex min-h-[40px] w-full items-center justify-center rounded-lg border border-cream/20 py-2 text-xs font-medium text-cream/80 transition-colors hover:border-cream/40 hover:bg-cream/10 active:bg-cream/20"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
