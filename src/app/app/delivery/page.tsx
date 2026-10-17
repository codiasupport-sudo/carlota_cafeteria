import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DeliveryTracker } from "@/components/delivery-tracker";
import type { Role } from "@/lib/types";

export default async function DeliveryPage() {
  const store = await cookies();
  const role = store.get("carlota-role")?.value as Role | undefined;

  // Mesero no tiene autorización para gestionar delivery
  if (role === "mesero") {
    redirect("/app/pedidos");
  }

  return <DeliveryTracker />;
}
