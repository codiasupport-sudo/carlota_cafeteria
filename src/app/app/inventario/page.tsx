import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InventoryTable } from "@/components/inventory-table";
import type { Role } from "@/lib/types";

export default async function InventarioPage() {
  const store = await cookies();
  const role = store.get("carlota-role")?.value as Role | undefined;

  // Solo Administrador puede acceder a Inventario
  if (role !== "admin") {
    redirect(role === "mesero" ? "/app/pedidos" : "/app");
  }

  return <InventoryTable />;
}
