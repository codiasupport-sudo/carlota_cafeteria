import { redirect } from "next/navigation";

/**
 * Módulo de cocina desactivado operativamente.
 * Según el diagnóstico aprobado de Cafetería Carlota, cocina y barra
 * no utilizan pantallas ni inician sesión; los pedidos se gestionan
 * mediante comandas impresas.
 */
export default function CocinaPage() {
  redirect("/app");
}
