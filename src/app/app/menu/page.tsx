import { cookies } from "next/headers";
import { MenuManager } from "@/components/menu-manager";
import type { Role } from "@/lib/types";

export default async function MenuPage() {
  const store = await cookies();
  const role = (store.get("carlota-role")?.value ?? "mesero") as Role;

  return <MenuManager role={role} />;
}
