import { cookies } from "next/headers";
import { OrdersBoard } from "@/components/orders-board";
import type { Role } from "@/lib/types";

export default async function PedidosPage() {
  const store = await cookies();
  const role = (store.get("carlota-role")?.value ?? "mesero") as Role;
  const user = decodeURIComponent(store.get("carlota-user")?.value ?? "Mesero");

  return <OrdersBoard role={role} user={user} />;
}
