import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-wine-dark px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="La Carlota"
            className="w-64 rounded-xl shadow-2xl shadow-black/40"
          />
        </div>
        <div className="rounded-2xl bg-paper p-8 shadow-2xl shadow-black/30">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Sistema interno
          </h1>
          <p className="mt-1 text-sm text-mute">
            Selecciona tu rol, tu nombre e ingresa tu código de 4 dígitos.
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
