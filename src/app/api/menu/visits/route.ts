import { registerVisit } from "@/modules/menu/application/register-visit";
import { getMenuRepository } from "@/modules/menu/infrastructure/repository-factory";

/** RF-14: registra una visita; nunca falla hacia el comensal. */
export async function POST() {
  try {
    await registerVisit(getMenuRepository(), new Date());
  } catch (err) {
    console.error("visit:", err instanceof Error ? err.message : err);
  }
  return new Response(null, { status: 204 });
}
