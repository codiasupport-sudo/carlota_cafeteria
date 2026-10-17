import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";
import type { Role } from "@/lib/types";

const VALID_ROLES: Role[] = ["admin", "caja", "mesero"];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <Session>{children}</Session>
    </Suspense>
  );
}

async function Session({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const role = store.get("carlota-role")?.value as Role | undefined;
  const user = store.get("carlota-user")?.value;

  if (!role || !VALID_ROLES.includes(role) || !user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-cream">
      <Sidebar role={role} user={decodeURIComponent(user)} />
      <main className="flex-1 overflow-x-auto p-4 sm:p-6 lg:p-8 pb-28 lg:pb-16">{children}</main>
    </div>
  );
}
