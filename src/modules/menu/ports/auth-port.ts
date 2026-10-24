// Lo implementa la app que monta el módulo (tabla de roles acordada con el POS). Se usa desde la spec 002.
export type Role = "owner" | "admin" | "cashier";

export interface AuthPort {
  getCurrentUser(): Promise<{ id: string; name: string | null } | null>;
  getRole(): Promise<Role | null>;
}
