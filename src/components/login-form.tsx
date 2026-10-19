"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { USERS } from "@/lib/mock-data";
import { ROLE_PINS } from "@/lib/roles";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { PinInput } from "@/components/pin-input";

const ROLES: Role[] = ["admin", "caja", "mesero"];

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const roleUsers = role ? USERS.filter((u) => u.role === role) : [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !user) return;
    if (pin !== ROLE_PINS[role]) {
      setError("Código incorrecto para ese rol.");
      return;
    }
    const maxAge = 60 * 60 * 12;
    document.cookie = `carlota-role=${role}; path=/; max-age=${maxAge}`;
    document.cookie = `carlota-user=${encodeURIComponent(user)}; path=/; max-age=${maxAge}`;
    // Mesero inicia directamente en la pantalla de pedidos
    const targetUrl = role === "mesero" ? "/app/pedidos" : "/app";
    router.push(targetUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div>
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-mute">
          1. Selecciona tu perfil operativo
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setUser(null);
                setPin("");
                setError(null);
              }}
              className={`min-h-[52px] rounded-xl border p-3 text-left font-medium transition-all active:scale-[0.98] ${
                role === r
                  ? "border-wine bg-wine text-cream shadow-sm"
                  : "border-ink/15 bg-cream text-ink hover:border-wine/40"
              }`}
            >
              <div className="font-semibold text-sm">{ROLE_LABELS[r]}</div>
              <span className="mt-0.5 block text-[11px] font-normal opacity-75">
                PIN: {ROLE_PINS[r]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {role && (
        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-mute">
            2. Selecciona tu usuario
          </span>
          <div className="flex flex-wrap gap-2">
            {roleUsers.map((u) => (
              <button
                key={u.name}
                type="button"
                onClick={() => setUser(u.name)}
                className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                  user === u.name
                    ? "border-wine bg-wine text-cream shadow-sm"
                    : "border-ink/15 text-ink hover:border-wine/40 bg-paper"
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {role && (
        <div>
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-mute">
            3. Ingresa tu código PIN
          </span>
          <PinInput
            value={pin}
            onChange={(v) => {
              setPin(v);
              setError(null);
            }}
            hasError={!!error}
          />
          {error && (
            <p className="mt-3 text-center text-sm font-medium text-red-700">{error}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!role || !user || pin.length !== 4}
        className="min-h-[50px] w-full rounded-xl bg-wine py-3 font-semibold text-cream transition-all hover:bg-wine-light active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Entrar al sistema
      </button>

      <div className="rounded-xl border border-ink/10 bg-cream/70 p-4 text-xs text-mute">
        <p className="mb-1.5 font-semibold uppercase tracking-wider text-ink/80">
          Credenciales de demostración
        </p>
        <p className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {ROLES.map((r) => (
            <span key={r}>
              {ROLE_LABELS[r]}: <strong className="text-ink">{ROLE_PINS[r]}</strong>
            </span>
          ))}
        </p>
        <p className="mt-2 text-[11px] text-mute/80 italic">
          Nota: En esta fase de prototipo los accesos son demostrativos para validación funcional.
        </p>
      </div>
    </form>
  );
}
