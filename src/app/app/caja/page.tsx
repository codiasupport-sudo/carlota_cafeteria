import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CashierPanel } from "@/components/cashier-panel";
import type { Role } from "@/lib/types";

export default async function CajaPage() {
  const store = await cookies();
  const role = store.get("carlota-role")?.value as Role | undefined;

  // Mesero no tiene autorización para acceder a caja
  if (role === "mesero") {
    redirect("/app/pedidos");
  }

  return <CashierPanel />;
}
