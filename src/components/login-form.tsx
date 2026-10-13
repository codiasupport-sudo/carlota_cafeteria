"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { USERS } from "@/lib/mock-data";
import { ROLE_PINS } from "@/lib/roles";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { PinInput } from "@/components/pin-input";

const ROLES: Role[] = ["admin", "caja", "mesero", "cocina"];

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
                setPin("");
                setError(null);
              }}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                role === r
                  ? "border-wine bg-wine text-cream"
                  : "border-ink/15 bg-cream text-ink hover:border-wine/40"
              }`}
            >
              {ROLE_LABELS[r]}
              <span className="mt-0.5 block text-[11px] font-normal opacity-70">
                código {ROLE_PINS[r]}
              </span>
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

      {role && (
        <div>
          <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-mute">
            Código de acceso
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
            <p className="mt-3 text-center text-sm text-red-700">{error}</p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={!role || !user || pin.length !== 4}
        className="w-full rounded-lg bg-wine py-3 font-medium text-cream transition-colors hover:bg-wine-light disabled:cursor-not-allowed disabled:opacity-40"
      >
        Entrar
      </button>

      <div className="rounded-lg bg-cream px-4 py-3 text-xs text-mute">
        <p className="mb-1 font-medium uppercase tracking-wider">
          Códigos de prueba
        </p>
        <p className="grid grid-cols-2 gap-x-4">
          {ROLES.map((r) => (
            <span key={r}>
              {ROLE_LABELS[r]}: <strong className="text-ink">{ROLE_PINS[r]}</strong>
            </span>
          ))}
        </p>
      </div>
    </form>
  );
}
