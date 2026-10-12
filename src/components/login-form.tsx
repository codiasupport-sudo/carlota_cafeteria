"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { USERS } from "@/lib/mock-data";
import { ROLE_LABELS, type Role } from "@/lib/types";

const ROLES: Role[] = ["admin", "caja", "mesero", "cocina"];

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<string | null>(null);

  const roleUsers = role ? USERS.filter((u) => u.role === role) : [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !user) return;
    const maxAge = 60 * 60 * 12;
    document.cookie = `carlota-role=${role}; path=/; max-age=${maxAge}`;
    document.cookie = `carlota-user=${encodeURIComponent(user)}; path=/; max-age=${maxAge}`;
    router.push("/app");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-mute">
          Rol
        </span>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setUser(null);
              }}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                role === r
                  ? "border-wine bg-wine text-cream"
                  : "border-ink/15 bg-cream text-ink hover:border-wine/40"
              }`}
            >
              {ROLE_LABELS[r]}
            </button>
          ))}
        </div>
      </div>

      {role && (
        <div>
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-mute">
            Nombre
          </span>
          <div className="flex flex-wrap gap-2">
            {roleUsers.map((u) => (
              <button
                key={u.name}
                type="button"
                onClick={() => setUser(u.name)}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  user === u.name
                    ? "border-wine bg-wine text-cream"
                    : "border-ink/15 text-ink hover:border-wine/40"
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!role || !user}
        className="w-full rounded-lg bg-wine py-3 font-medium text-cream transition-colors hover:bg-wine-light disabled:cursor-not-allowed disabled:opacity-40"
      >
        Entrar
      </button>
      <p className="text-center text-xs text-mute">
        Prototipo — sin contraseña ni base de datos.
      </p>
    </form>
  );
}
