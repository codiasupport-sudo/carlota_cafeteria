import type { VisitRepository } from "../ports/menu-repository";

/** RF-14: una visita con fecha y hora; "now" llega por parámetro. */
export async function registerVisit(repo: VisitRepository, now: Date): Promise<void> {
  await repo.add(now);
}
