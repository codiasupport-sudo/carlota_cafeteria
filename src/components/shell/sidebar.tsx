"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ITEMS } from "@/lib/roles";
import { ROLE_LABELS, type Role } from "@/lib/types";

export function Sidebar({ role, user }: { role: Role; user: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  function logout() {
    document.cookie = "carlota-role=; path=/; max-age=0";
    document.cookie = "carlota-user=; path=/; max-age=0";
    router.push("/login");
  }

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-wine-dark text-cream">
      <div className="border-b border-cream/10 p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.jpg" alt="La Carlota" className="w-full rounded-lg" />
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
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-wine-light text-cream"
                  : "text-cream/60 hover:bg-cream/10 hover:text-cream"
              }`}
            >
              <span className="w-5 text-center text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-cream/10 p-4">
        <p className="text-sm font-medium">{user}</p>
        <p className="text-xs text-cream/50">{ROLE_LABELS[role]}</p>
        <button
          onClick={logout}
          className="mt-3 w-full rounded-lg border border-cream/20 py-2 text-xs font-medium text-cream/70 transition-colors hover:border-cream/40 hover:text-cream"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
